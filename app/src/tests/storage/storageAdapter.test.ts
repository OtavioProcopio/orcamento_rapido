import {
  normalizeBudget,
  normalizeBudgetItem,
  storageAdapter,
} from "../../storage/storageAdapter";
import type { Budget, MeiProfile } from "../../types";

describe("storageAdapter", () => {
  const originalIndexedDB = globalThis.indexedDB;
  const baseBudget = {
    status: "draft" as const,
    items: [],
    discount: 0,
    modules: { showTerms: true, showSignature: true, removeAds: false },
    totals: { subtotal: 0, discount: 0, total: 0 },
  };

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: undefined,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: originalIndexedDB,
    });
  });

  it("saves and reads profile", async () => {
    const profile: MeiProfile = {
      companyName: "Empresa",
      userName: "Usuario",
      phone: "11999999999",
      pixKey: "pix",
      logo: "data:image/png;base64,abc",
    };

    await storageAdapter.saveProfile(profile);
    await expect(storageAdapter.getProfile()).resolves.toEqual(profile);
  });

  it("adds budget on top", async () => {
    const budgetA: Budget = {
      id: "a", number: 1,
      createdAt: new Date().toISOString(),
      client: { name: "Cliente A" },
      ...baseBudget,
    };
    const budgetB: Budget = {
      id: "b", number: 2,
      createdAt: new Date().toISOString(),
      client: { name: "Cliente B" },
      ...baseBudget,
    };

    await storageAdapter.addBudget(budgetA);
    const updated = await storageAdapter.addBudget(budgetB);

    expect(updated[0].id).toBe("b");
    expect(updated[1].id).toBe("a");
  });

  it("updates budget fields", async () => {
    const budget: Budget = {
      id: "a", number: 1,
      createdAt: new Date().toISOString(),
      client: { name: "Cliente A" },
      ...baseBudget,
    };

    await storageAdapter.addBudget(budget);
    const updated = await storageAdapter.updateBudget("a", {
      pdfDataUrl: "data:application/pdf;base64,ZmFrZQ==",
    });

    expect(updated[0].id).toBe("a");
    expect(updated[0].pdfDataUrl).toMatch(/^data:application\/pdf/);
  });

  it("handles empty values gracefully", async () => {
    localStorage.setItem(
      "@OrcaRapido:budgets",
      JSON.stringify([null, "invalid", { items: [{}] }]),
    );
    const budgets = await storageAdapter.getBudgets();
    expect(budgets.length).toBe(1);
    expect(budgets[0].items.length).toBe(1);
  });

  it("saves and clears budgets using local storage fallback", async () => {
    const budget: Budget = {
      id: "fallback",
      number: 3,
      createdAt: new Date().toISOString(),
      client: { name: "Cliente Fallback" },
      ...baseBudget,
    };

    await storageAdapter.saveBudgets([budget]);
    expect(localStorage.getItem("@OrcaRapido:budgets")).toContain("fallback");

    await storageAdapter.clearBudgets();
    expect(localStorage.getItem("@OrcaRapido:budgets")).toBeNull();
  });

  it("reads invalid legacy profile data as null", async () => {
    localStorage.setItem("@OrcaRapido:mei_profile", "{invalid");

    await expect(storageAdapter.getProfile()).resolves.toBeNull();
  });

  it("keeps addBudget idempotent for duplicate ids", async () => {
    const budgetA: Budget = {
      id: "same",
      number: 1,
      createdAt: "2026-05-09T00:00:00.000Z",
      client: { name: "Cliente A" },
      ...baseBudget,
    };
    const budgetB: Budget = {
      ...budgetA,
      number: 99,
      client: { name: "Cliente Atualizado" },
    };

    await storageAdapter.addBudget(budgetA);
    const updated = await storageAdapter.addBudget(budgetB);

    expect(updated).toHaveLength(1);
    expect(updated[0].number).toBe(99);
    expect(updated[0].client.name).toBe("Cliente Atualizado");
  });

  it("returns unchanged list when updating unknown ids", async () => {
    const budget: Budget = {
      id: "known",
      number: 1,
      createdAt: new Date().toISOString(),
      client: { name: "Cliente" },
      ...baseBudget,
    };

    await storageAdapter.addBudget(budget);
    const updated = await storageAdapter.updateBudget("missing", {
      status: "approved",
    });

    expect(updated).toEqual([
      expect.objectContaining({
        id: "known",
        number: 1,
        status: "draft",
        client: expect.objectContaining({ name: "Cliente" }),
      }),
    ]);
  });

  it("deletes a single budget and keeps the rest", async () => {
    const budgetA: Budget = {
      id: "a",
      number: 1,
      createdAt: new Date().toISOString(),
      client: { name: "Cliente A" },
      ...baseBudget,
    };
    const budgetB: Budget = {
      id: "b",
      number: 2,
      createdAt: new Date().toISOString(),
      client: { name: "Cliente B" },
      ...baseBudget,
    };

    await storageAdapter.addBudget(budgetA);
    await storageAdapter.addBudget(budgetB);
    const updated = await storageAdapter.deleteBudget("b");

    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe("a");
  });

  it("normalizes saved client details and payment terms", async () => {
    localStorage.setItem(
      "@OrcaRapido:budgets",
      JSON.stringify([
        {
          id: "a",
          number: 7,
          createdAt: "2026-05-05T00:00:00.000Z",
          validUntil: "2026-05-12T00:00:00.000Z",
          client: {
            name: "Cliente",
            document: "123",
            address: "Rua A",
            phone: "11999999999",
          },
          items: [],
          paymentTerms: "PIX",
          modules: { showTerms: true, showSignature: true, removeAds: false },
          totals: { subtotal: 0, discount: 0, total: 0 },
        },
      ]),
    );

    await expect(storageAdapter.getBudgets()).resolves.toEqual([
      expect.objectContaining({
      validUntil: "2026-05-12T00:00:00.000Z",
      client: expect.objectContaining({
        document: "123",
        address: "Rua A",
        phone: "11999999999",
      }),
      paymentTerms: "PIX",
      }),
    ]);
  });

  it("normalizes legacy budget fields and totals fallback", () => {
    const normalized = normalizeBudget({
      id: 1,
      number: "8",
      clientName: "Cliente legado",
      total: "35",
      discount: "5",
      items: [
        {
          id: 1,
          description: "Item legado",
          quantity: "2",
          price: "20",
        },
      ],
    });

    expect(normalized).toMatchObject({
      id: "1",
      number: 8,
      client: { name: "Cliente legado" },
      totals: { subtotal: 40, discount: 5, total: 35 },
      items: [
        expect.objectContaining({
          descricao: "Item legado",
          quantidade: 2,
          valorUnitario: 20,
          unidade: "UN",
          moeda: "BRL",
        }),
      ],
    });
  });

  it("normalizes budget items and rejects invalid raw values", () => {
    expect(
      normalizeBudgetItem({
        id: 7,
        descricao: "Servico",
        quantidade: "4",
        valorUnitario: "12.5",
        unidade: "HR",
        moeda: "USD",
      }),
    ).toMatchObject({
      id: "7",
      quantidade: 4,
      valorUnitario: 12.5,
      unidade: "HR",
      moeda: "USD",
    });

    expect(normalizeBudgetItem(null)).toBeNull();
    expect(normalizeBudget(null)).toBeNull();
  });
});
