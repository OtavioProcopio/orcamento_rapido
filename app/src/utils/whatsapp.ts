import type { Budget } from "../types";
import { formatCurrency, formatDate } from "./format";
import { unmaskPhone } from "./maskPhone";

const BRAZIL_COUNTRY_CODE = "55";

export const buildWhatsAppUrl = (
  phone: string | undefined,
  message: string,
): string => {
  const digits = phone ? unmaskPhone(phone) : "";
  const target = digits ? `${BRAZIL_COUNTRY_CODE}${digits}` : "";
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
};

export const buildBudgetShareMessage = (
  budget: Budget,
  companyName: string,
): string => {
  const greeting = budget.client.name
    ? `Olá, ${budget.client.name}!`
    : "Olá!";
  const from = companyName ? ` de ${companyName}` : "";

  const lines = [
    `${greeting} Segue o orçamento nº ${budget.number}${from}.`,
    "",
    `Valor total: ${formatCurrency(budget.totals.total)}`,
  ];

  if (budget.validUntil) {
    lines.push(`Válido até: ${formatDate(budget.validUntil)}`);
  }

  if (budget.paymentTerms) {
    lines.push(`Forma de pagamento: ${budget.paymentTerms}`);
  }

  lines.push("", "Qualquer dúvida, estou à disposição!");

  return lines.join("\n");
};

export const buildBudgetWhatsAppShareUrl = (
  budget: Budget,
  companyName: string,
): string =>
  buildWhatsAppUrl(budget.client.phone, buildBudgetShareMessage(budget, companyName));
