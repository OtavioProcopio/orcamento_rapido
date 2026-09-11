import {
  BUDGET_STATUSES,
  getBudgetStatusAccent,
  getBudgetStatusLabel,
} from "../../utils/budgetStatus";

describe("budgetStatus", () => {
  it("lists every status exactly once", () => {
    expect(BUDGET_STATUSES).toEqual([
      "draft",
      "sent",
      "approved",
      "rejected",
      "paid",
    ]);
  });

  it("labels every status in Portuguese", () => {
    expect(BUDGET_STATUSES.map(getBudgetStatusLabel)).toEqual([
      "Rascunho",
      "Enviado",
      "Aprovado",
      "Recusado",
      "Pago",
    ]);
  });

  it("gives every status a distinct accent class", () => {
    const accents = BUDGET_STATUSES.map(getBudgetStatusAccent);

    expect(new Set(accents).size).toBe(BUDGET_STATUSES.length);
  });
});
