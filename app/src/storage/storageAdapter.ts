import type { Budget, BudgetItem, BudgetStatus, MeiProfile } from "../types";

const PROFILE_KEY = "@OrcaRapido:mei_profile";
const BUDGETS_KEY = "@OrcaRapido:budgets";
const DB_NAME = "orca-rapido";
const DB_VERSION = 1;
const PROFILE_STORE = "profile";
const BUDGETS_STORE = "budgets";
const META_STORE = "meta";
const PROFILE_ID = "current";
const MIGRATION_KEY = "localStorageMigrationDone";

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const readNumber = (value: unknown, fallback = 0): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const readBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const readId = (value: unknown): string =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : (crypto.randomUUID?.() ?? Math.random().toString(36));

const idbError = (error: unknown): Error =>
  error instanceof Error ? error : new Error("IndexedDB operation failed");

const readStatus = (value: unknown): BudgetStatus =>
  value === "sent" ||
  value === "approved" ||
  value === "rejected" ||
  value === "paid" ||
  value === "draft"
    ? value
    : "draft";

export const normalizeBudgetItem = (itemRaw: unknown): BudgetItem | null => {
  if (!isRecord(itemRaw)) {
    return null;
  }

  const descricao = readString(itemRaw.descricao ?? itemRaw.description, "");
  const quantidade = readNumber(itemRaw.quantidade ?? itemRaw.quantity, 0);
  const unidade = readString(itemRaw.unidade, "UN");
  const valorUnitario = readNumber(itemRaw.valorUnitario ?? itemRaw.price, 0);

  return {
    id: readId(itemRaw.id),
    descricao,
    quantidade,
    unidade,
    valorUnitario,
  };
};

export const normalizeBudget = (budgetRaw: unknown): Budget | null => {
  if (!budgetRaw || typeof budgetRaw !== "object") {
    return null;
  }
  const budget = budgetRaw as Record<string, unknown>;

  const items = Array.isArray(budget.items)
    ? budget.items
        .map(normalizeBudgetItem)
        .filter((item): item is BudgetItem => item !== null)
    : [];
  const totals = isRecord(budget.totals) ? budget.totals : undefined;
  const discount = readNumber(budget.discount ?? totals?.discount, 0);
  const modules = isRecord(budget.modules) ? budget.modules : undefined;
  const client = isRecord(budget.client) ? budget.client : undefined;
  const subtotal =
    readNumber(
      totals?.subtotal,
      items.reduce(
        (total, item) => total + item.quantidade * item.valorUnitario,
        0,
      ),
    ) || 0;
  const totalFromLegacy = readNumber(budget.total, subtotal - discount) || 0;
  const total = readNumber(totals?.total, totalFromLegacy) || 0;

  return {
    id: readId(budget.id),
    number: readNumber(budget.number, 1),
    status: readStatus(budget.status),
    createdAt: readString(budget.createdAt, new Date().toISOString()),
    validUntil:
      typeof budget.validUntil === "string" ? budget.validUntil : undefined,
    client: {
      name: readString(client?.name ?? budget.clientName, ""),
      document: readString(client?.document, ""),
      address: readString(client?.address, ""),
      email: readString(client?.email, ""),
      phone: readString(client?.phone, ""),
    },
    items,
    terms: typeof budget.terms === "string" ? budget.terms : undefined,
    paymentTerms:
      typeof budget.paymentTerms === "string" ? budget.paymentTerms : undefined,
    discount,
    modules: {
      showTerms: readBoolean(modules?.showTerms, true),
      showSignature: readBoolean(modules?.showSignature, true),
      removeAds: readBoolean(modules?.removeAds, false),
    },
    totals: {
      subtotal,
      discount,
      total,
    },
    pdfDataUrl:
      typeof budget.pdfDataUrl === "string" ? budget.pdfDataUrl : undefined,
    previewImageDataUrl:
      typeof budget.previewImageDataUrl === "string"
        ? budget.previewImageDataUrl
        : undefined,
  };
};

