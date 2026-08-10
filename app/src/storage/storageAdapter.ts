import type { Budget, BudgetItem, BudgetStatus, Client, MeiProfile } from "../types";
import { notifyStoreChanged } from "../utils/tabSync";

const PROFILE_KEY = "@OrcaRapido:mei_profile";
const PROFILES_KEY = "@OrcaRapido:profiles";
const BUDGETS_KEY = "@OrcaRapido:budgets";
const CLIENTS_KEY = "@OrcaRapido:clients";
const DB_NAME = "orca-rapido";
const DB_VERSION = 3;
const PROFILE_STORE = "profile";
const PROFILES_STORE = "profiles";
const BUDGETS_STORE = "budgets";
const CLIENTS_STORE = "clients";
const META_STORE = "meta";
const PROFILE_ID = "current";
const MIGRATION_KEY = "localStorageMigrationDone";
const PROFILES_MIGRATION_KEY = "profilesMigrationDone";

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

export const normalizeClient = (clientRaw: unknown): Client | null => {
  if (!isRecord(clientRaw)) {
    return null;
  }

  const name = readString(clientRaw.name, "");
  if (!name) {
    return null;
  }

  return {
    id: readId(clientRaw.id),
    name,
    document: typeof clientRaw.document === "string" ? clientRaw.document : undefined,
    address: typeof clientRaw.address === "string" ? clientRaw.address : undefined,
    email: typeof clientRaw.email === "string" ? clientRaw.email : undefined,
    phone: typeof clientRaw.phone === "string" ? clientRaw.phone : undefined,
    notes: typeof clientRaw.notes === "string" ? clientRaw.notes : undefined,
    createdAt: readString(clientRaw.createdAt, new Date().toISOString()),
  };
};

export const normalizeProfile = (profileRaw: unknown): MeiProfile | null => {
  if (!isRecord(profileRaw)) {
    return null;
  }

  const companyName = readString(profileRaw.companyName, "");
  const userName = readString(profileRaw.userName, "");
  const phone = readString(profileRaw.phone, "");
  if (!companyName || !userName || !phone) {
    return null;
  }

  return {
    id: readId(profileRaw.id),
    companyName,
    document: typeof profileRaw.document === "string" ? profileRaw.document : undefined,
    userName,
    phone,
    email: typeof profileRaw.email === "string" ? profileRaw.email : undefined,
    pixKey: readString(profileRaw.pixKey, ""),
    logo: typeof profileRaw.logo === "string" ? profileRaw.logo : undefined,
    createdAt: readString(profileRaw.createdAt, new Date().toISOString()),
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
    profileId:
      typeof budget.profileId === "string" ? budget.profileId : undefined,
    client: {
      name: readString(client?.name ?? budget.clientName, ""),
      document: readString(client?.document, ""),
      address: readString(client?.address, ""),
      email: readString(client?.email, ""),
      phone: readString(client?.phone, ""),
      clientId:
        typeof client?.clientId === "string" ? client.clientId : undefined,
    },
    items,
    terms: typeof budget.terms === "string" ? budget.terms : undefined,
    paymentTerms:
      typeof budget.paymentTerms === "string" ? budget.paymentTerms : undefined,
    discount,
    modules: {
      showTerms: readBoolean(modules?.showTerms, true),
      showSignature: readBoolean(modules?.showSignature, true),
      footerText:
        typeof modules?.footerText === "string" ? modules.footerText : undefined,
    },
    totals: {
      subtotal,
      discount,
      total,
    },
  };
};

