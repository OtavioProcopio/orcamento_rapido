import type { CurrencyCode } from "../types";

export const formatCurrency = (
  value: number,
  currency: CurrencyCode = "BRL",
): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const formatDate = (isoDate: string): string => {
  // Strings "date-only" (sem horário) são tratadas como meio-dia local para
  // não sofrer deslocamento de fuso: "2024-01-01" não pode virar 31/12/2023
  // só porque o navegador está em um fuso atrás de UTC (caso de todo o Brasil).
  const date = DATE_ONLY_PATTERN.test(isoDate)
    ? new Date(`${isoDate}T12:00:00`)
    : new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString("pt-BR");
};

export const todayIsoDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
