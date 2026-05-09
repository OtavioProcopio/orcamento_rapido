import { createBudgetBackup, createBudgetCsv, parseBudgetBackup } from "../../utils/backup";
import type { Budget } from "../../types";

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
  modules: { showTerms: true, showSignature: true, removeAds: false },
  totals: { subtotal: 100, discount: 10, total: 90 },
};

describe("backup", () => {
  it("creates and parses JSON backups", () => {
    const content = createBudgetBackup([budget]);

    expect(parseBudgetBackup(content)[0]).toMatchObject({
      id: "budget-1",
      status: "approved",
      client: {
        document: "529.982.247-25",
        email: "cliente@teste.com",
      },
      totals: { subtotal: 100, discount: 10, total: 90 },
    });
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
});
