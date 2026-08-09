import { BUDGET_STATUSES, getBudgetStatusLabel } from "../../utils/budgetStatus";

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
});
