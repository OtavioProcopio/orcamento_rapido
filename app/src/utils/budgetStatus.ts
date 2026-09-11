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

const BUDGET_STATUS_ACCENTS: Record<Budget["status"], string> = {
  draft: "border-slate-400/20 bg-slate-400/10 text-slate-200",
  sent: "border-blue-400/20 bg-blue-400/10 text-blue-200",
  approved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  rejected: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  paid: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
};

export const getBudgetStatusAccent = (status: Budget["status"]): string =>
  BUDGET_STATUS_ACCENTS[status];
