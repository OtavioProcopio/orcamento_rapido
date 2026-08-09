import { createBudgetBackup, createBudgetCsv, parseBudgetBackup } from "../../utils/backup";
import type { Budget, Client } from "../../types";

const client: Client = {
  id: "client-1",
  name: "Cliente Cadastrado",
  document: "529.982.247-25",
  createdAt: "2026-05-07T00:00:00.000Z",
};

const budget: Budget = {
  id: "budget-1",
  number: 10,
  status: "approved",
  createdAt: "2026-05-07T00:00:00.000Z",
  client: {
    name: "Cliente",
    document: "529.982.247-25",
    email: "cliente@teste.com",
    phone: "(11) 99999-9999",
  },
  items: [],
  modules: { showTerms: true, showSignature: true },
  totals: { subtotal: 100, discount: 10, total: 90 },
};

describe("backup", () => {
  it("creates and parses JSON backups", () => {
    const content = createBudgetBackup([budget]);

    expect(parseBudgetBackup(content).budgets[0]).toMatchObject({
      id: "budget-1",
      status: "approved",
      client: {
        document: "529.982.247-25",
        email: "cliente@teste.com",
      },
      totals: { subtotal: 100, discount: 10, total: 90 },
    });
  });

  it("round-trips clients alongside budgets", () => {
    const content = createBudgetBackup([budget], [client]);

    const parsed = parseBudgetBackup(content);
    expect(parsed.clients).toMatchObject([{ id: "client-1", name: "Cliente Cadastrado" }]);
  });

  it("leaves clients undefined when the backup predates the clients field", () => {
    const legacyContent = JSON.stringify({
      app: "orca-rapido",
      version: 1,
      exportedAt: "2026-05-07T00:00:00.000Z",
      budgets: [budget],
    });

    expect(parseBudgetBackup(legacyContent).clients).toBeUndefined();
  });

  it("creates CSV exports", () => {
    expect(createBudgetCsv([budget])).toContain(
      '"10","approved","2026-05-07T00:00:00.000Z","Cliente"',
    );
  });

  it("rejects invalid backup content", () => {
    expect(() => parseBudgetBackup('{"budgets":"nope"}')).toThrow(
      "invalid-backup",
    );
  });

  it("rejects a backup whose entries all fail to normalize into budgets", () => {
    expect(() =>
      parseBudgetBackup('{"budgets":[1,"nope",null]}'),
    ).toThrow("invalid-backup");
  });

  it("accepts an empty backup with no budgets", () => {
    expect(parseBudgetBackup('{"budgets":[]}').budgets).toEqual([]);
  });

  it("accepts a raw array backup without the wrapper object", () => {
    const content = createBudgetBackup([budget]);
    const rawArray = JSON.parse(content).budgets;

    expect(parseBudgetBackup(JSON.stringify(rawArray)).budgets[0]).toMatchObject({
      id: "budget-1",
    });
    expect(parseBudgetBackup(JSON.stringify(rawArray)).clients).toBeUndefined();
  });

  it("escapes CSV cells for budgets without optional client fields", () => {
    const minimalBudget: Budget = {
      ...budget,
      client: { name: "Cliente Minimo" },
    };

    const csv = createBudgetCsv([minimalBudget]);

    expect(csv).toContain('"Cliente Minimo","","",""');
  });

  it("neutralizes CSV formula injection in client-controlled fields", () => {
    const maliciousBudget: Budget = {
      ...budget,
      client: {
        ...budget.client,
        name: "=cmd|calc!A1",
        document: "+5551234",
        phone: "@SUM(1+1)",
      },
    };

    const csv = createBudgetCsv([maliciousBudget]);

    expect(csv).toContain('"\'=cmd|calc!A1"');
    expect(csv).toContain('"\'+5551234"');
    expect(csv).toContain('"\'@SUM(1+1)"');
    expect(csv).not.toMatch(/,=cmd/);
  });

  it("keeps normal text untouched", () => {
    expect(createBudgetCsv([budget])).toContain('"Cliente"');
  });
});