export const storageAdapter = {
  async getProfiles(): Promise<MeiProfile[]> {
    const db = await openDatabase();
    if (!db) {
      return migrateProfilesFallback();
    }

    await migrateLegacyLocalStorage(db);
    await migrateSingleProfileToProfiles(db);
    const profiles = await readAllFromStore<MeiProfile>(db, PROFILES_STORE);
    return profiles.sort(sortProfiles);
  },

  async saveProfiles(profiles: MeiProfile[]): Promise<void> {
    const db = await openDatabase();
    if (!db) {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      notifyStoreChanged("profiles");
      return;
    }

    await clearStore(db, PROFILES_STORE);
    await Promise.all(
      profiles.map((profile) => writeToStore(db, PROFILES_STORE, profile)),
    );
    notifyStoreChanged("profiles");
  },

  async addProfile(profile: MeiProfile): Promise<MeiProfile[]> {
    const profiles = await storageAdapter.getProfiles();
    const updated = [
      profile,
      ...profiles.filter((item) => item.id !== profile.id),
    ];
    await storageAdapter.saveProfiles(updated);
    return updated;
  },

  async updateProfile(id: string, patch: Partial<MeiProfile>): Promise<MeiProfile[]> {
    const profiles = await storageAdapter.getProfiles();
    const updated = profiles.map((profile) =>
      profile.id === id ? { ...profile, ...patch } : profile,
    );
    await storageAdapter.saveProfiles(updated);
    return updated;
  },

  async deleteProfile(id: string): Promise<MeiProfile[]> {
    const profiles = await storageAdapter.getProfiles();
    const updated = profiles.filter((profile) => profile.id !== id);
    await storageAdapter.saveProfiles(updated);
    return updated;
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
      notifyStoreChanged("budgets");
      return;
    }

    await clearStore(db, BUDGETS_STORE);
    await Promise.all(
      budgets.map((budget) => writeToStore(db, BUDGETS_STORE, budget)),
    );
    notifyStoreChanged("budgets");
  },

  async clearBudgets(): Promise<void> {
    const db = await openDatabase();
    if (!db) {
      localStorage.removeItem(BUDGETS_KEY);
      notifyStoreChanged("budgets");
      return;
    }

    await clearStore(db, BUDGETS_STORE);
    notifyStoreChanged("budgets");
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

  async getClients(): Promise<Client[]> {
    const db = await openDatabase();
    if (!db) {
      return readLegacyClients();
    }

    const clients = await readAllFromStore<Client>(db, CLIENTS_STORE);
    return clients.sort(sortClients);
  },

  async saveClients(clients: Client[]): Promise<void> {
    const db = await openDatabase();
    if (!db) {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
      notifyStoreChanged("clients");
      return;
    }

    await clearStore(db, CLIENTS_STORE);
    await Promise.all(
      clients.map((client) => writeToStore(db, CLIENTS_STORE, client)),
    );
    notifyStoreChanged("clients");
  },

  async addClient(client: Client): Promise<Client[]> {
    const clients = await storageAdapter.getClients();
    const updated = [client, ...clients.filter((item) => item.id !== client.id)];
    await storageAdapter.saveClients(updated);
    return updated;
  },

  async updateClient(id: string, patch: Partial<Client>): Promise<Client[]> {
    const clients = await storageAdapter.getClients();
    const updated = clients.map((client) =>
      client.id === id ? { ...client, ...patch } : client,
    );
    await storageAdapter.saveClients(updated);
    return updated;
  },

  async deleteClient(id: string): Promise<Client[]> {
    const clients = await storageAdapter.getClients();
    const updated = clients.filter((client) => client.id !== id);
    await storageAdapter.saveClients(updated);
    return updated;
  },
};

// Formato antigo (pré multi-perfil) nunca teve "id" — lido como registro cru
// e reconstruído via normalizeProfile no ponto de migração, que gera o id.
const readLegacyProfile = (): Record<string, unknown> | null =>
  safeParse<Record<string, unknown> | null>(
    localStorage.getItem(PROFILE_KEY),
    null,
  );

const readLegacyBudgets = (): Budget[] =>
  safeParse<unknown[]>(localStorage.getItem(BUDGETS_KEY), [])
    .map(normalizeBudget)
    .filter((budget): budget is Budget => budget !== null)
    .sort(sortBudgets);

const readLegacyClients = (): Client[] =>
  safeParse<unknown[]>(localStorage.getItem(CLIENTS_KEY), [])
    .map(normalizeClient)
    .filter((client): client is Client => client !== null)
    .sort(sortClients);

const sortBudgets = (a: Budget, b: Budget) => {
  const byDate =
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  return byDate || b.number - a.number;
};

const sortClients = (a: Client, b: Client) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const sortProfiles = (a: MeiProfile, b: MeiProfile) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

