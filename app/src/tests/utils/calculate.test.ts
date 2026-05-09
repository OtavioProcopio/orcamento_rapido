import {
  calculateBudgetSubtotal,
  calculateBudgetTotal,
  calculateItemTotal,
} from "../../utils/calculate";

describe("calculate utils", () => {
  it("calculates item total", () => {
    expect(calculateItemTotal(2, 10)).toBe(20);
  });

  it("calculates budget subtotal", () => {
    const items = [
      {
        id: "1",
        descricao: "A",
        quantidade: 2,
        unidade: "UN",
        valorUnitario: 10,
        moeda: "BRL" as const,
      },
      {
        id: "2",
        descricao: "B",
        quantidade: 1,
        unidade: "UN",
        valorUnitario: 5,
        moeda: "BRL" as const,
      },
    ];
    expect(calculateBudgetSubtotal(items)).toBe(25);
  });

  it("calculates total with discount", () => {
    const items = [
      {
        id: "1",
        descricao: "A",
        quantidade: 2,
        unidade: "UN",
        valorUnitario: 10,
        moeda: "BRL" as const,
      },
    ];
    expect(calculateBudgetTotal(items, 3)).toBe(17);
  });
});
