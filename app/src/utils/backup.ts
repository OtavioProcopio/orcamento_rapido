import { normalizeBudget } from "../storage/storageAdapter";
import type { Budget } from "../types";

type BudgetBackup = {
  app: "orca-rapido";
  version: 1;
  exportedAt: string;
  budgets: Budget[];
};

export const createBudgetBackup = (budgets: Budget[]): string =>
  JSON.stringify(
    {
      app: "orca-rapido",
      version: 1,
      exportedAt: new Date().toISOString(),
      budgets,
    } satisfies BudgetBackup,
    null,
    2,
  );

export const parseBudgetBackup = (content: string): Budget[] => {
  const parsed = JSON.parse(content) as Partial<BudgetBackup> | Budget[];
  const rawBudgets = Array.isArray(parsed) ? parsed : parsed.budgets;

  if (!Array.isArray(rawBudgets)) {
    throw new Error("invalid-backup");
  }

  const budgets = rawBudgets
    .map(normalizeBudget)
    .filter((budget): budget is Budget => budget !== null);

  if (budgets.length === 0 && rawBudgets.length > 0) {
    throw new Error("invalid-backup");
  }

  return budgets;
};

const escapeCsv = (value: string | number | undefined): string => {
  const normalized = String(value ?? "");
  return `"${normalized.replace(/"/g, '""')}"`;
};

export const createBudgetCsv = (budgets: Budget[]): string => {
  const header = [
    "numero",
    "status",
    "criado_em",
    "cliente",
    "cpf_cnpj",
    "email",
    "telefone",
    "subtotal",
    "desconto",
    "total",
  ];
  const rows = budgets.map((budget) =>
    [
      budget.number,
      budget.status,
      budget.createdAt,
      budget.client.name,
      budget.client.document,
      budget.client.email,
      budget.client.phone,
      budget.totals.subtotal,
      budget.totals.discount,
      budget.totals.total,
    ].map(escapeCsv),
  );

  return [header.map(escapeCsv), ...rows].map((row) => row.join(",")).join("\n");
};
