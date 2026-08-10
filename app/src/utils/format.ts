// App é BRL-only (PIX, CPF/CNPJ, pt-BR fixo em todo o resto) — sem seletor
// de moeda em lugar nenhum da UI, então nem vale receber isso como parâmetro.
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
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
