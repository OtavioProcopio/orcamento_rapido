import type { BudgetItem } from "../types";

export const calculateItemTotal = (
  quantidade: number,
  valorUnitario: number,
): number => {
  return quantidade * valorUnitario;
};

export const calculateBudgetSubtotal = (items: BudgetItem[]): number => {
  return items.reduce((subtotal, item) => {
    return (
      subtotal + calculateItemTotal(item.quantidade, item.valorUnitario)
    );
  }, 0);
};

export const calculateBudgetTotal = (
  items: BudgetItem[],
  discount = 0,
): number => {
  const subtotal = calculateBudgetSubtotal(items);
  return Math.max(0, subtotal - discount);
};
