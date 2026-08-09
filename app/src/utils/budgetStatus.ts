import type { Budget } from "../types";

export const BUDGET_STATUSES: Budget["status"][] = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "paid",
];

const BUDGET_STATUS_LABELS: Record<Budget["status"], string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Recusado",
  paid: "Pago",
};

export const getBudgetStatusLabel = (status: Budget["status"]): string =>
  BUDGET_STATUS_LABELS[status];