export const storageAdapter = {
  async getProfile(): Promise<MeiProfile | null> {
    const db = await openDatabase();
    if (!db) {
      return readLegacyProfile();
    }

    await migrateLegacyLocalStorage(db);
    return readFromStore<MeiProfile>(db, PROFILE_STORE, PROFILE_ID);
  },

  async saveProfile(profile: MeiProfile): Promise<void> {
    const db = await openDatabase();
    if (!db) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return;
    }

    await writeToStore(db, PROFILE_STORE, profile, PROFILE_ID);
  },

  async getBudgets(): Promise<Budget[]> {
    const db = await openDatabase();
    if (!db) {
      return readLegacyBudgets();
    }

    await migrateLegacyLocalStorage(db);
    const budgets = await readAllFromStore<Budget>(db, BUDGETS_STORE);
    return budgets.sort(sortBudgets);
  },

  async saveBudgets(budgets: Budget[]): Promise<void> {
    const db = await openDatabase();
    if (!db) {
      localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
      return;
    }

    await clearStore(db, BUDGETS_STORE);
    await Promise.all(
      budgets.map((budget) => writeToStore(db, BUDGETS_STORE, budget)),
    );
  },

  async clearBudgets(): Promise<void> {
    const db = await openDatabase();
    if (!db) {
      localStorage.removeItem(BUDGETS_KEY);
      return;
    }

    await clearStore(db, BUDGETS_STORE);
  },

  async addBudget(budget: Budget): Promise<Budget[]> {
    const budgets = await storageAdapter.getBudgets();
    const updated = [budget, ...budgets.filter((item) => item.id !== budget.id)];
    await storageAdapter.saveBudgets(updated);
    return updated;
  },

  async updateBudget(id: string, patch: Partial<Budget>): Promise<Budget[]> {
    const budgets = await storageAdapter.getBudgets();
    const updated = budgets.map((budget) =>
      budget.id === id ? { ...budget, ...patch } : budget,
    );
    await storageAdapter.saveBudgets(updated);
    return updated;
  },

  async deleteBudget(id: string): Promise<Budget[]> {
    const budgets = await storageAdapter.getBudgets();
    const updated = budgets.filter((budget) => budget.id !== id);
    await storageAdapter.saveBudgets(updated);
    return updated;
  },
};

const readLegacyProfile = (): MeiProfile | null =>
  safeParse<MeiProfile | null>(localStorage.getItem(PROFILE_KEY), null);

const readLegacyBudgets = (): Budget[] =>
  safeParse<unknown[]>(localStorage.getItem(BUDGETS_KEY), [])
    .map(normalizeBudget)
    .filter((budget): budget is Budget => budget !== null)
    .sort(sortBudgets);

const sortBudgets = (a: Budget, b: Budget) => {
  const byDate =
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  return byDate || b.number - a.number;
};

const openDatabase = (): Promise<IDBDatabase | null> => {
  if (!("indexedDB" in globalThis)) {
    return Promise.resolve(null);
  }

  return new Promise<IDBDatabase | null>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE);
      }
      if (!db.objectStoreNames.contains(BUDGETS_STORE)) {
        db.createObjectStore(BUDGETS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(idbError(request.error));
    request.onblocked = () => reject(idbError(request.error));
  }).catch((): null => null);
};

const readFromStore = <T>(
  db: IDBDatabase,
  storeName: string,
  key: IDBValidKey,
): Promise<T | null> =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(idbError(request.error));
  });

const readAllFromStore = <T>(
  db: IDBDatabase,
  storeName: string,
): Promise<T[]> =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(idbError(request.error));
  });

const writeToStore = <T>(
  db: IDBDatabase,
  storeName: string,
  value: T,
  key?: IDBValidKey,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = key === undefined ? store.put(value) : store.put(value, key);
    request.onerror = () => reject(idbError(request.error));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(idbError(transaction.error));
  });

const clearStore = (db: IDBDatabase, storeName: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const request = transaction.objectStore(storeName).clear();
    request.onerror = () => reject(idbError(request.error));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(idbError(transaction.error));
  });

const migrateLegacyLocalStorage = async (db: IDBDatabase): Promise<void> => {
  const migrated = await readFromStore<boolean>(db, META_STORE, MIGRATION_KEY);
  if (migrated) {
    return;
  }

  const existingProfile = await readFromStore<MeiProfile>(
    db,
    PROFILE_STORE,
    PROFILE_ID,
  );
  const existingBudgets = await readAllFromStore<Budget>(db, BUDGETS_STORE);

  if (!existingProfile) {
    const profile = readLegacyProfile();
    if (profile) {
      await writeToStore(db, PROFILE_STORE, profile, PROFILE_ID);
    }
  }

  if (existingBudgets.length === 0) {
    const budgets = readLegacyBudgets();
    await Promise.all(
      budgets.map((budget) => writeToStore(db, BUDGETS_STORE, budget)),
    );
  }

  await writeToStore(db, META_STORE, true, MIGRATION_KEY);
};
