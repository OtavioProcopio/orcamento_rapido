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
      },
      {
        id: "2",
        descricao: "B",
        quantidade: 1,
        unidade: "UN",
        valorUnitario: 5,
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
      },
    ];
    expect(calculateBudgetTotal(items, 3)).toBe(17);
  });

  it("defaults discount to zero when omitted", () => {
    const items = [
      {
        id: "1",
        descricao: "A",
        quantidade: 2,
        unidade: "UN",
        valorUnitario: 10,
      },
    ];
    expect(calculateBudgetTotal(items)).toBe(20);
  });

  it("clamps total to zero when discount exceeds subtotal", () => {
    const items = [
      {
        id: "1",
        descricao: "A",
        quantidade: 1,
        unidade: "UN",
        valorUnitario: 10,
      },
    ];
    expect(calculateBudgetTotal(items, 999)).toBe(0);
  });
});