// Reaproveita os métodos públicos (já cobrem IndexedDB e o fallback de
// localStorage) em vez de duplicar acesso a store bruto — só precisa migrar
// os orçamentos que ainda não têm profileId, apontando pro perfil único que
// existia antes do multi-perfil.
const backfillBudgetProfileId = async (profileId: string): Promise<void> => {
  const budgets = await storageAdapter.getBudgets();
  const needsBackfill = budgets.some((budget) => !budget.profileId);
  if (!needsBackfill) {
    return;
  }

  await storageAdapter.saveBudgets(
    budgets.map((budget) =>
      budget.profileId ? budget : { ...budget, profileId },
    ),
  );
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
      if (!db.objectStoreNames.contains(PROFILES_STORE)) {
        db.createObjectStore(PROFILES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(BUDGETS_STORE)) {
        db.createObjectStore(BUDGETS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CLIENTS_STORE)) {
        db.createObjectStore(CLIENTS_STORE, { keyPath: "id" });
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

// Várias páginas montam useBudget/useClients/useProfiles ao mesmo tempo (e a
// navegação entre páginas pode sobrepor o hook antigo desmontando com o novo
// montando), então mais de uma chamada a esta função pode disparar antes da
// primeira terminar de gravar sua flag de "já migrado" — em IndexedDB de
// verdade (diferente do fake-indexeddb dos testes, que resolve rápido demais
// pra expor a corrida) isso duplicava o perfil migrado. Cachear a promise
// em módulo garante que chamadas concorrentes aguardem a mesma migração em
// vez de cada uma correr a sequência checa-then-grava por conta própria.
let legacyMigrationPromise: Promise<void> | null = null;

const migrateLegacyLocalStorage = (db: IDBDatabase): Promise<void> => {
  if (!legacyMigrationPromise) {
    legacyMigrationPromise = migrateLegacyLocalStorageInternal(db);
  }
  return legacyMigrationPromise;
};

const migrateLegacyLocalStorageInternal = async (db: IDBDatabase): Promise<void> => {
  const migrated = await readFromStore<boolean>(db, META_STORE, MIGRATION_KEY);
  if (migrated) {
    return;
  }

  const existingProfile = await readFromStore<Record<string, unknown>>(
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

// Um único orçamento antigo (pré multi-perfil) vira o primeiro item da nova
// lista de perfis, com um id gerado — e todo orçamento que ainda não tinha
// profileId passa a apontar pra ele, preservando o histórico sem exigir
// nenhuma ação do usuário na atualização.
// Mesmo cuidado de concorrência que migrateLegacyLocalStorage — sem cache de
// promise, duas chamadas simultâneas gerariam dois perfis migrados (dois ids
// aleatórios diferentes) a partir do mesmo perfil único antigo.
let profilesMigrationPromise: Promise<void> | null = null;

const migrateSingleProfileToProfiles = (db: IDBDatabase): Promise<void> => {
  if (!profilesMigrationPromise) {
    profilesMigrationPromise = migrateSingleProfileToProfilesInternal(db);
  }
  return profilesMigrationPromise;
};

const migrateSingleProfileToProfilesInternal = async (
  db: IDBDatabase,
): Promise<void> => {
  const migrated = await readFromStore<boolean>(db, META_STORE, PROFILES_MIGRATION_KEY);
  if (migrated) {
    return;
  }

  const existingProfiles = await readAllFromStore<MeiProfile>(db, PROFILES_STORE);
  if (existingProfiles.length === 0) {
    const legacyProfileRaw = await readFromStore<Record<string, unknown>>(
      db,
      PROFILE_STORE,
      PROFILE_ID,
    );
    const legacyProfile = legacyProfileRaw
      ? normalizeProfile({ ...legacyProfileRaw, id: crypto.randomUUID() })
      : null;

    if (legacyProfile) {
      await writeToStore(db, PROFILES_STORE, legacyProfile);
      await backfillBudgetProfileId(legacyProfile.id);
    }
  }

  await writeToStore(db, META_STORE, true, PROFILES_MIGRATION_KEY);
};

// Só o passo de migração (converter o perfil único legado, se existir, pra
// dentro de PROFILES_KEY) precisa do cache de promise — cachear a leitura
// inteira faria chamadas depois de addProfile/updateProfile/deleteProfile
// devolverem sempre a mesma lista congelada da primeira leitura.
let profilesFallbackMigrationPromise: Promise<void> | null = null;

const ensureProfilesFallbackMigrated = (): Promise<void> => {
  if (!profilesFallbackMigrationPromise) {
    profilesFallbackMigrationPromise = ensureProfilesFallbackMigratedInternal();
  }
  return profilesFallbackMigrationPromise;
};

const ensureProfilesFallbackMigratedInternal = async (): Promise<void> => {
  if (localStorage.getItem(PROFILES_KEY) !== null) {
    return;
  }

  const legacyProfileRaw = readLegacyProfile();
  const legacyProfile = legacyProfileRaw
    ? normalizeProfile({ ...legacyProfileRaw, id: crypto.randomUUID() })
    : null;

  if (!legacyProfile) {
    localStorage.setItem(PROFILES_KEY, JSON.stringify([]));
    return;
  }

  localStorage.setItem(PROFILES_KEY, JSON.stringify([legacyProfile]));
  await backfillBudgetProfileId(legacyProfile.id);
};

const migrateProfilesFallback = async (): Promise<MeiProfile[]> => {
  await ensureProfilesFallbackMigrated();
  return safeParse<unknown[]>(localStorage.getItem(PROFILES_KEY), [])
    .map(normalizeProfile)
    .filter((profile): profile is MeiProfile => profile !== null)
    .sort(sortProfiles);
};

// Os caches de promise acima vivem pela sessão inteira da aba — correto em
// produção (um único carregamento de módulo), mas cada teste simula uma
// "sessão" nova ao limpar o storage. Sem resetar isso entre testes, só o
// primeiro teste do arquivo migraria de verdade; os seguintes receberiam a
// promise já resolvida da execução anterior. Ver src/tests/setupTests.ts.
export const __resetStorageMigrationCacheForTests = (): void => {
  legacyMigrationPromise = null;
  profilesMigrationPromise = null;
  profilesFallbackMigrationPromise = null;
};
