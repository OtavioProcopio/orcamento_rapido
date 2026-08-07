export type CurrencyCode = "BRL" | "USD" | "EUR";
export type BudgetStatus = "draft" | "sent" | "approved" | "rejected" | "paid";

export type MeiProfile = {
  companyName: string;
  document?: string;
  userName: string;
  phone: string;
  email?: string;
  pixKey: string;
  logo?: string;
};

export type BudgetItem = {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
};

export type BudgetClient = {
  name: string;
  document?: string;
  address?: string;
  email?: string;
  phone?: string;
};

export type BudgetModules = {
  showTerms: boolean;
  showSignature: boolean;
  removeAds: boolean;
};

export type BudgetTotals = {
  subtotal: number;
  discount: number;
  total: number;
};

export type Budget = {
  id: string;
  number: number;
  status: BudgetStatus;
  createdAt: string;
  validUntil?: string;
  client: BudgetClient;
  items: BudgetItem[];
  terms?: string; 
  paymentTerms?: string;
  discount?: number;
  modules: BudgetModules;
  totals: BudgetTotals;
  pdfDataUrl?: string;
  previewImageDataUrl?: string;
};
