import {
  normalizeBudget,
  normalizeClient,
  normalizeProfile,
} from "../storage/storageAdapter";
import type { Budget, Client, MeiProfile } from "../types";

type BudgetBackup = {
  app: "orca-rapido";
  version: 1 | 2 | 3;
  exportedAt: string;
  budgets: Budget[];
  clients?: Client[];
  profiles?: MeiProfile[];
};

export type ParsedBudgetBackup = {
  budgets: Budget[];
  // undefined = backup não tinha essa chave (formato mais antigo) — nesse
  // caso o cadastro local correspondente não deve ser tocado no import.
  clients: Client[] | undefined;
  profiles: MeiProfile[] | undefined;
};

export const createBudgetBackup = (
  budgets: Budget[],
  clients: Client[] = [],
  profiles: MeiProfile[] = [],
): string =>
  JSON.stringify(
    {
      app: "orca-rapido",
      version: 3,
      exportedAt: new Date().toISOString(),
      budgets,
      clients,
      profiles,
    } satisfies BudgetBackup,
    null,
    2,
  );

export const parseBudgetBackup = (content: string): ParsedBudgetBackup => {
  const parsed = JSON.parse(content) as Partial<BudgetBackup> | Budget[];
  const rawBudgets = Array.isArray(parsed) ? parsed : parsed.budgets;
  const rawClients = Array.isArray(parsed) ? undefined : parsed.clients;
  const rawProfiles = Array.isArray(parsed) ? undefined : parsed.profiles;

  if (!Array.isArray(rawBudgets)) {
    throw new Error("invalid-backup");
  }

  const budgets = rawBudgets
    .map(normalizeBudget)
    .filter((budget): budget is Budget => budget !== null);

  if (budgets.length === 0 && rawBudgets.length > 0) {
    throw new Error("invalid-backup");
  }

  const clients = Array.isArray(rawClients)
    ? rawClients
        .map(normalizeClient)
        .filter((client): client is Client => client !== null)
    : undefined;

  const profiles = Array.isArray(rawProfiles)
    ? rawProfiles
        .map(normalizeProfile)
        .filter((profile): profile is MeiProfile => profile !== null)
    : undefined;

  return { budgets, clients, profiles };
};

const FORMULA_TRIGGER_PATTERN = /^[=+\-@\t\r]/;

const escapeCsv = (value: string | number | undefined): string => {
  const normalized = String(value ?? "");
  // Neutraliza CSV injection: célula iniciando com =, +, -, @ (ou tab/CR) é
  // interpretada como fórmula por Excel/Sheets ao abrir o arquivo exportado.
  // Prefixamos com apóstrofo, que força leitura como texto literal.
  const safe = FORMULA_TRIGGER_PATTERN.test(normalized)
    ? `'${normalized}`
    : normalized;
  return `"${safe.replace(/"/g, '""')}"`;
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
