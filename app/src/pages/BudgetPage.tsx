import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import { useBudget } from "../hooks/useBudget";
import { useClients } from "../hooks/useClients";
import { useProfiles } from "../hooks/useProfiles";
import { BudgetPreview } from "../components/BudgetPreview";
import { RemoteUpdateBanner } from "../components/RemoteUpdateBanner";
import type { Budget, BudgetClient, BudgetItem, Client, MeiProfile } from "../types";
import { budgetSchema } from "../utils/budgetSchema";
import { BUDGET_STATUSES, getBudgetStatusLabel } from "../utils/budgetStatus";
import { trackEvent } from "../utils/analytics";
import { maskCpfCnpj } from "../utils/document";
import { maskPhone } from "../utils/maskPhone";
import { formatCurrency } from "../utils/format";

// Campos numéricos controlados: coagir "" para 0 a cada tecla força o React a
// re-renderizar o input com valor "0" no meio da digitação, o que faz o
// cursor pular e embaralha os dígitos seguintes (ex.: digitar "50" vira
// "500"). Mantemos NaN como estado intermediário válido enquanto o campo
// está vazio, e só exibimos "" nesse caso — o schema de validação já rejeita
// valores não finitos no submit.
const parseNumericInput = (value: string): number =>
  value === "" ? NaN : Number(value);

const displayNumericValue = (value: number): number | string =>
  Number.isFinite(value) ? value : "";

function AccordionItem({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-[0_18px_40px_rgba(2,6,23,0.18)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-white/2 p-4 text-slate-100 transition-colors hover:bg-white/5"
      >
        <span className="font-semibold text-base">{title}</span>
        {isOpen ? (
          <ChevronUp size={20} className="text-slate-400" />
        ) : (
          <ChevronDown size={20} className="text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-white/10 bg-slate-950/40 p-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Componente Toggle (Switch)
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-2">
      <span className="text-sm font-medium text-slate-300 transition-colors group-hover:text-white">
        {label}
      </span>
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="h-6 w-11 rounded-full bg-slate-700 peer peer-checked:bg-blue-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400/40 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-slate-500 after:bg-white after:transition-all after:content-['']"></div>
      </div>
    </label>
  );
}

export function BudgetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    profiles,
    loading: profilesLoading,
    error: profilesError,
    remoteUpdateAvailable: profilesRemoteUpdate,
    refreshProfiles,
  } = useProfiles();
  const {
    budgets,
    loading: budgetsLoading,
    error: budgetsError,
    addBudget,
    updateBudget,
  } = useBudget();
  const {
    clients,
    addClient,
    remoteUpdateAvailable: clientsRemoteUpdate,
    refreshClients,
  } = useClients();
  const remoteUpdateAvailable = profilesRemoteUpdate || clientsRemoteUpdate;
  const refreshClientsAndProfiles = () => {
    void refreshClients();
    void refreshProfiles();
  };
  const initializedFromUrl = useRef(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const [proposalData, setProposalData] = useState({
    number: "",
  });

  const [clientData, setClientData] = useState<BudgetClient>({
    name: "",
    document: "",
    address: "",
    email: "",
    phone: "",
    clientId: undefined,
  });
  const [clientSuggestionField, setClientSuggestionField] = useState<
    "name" | "document" | null
  >(null);
  const [saveAsNewClient, setSaveAsNewClient] = useState(false);

  const [items, setItems] = useState<BudgetItem[]>([
    {
      id: crypto.randomUUID(),
      descricao: "",
      quantidade: 1,
      unidade: "UN",
      valorUnitario: 0,
    },
  ]);

  const [config, setConfig] = useState({
    exibirLogo: true,
    validade: { ativo: true, dias: 7 },
    desconto: { ativo: false, valor: 0 },
    condicoesPagamento: {
      ativo: false,
      texto: "",
    },
    observacoes: {
      ativo: false,
      texto: "",
    },
    assinatura: true,
    footerText: "",
    status: "draft" as Budget["status"],
  });

  const [openAccordion, setOpenAccordion] = useState<string>("client");
  const [savedBudgetId, setSavedBudgetId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const subtotal = useMemo(
    () =>
      items.reduce((acc, item) => {
        const lineTotal = item.quantidade * item.valorUnitario;
        return acc + (Number.isFinite(lineTotal) ? lineTotal : 0);
      }, 0),
    [items],
  );
  const appliedDiscount =
    config.desconto.ativo && Number.isFinite(config.desconto.valor)
      ? config.desconto.valor
      : 0;
  const total = subtotal - appliedDiscount;
  const suggestedProposalNumber = useMemo(
    () =>
      budgets.reduce(
        (highest, budget) => Math.max(highest, budget.number || 0),
        0,
      ) + 1,
    [budgets],
  );

  const mockDate = new Date();

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );
  const currentProfile: MeiProfile = selectedProfile ?? {
    id: "",
    companyName: "",
    document: "",
    phone: "",
    userName: "",
    logo: "",
    pixKey: "",
    createdAt: "",
  };
  const hasAnyProfile = profiles.length > 0;
  const profileRequiredMessage =
    "Cadastre os dados da sua empresa em Perfil antes de salvar um orçamento.";
  const profileSelectionRequiredMessage =
    "Selecione a empresa emissora deste orçamento antes de salvar.";

  // Só pré-seleciona automaticamente quando existe exatamente 1 empresa —
  // não há escolha real a fazer nesse caso. Com 2+ empresas, exige escolha
  // explícita (evita emitir sob o nome errado por engano). Orçamento em
  // edição/duplicação é tratado à parte, usando o profileId salvo nele.
  // Ajuste de estado durante a renderização (não em efeito): React re-executa
  // o componente antes de pintar a tela, e a própria condição (checando
  // selectedProfileId) impede loop, já que na re-renderização ela deixa de
  // ser verdadeira.
  const hasBudgetSource = Boolean(
    searchParams.get("edit") || searchParams.get("duplicate"),
  );
  if (!hasBudgetSource && !selectedProfileId && profiles.length === 1) {
    setSelectedProfileId(profiles[0].id);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (budgetsLoading) {
        return;
      }

      const editId = searchParams.get("edit");
      const duplicateId = searchParams.get("duplicate");
      const sourceId = editId || duplicateId;

      if (!sourceId || initializedFromUrl.current) {
        return;
      }

      const sourceBudget = budgets.find((budget) => budget.id === sourceId);
      if (!sourceBudget) {
        setSubmitError("Orçamento não encontrado no histórico.");
        initializedFromUrl.current = true;
        return;
      }

      initializedFromUrl.current = true;
      setSavedBudgetId(editId ? sourceBudget.id : null);
      setSelectedProfileId(sourceBudget.profileId ?? null);
      setProposalData({
        number: duplicateId
          ? String(suggestedProposalNumber)
          : String(sourceBudget.number),
      });
      setClientData(sourceBudget.client);
      setItems(sourceBudget.items.length > 0 ? sourceBudget.items : items);
      setConfig({
        exibirLogo: true,
        validade: {
          ativo: Boolean(sourceBudget.validUntil),
          dias: sourceBudget.validUntil
            ? Math.max(
                1,
                Math.round(
                  (new Date(sourceBudget.validUntil).getTime() -
                    new Date(sourceBudget.createdAt).getTime()) /
                    (24 * 60 * 60 * 1000),
                ),
              )
            : 7,
        },
        desconto: {
          ativo: sourceBudget.totals.discount > 0,
          valor: sourceBudget.totals.discount,
        },
        condicoesPagamento: {
          ativo: Boolean(sourceBudget.paymentTerms),
          texto: sourceBudget.paymentTerms ?? "",
        },
        observacoes: {
          ativo: Boolean(sourceBudget.terms),
          texto: sourceBudget.terms ?? "",
        },
        assinatura: sourceBudget.modules.showSignature,
        footerText: sourceBudget.modules.footerText ?? "",
        status: sourceBudget.status,
      });
      setSaveAsNewClient(false);
      setIsDirty(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    budgets,
    budgetsLoading,
    items,
    searchParams,
    suggestedProposalNumber,
  ]);

  const handleUpdateItem = (
    id: string,
    field: keyof BudgetItem,
    value: string | number,
  ) => {
    setFormErrors((prev) => ({ ...prev, [`items.${id}.${field}`]: "" }));
    setIsDirty(true);
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  };

  const handleAddItem = () => {
    setIsDirty(true);
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        descricao: "",
        quantidade: 1,
        unidade: "UN",
        valorUnitario: 0,
      },
    ]);
    setOpenAccordion("items");
  };

  const handleRemoveItem = (id: string) => {
    setIsDirty(true);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleClientChange = (field: keyof BudgetClient, value: string) => {
    setFormErrors((prev) => ({ ...prev, [`client.${field}`]: "" }));
    setIsDirty(true);
    setClientData((prev) => ({
      ...prev,
      [field]: value,
      // Editar nome/documento à mão desvincula do cadastro selecionado —
      // não dá pra garantir que os dados ainda batem com aquele registro.
      clientId:
        field === "name" || field === "document" ? undefined : prev.clientId,
    }));
    if (field === "name" || field === "document") {
      setClientSuggestionField(field);
    }
  };

  const clientNameSuggestions = useMemo(() => {
    const term = clientData.name.trim().toLowerCase();
    if (!term) {
      return [];
    }
    return clients
      .filter((client) => client.name.toLowerCase().includes(term))
      .slice(0, 5);
  }, [clients, clientData.name]);

  const clientDocumentSuggestions = useMemo(() => {
    const term = (clientData.document ?? "").replace(/\D/g, "");
    if (!term) {
      return [];
    }
    return clients
      .filter((client) => (client.document ?? "").replace(/\D/g, "").includes(term))
      .slice(0, 5);
  }, [clients, clientData.document]);

  const handleSelectClient = (client: Client) => {
    setFormErrors((prev) => ({ ...prev, "client.name": "", "client.document": "" }));
    setIsDirty(true);
    setClientData({
      name: client.name,
      document: client.document ?? "",
      address: client.address ?? "",
      email: client.email ?? "",
      phone: client.phone ? maskPhone(client.phone) : "",
      clientId: client.id,
    });
    setSaveAsNewClient(false);
    setClientSuggestionField(null);
  };

  const closeClientSuggestions = (field: "name" | "document") => {
    window.setTimeout(() => {
      setClientSuggestionField((current) => (current === field ? null : current));
    }, 150);
  };

  const handleConfigChange = (nextConfig: typeof config) => {
    setIsDirty(true);
    setConfig(nextConfig);
  };

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleBack = () => {
    if (isDirty && !window.confirm("Sair sem salvar as mudanças deste orçamento?")) {
      return;
    }
    void navigate("/dashboard");
  };

  const validateBudget = () => {
    const validation = budgetSchema.safeParse({
      client: clientData,
      items,
      proposalNumber: proposalData.number,
      validityDays: config.validade.ativo ? config.validade.dias : undefined,
      discount: config.desconto.ativo ? config.desconto.valor : 0,
      paymentTerms: config.condicoesPagamento.ativo
        ? config.condicoesPagamento.texto
        : undefined,
      terms: config.observacoes.ativo ? config.observacoes.texto : undefined,
    });

    if (validation.success) {
      setFormErrors({});
      setSubmitError(null);
      return true;
    }

    const nextErrors: Record<string, string> = {};
    validation.error.issues.forEach((issue) => {
      const key = issue.path.join(".");
      nextErrors[key || "form"] = issue.message;
    });
    setFormErrors(nextErrors);
    setSubmitError("Revise os campos destacados antes de salvar.");
    setOpenAccordion(nextErrors["client.name"] ? "client" : "items");
    return false;
  };

  const parseProposalNumber = () => {
    const parsedNumber = Number.parseInt(
      proposalData.number.replace(/\D/g, ""),
      10,
    );
    if (!Number.isFinite(parsedNumber) || parsedNumber < 1) {
      return suggestedProposalNumber;
    }

    const duplicated = budgets.some(
      (budget) => budget.number === parsedNumber && budget.id !== savedBudgetId,
    );
    return duplicated ? suggestedProposalNumber : parsedNumber;
  };

  const buildBudgetPayload = (): Budget => {
    const createdAt = new Date().toISOString();
    const budgetId = savedBudgetId ?? crypto.randomUUID();
    const discountValue = config.desconto.ativo ? config.desconto.valor : 0;

    return {
      id: budgetId,
      number: parseProposalNumber(),
      createdAt,
      status: config.status,
      validUntil: config.validade.ativo
        ? new Date(
            Date.now() + config.validade.dias * 24 * 60 * 60 * 1000,
          ).toISOString()
        : undefined,
      profileId: selectedProfileId ?? undefined,
      client: clientData,
      items,
      terms: config.observacoes.ativo ? config.observacoes.texto : undefined,
      paymentTerms: config.condicoesPagamento.ativo
        ? config.condicoesPagamento.texto
        : undefined,
      discount: discountValue,
      modules: {
        showTerms: config.observacoes.ativo,
        showSignature: config.assinatura,
        footerText: config.footerText.trim() ? config.footerText : undefined,
      },
      totals: {
        subtotal,
        discount: discountValue,
        total: total > 0 ? total : 0,
      },
    };
  };

  const ensureSavedBudget = async (patch?: Partial<Budget>) => {
    let effectiveClientData = clientData;

    if (saveAsNewClient && !clientData.clientId && clientData.name.trim()) {
      const newClient: Client = {
        id: crypto.randomUUID(),
        name: clientData.name.trim(),
        document: clientData.document || undefined,
        address: clientData.address || undefined,
        email: clientData.email || undefined,
        phone: clientData.phone || undefined,
        createdAt: new Date().toISOString(),
      };
      await addClient(newClient);
      effectiveClientData = { ...clientData, clientId: newClient.id };
      setClientData(effectiveClientData);
      setSaveAsNewClient(false);
      trackEvent("client-created");
    }

    const budget = {
      ...buildBudgetPayload(),
      client: effectiveClientData,
      ...patch,
    };

    if (savedBudgetId) {
      await updateBudget(savedBudgetId, budget);
      trackEvent("budget-updated");
      return budget;
    }

    await addBudget(budget);
    setSavedBudgetId(budget.id);
    trackEvent("budget-created");
    return budget;
  };

  const handleSaveDraft = async () => {
    if (!hasAnyProfile) {
      setSubmitError(profileRequiredMessage);
      return;
    }

    if (!selectedProfileId) {
      setSubmitError(profileSelectionRequiredMessage);
      setFormErrors((prev) => ({
        ...prev,
        profileId: profileSelectionRequiredMessage,
      }));
      setOpenAccordion("client");
      return;
    }

    if (!validateBudget()) {
      return;
    }

    setSaving(true);
    try {
      await ensureSavedBudget();
      setIsDirty(false);
      void navigate("/dashboard");
    } catch {
      setSubmitError("Não foi possível salvar o orçamento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* 4. A Barra Superior (Header de Ação) */}
      <header className="sticky top-0 z-20 flex h-18 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/95 px-6 shadow-[0_14px_40px_rgba(2,6,23,0.35)] backdrop-blur">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 rounded-xl px-3 py-2 font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            ← <span className="hidden sm:inline">Voltar</span>
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Construtor de Orçamento
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {hasAnyProfile ? (
            <button
              type="button"
              onClick={() => {
                void handleSaveDraft();
              }}
              disabled={saving || budgetsLoading || profilesLoading}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2 font-bold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} /> {saving ? "Salvando..." : "Salvar Orçamento"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                void navigate("/profile");
              }}
              disabled={profilesLoading}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 font-bold text-slate-950 shadow-sm shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} /> Cadastrar Empresa
            </button>
          )}
        </div>
      </header>

      {/* 1. O Layout Global (Tela Dividida) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-72px)] relative">
        {/* Lado Esquerdo (Controles - 5 colunas) */}
        <aside className="custom-scrollbar overflow-y-auto border-r border-white/10 bg-slate-950 p-6 lg:col-span-5">
          <div className="max-w-xl mx-auto flex flex-col space-y-2">
            {submitError || budgetsError || profilesError ? (
              <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {submitError || budgetsError || profilesError}
              </div>
            ) : null}
            {remoteUpdateAvailable ? (
              <RemoteUpdateBanner
                label="A lista de clientes ou empresas mudou em outra aba — pode estar desatualizada aqui."
                onRefresh={refreshClientsAndProfiles}
              />
            ) : null}
            {profilesLoading || budgetsLoading ? (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-slate-300">
                Carregando dados locais...
              </div>
            ) : null}
            {!profilesLoading && !hasAnyProfile ? (
              <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>{profileRequiredMessage}</span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigate("/profile");
                    }}
                    className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-950 transition hover:bg-amber-300"
                  >
                    Ir para Perfil
                  </button>
                </div>
              </div>
            ) : null}
            <AccordionItem
              title="1. Dados da Proposta e Cliente"
              isOpen={openAccordion === "client"}
              onToggle={() =>
                setOpenAccordion(openAccordion === "client" ? "" : "client")
              }
            >
              <div className="flex flex-col gap-5 text-sm font-medium">
                {hasAnyProfile ? (
                  <label className="flex flex-col gap-1.5 transition-colors focus-within:text-blue-300">
                    <span className="font-semibold text-slate-300">
                      Empresa Emissora <span className="text-red-500">*</span>
                    </span>
                    <select
                      name="profileId"
                      value={selectedProfileId ?? ""}
                      onChange={(e) => {
                        const value = e.target.value || null;
                        setSelectedProfileId(value);
                        setIsDirty(true);
                        setFormErrors((prev) => ({ ...prev, profileId: "" }));
                      }}
                      className={`rounded-xl border bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 ${
                        formErrors.profileId
                          ? "border-rose-400"
                          : "border-white/10"
                      }`}
                    >
                      <option value="">Selecione a empresa</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.companyName}
                        </option>
                      ))}
                    </select>
                    {formErrors.profileId ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.profileId}
                      </span>
                    ) : null}
                  </label>
                ) : null}

                <label className="flex flex-col gap-1.5 transition-colors focus-within:text-blue-300">
                  <span className="font-semibold text-slate-300">
                    Nº do Orçamento
                  </span>
                  <input
                    name="proposalNumber"
                    type="text"
                    value={proposalData.number}
                    onChange={(e) => {
                      setProposalData({ number: e.target.value });
                      setIsDirty(true);
                    }}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <hr className="border-white/10" />

                <label className="relative flex flex-col gap-1.5 transition-colors focus-within:text-blue-300">
                  <span className="font-semibold text-slate-300">
                    Nome do Cliente <span className="text-red-500">*</span>
                  </span>
                  <input
                    name="clientName"
                    type="text"
                    autoComplete="off"
                    value={clientData.name}
                    onChange={(e) => handleClientChange("name", e.target.value)}
                    onFocus={() => setClientSuggestionField("name")}
                    onBlur={() => closeClientSuggestions("name")}
                    className={`rounded-xl border bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 ${
                      formErrors["client.name"]
                        ? "border-rose-400"
                        : "border-white/10"
                    }`}
                    placeholder="Ex: João da Silva"
                  />
                  {formErrors["client.name"] ? (
                    <span className="text-xs text-rose-300">
                      {formErrors["client.name"]}
                    </span>
                  ) : null}
                  {clientSuggestionField === "name" &&
                  clientNameSuggestions.length > 0 ? (
                    <ul className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-xl">
                      {clientNameSuggestions.map((client) => (
                        <li key={client.id}>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectClient(client)}
                            className="flex w-full flex-col px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
                          >
                            <span className="font-medium">{client.name}</span>
                            {client.document ? (
                              <span className="text-xs text-slate-500">
                                {client.document}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </label>
                <label className="relative flex flex-col gap-1.5 transition-colors focus-within:text-blue-300">
                  <span className="font-semibold text-slate-300">
                    CPF / CNPJ
                  </span>
                  <input
                    name="clientDocument"
                    type="text"
                    autoComplete="off"
                    value={clientData.document || ""}
                    onChange={(e) =>
                      handleClientChange("document", maskCpfCnpj(e.target.value))
                    }
                    onFocus={() => setClientSuggestionField("document")}
                    onBlur={() => closeClientSuggestions("document")}
                    className={`rounded-xl border bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 ${
                      formErrors["client.document"]
                        ? "border-rose-400"
                        : "border-white/10"
                    }`}
                    placeholder="Opcional"
                  />
                  {formErrors["client.document"] ? (
                    <span className="text-xs text-rose-300">
                      {formErrors["client.document"]}
                    </span>
                  ) : null}
                  {clientSuggestionField === "document" &&
                  clientDocumentSuggestions.length > 0 ? (
                    <ul className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-xl">
                      {clientDocumentSuggestions.map((client) => (
                        <li key={client.id}>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectClient(client)}
                            className="flex w-full flex-col px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
                          >
                            <span className="font-medium">{client.name}</span>
                            <span className="text-xs text-slate-500">
                              {client.document}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </label>
                {clientData.clientId ? (
                  <p className="text-xs text-emerald-300">
                    Vinculado ao cliente cadastrado. Edite nome ou documento
                    para desvincular.
                  </p>
                ) : clientData.name.trim() ? (
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={saveAsNewClient}
                      onChange={(e) => setSaveAsNewClient(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-slate-950"
                    />
                    Cadastrar este cliente para reaproveitar depois
                  </label>
                ) : null}
                <label className="flex flex-col gap-1.5 transition-colors focus-within:text-blue-300">
                  <span className="font-semibold text-slate-300">
                    Email do Cliente
                  </span>
                  <input
                    name="clientEmail"
                    type="email"
                    value={clientData.email || ""}
                    onChange={(e) => handleClientChange("email", e.target.value)}
                    className={`rounded-xl border bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 ${
                      formErrors["client.email"]
                        ? "border-rose-400"
                        : "border-white/10"
                    }`}
                    placeholder="cliente@email.com"
                  />
                  {formErrors["client.email"] ? (
                    <span className="text-xs text-rose-300">
                      {formErrors["client.email"]}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1.5 transition-colors focus-within:text-blue-300">
                  <span className="font-semibold text-slate-300">
                    Endereço Completo
                  </span>
                  <input
                    name="clientAddress"
                    type="text"
                    value={clientData.address || ""}
                    onChange={(e) =>
                      handleClientChange("address", e.target.value)
                    }
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Opcional"
                  />
                </label>
                <label className="flex flex-col gap-1.5 transition-colors focus-within:text-blue-300">
                  <span className="font-semibold text-slate-300">
                    WhatsApp do Cliente
                  </span>
                  <input
                    name="clientPhone"
                    type="text"
                    value={clientData.phone || ""}
                    onChange={(e) =>
                      handleClientChange("phone", maskPhone(e.target.value))
                    }
                    className={`rounded-xl border bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 ${
                      formErrors["client.phone"]
                        ? "border-rose-400"
                        : "border-white/10"
                    }`}
                    placeholder="Ex: (11) 99999-9999"
                  />
                  {formErrors["client.phone"] ? (
                    <span className="text-xs text-rose-300">
                      {formErrors["client.phone"]}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1.5 transition-colors focus-within:text-blue-300">
                  <span className="font-semibold text-slate-300">Status</span>
                  <select
                    name="budgetStatus"
                    value={config.status}
                    onChange={(event) => {
                      handleConfigChange({
                        ...config,
                        status: event.target.value as Budget["status"],
                      });
                    }}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  >
                    {BUDGET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {getBudgetStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </AccordionItem>

            <AccordionItem
              title="2. Itens e Valores"
              isOpen={openAccordion === "items"}
              onToggle={() =>
                setOpenAccordion(openAccordion === "items" ? "" : "items")
              }
            >
              <div className="flex flex-col gap-5">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Item {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                        title="Remover item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-semibold text-slate-300">
                        Descrição <span className="text-red-500">*</span>
                      </span>
                        <input
                          name={`items.${index}.descricao`}
                          type="text"
                        value={item.descricao}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "descricao", e.target.value)
                        }
                        className={`rounded-xl border bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 ${
                          formErrors[`items.${index}.descricao`]
                            ? "border-rose-400"
                            : "border-white/10"
                        }`}
                        placeholder="Ex: Desenvolvimento de Site"
                      />
                      {formErrors[`items.${index}.descricao`] ? (
                        <span className="text-xs text-rose-300">
                          {formErrors[`items.${index}.descricao`]}
                        </span>
                      ) : null}
                    </label>

                    <div className="grid grid-cols-[1fr_80px_1fr] gap-3">
                      <label className="flex flex-col gap-1.5 text-sm">
                          <span className="font-semibold text-slate-300">
                            Qtd.
                          </span>
                        <input
                          name={`items.${index}.quantidade`}
                          type="number"
                          min="1"
                          value={displayNumericValue(item.quantidade)}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "quantidade",
                              parseNumericInput(e.target.value),
                            )
                          }
                          className={`rounded-xl border bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 ${
                            formErrors[`items.${index}.quantidade`]
                              ? "border-rose-400"
                              : "border-white/10"
                          }`}
                        />
                        {formErrors[`items.${index}.quantidade`] ? (
                          <span className="text-xs text-rose-300">
                            {formErrors[`items.${index}.quantidade`]}
                          </span>
                        ) : null}
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-semibold text-slate-300">
                          Unidade
                        </span>
                        <select
                          name={`items.${index}.unidade`}
                          value={item.unidade}
                          onChange={(e) =>
                            handleUpdateItem(item.id, "unidade", e.target.value)
                          }
                          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                        >
                          <option value="UN">UN</option>
                          <option value="HR">HR</option>
                          <option value="M2">M²</option>
                          <option value="CX">CX</option>
                          <option value="KG">KG</option>
                          <option value="LT">LT</option>
                          <option value="SV">SV</option>
                          <option value="DIA">DIA</option>
                          <option value="MES">MÊS</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-semibold text-slate-300">
                          Valor Unitário
                        </span>
                        <input
                          name={`items.${index}.valorUnitario`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={displayNumericValue(item.valorUnitario)}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "valorUnitario",
                              parseNumericInput(e.target.value),
                            )
                          }
                          className={`rounded-xl border bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 ${
                            formErrors[`items.${index}.valorUnitario`]
                              ? "border-rose-400"
                              : "border-white/10"
                          }`}
                        />
                        {formErrors[`items.${index}.valorUnitario`] ? (
                          <span className="text-xs text-rose-300">
                            {formErrors[`items.${index}.valorUnitario`]}
                          </span>
                        ) : null}
                      </label>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/3 p-3 text-sm">
                      <span className="font-medium text-slate-400">
                        Subtotal:
                      </span>
                      <span className="font-bold text-slate-100">
                        {formatCurrency(
                          Number.isFinite(item.quantidade * item.valorUnitario)
                            ? item.quantidade * item.valorUnitario
                            : 0,
                        )}
                      </span>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleAddItem}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-400/30 bg-emerald-400/10 py-3.5 text-sm font-semibold text-emerald-200 transition-all hover:border-emerald-300 hover:bg-emerald-400/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <Plus size={18} /> Adicionar Novo Item
                </button>
              </div>
            </AccordionItem>

            <AccordionItem
              title="3. Configurações do Documento"
              isOpen={openAccordion === "config"}
              onToggle={() =>
                setOpenAccordion(openAccordion === "config" ? "" : "config")
              }
            >
              <div className="flex flex-col gap-2">
                <Toggle
                  label="Exibir Logo da Empresa"
                  checked={config.exibirLogo}
                  onChange={(c) => handleConfigChange({ ...config, exibirLogo: c })}
                />

                <hr className="my-1 border-white/10" />

                <Toggle
                  label="Validade do Orçamento"
                  checked={config.validade.ativo}
                  onChange={(c) =>
                    handleConfigChange({
                      ...config,
                      validade: { ...config.validade, ativo: c },
                    })
                  }
                />
                {config.validade.ativo && (
                    <div className="mb-2 rounded-r-xl border-l-[3px] border-blue-400 bg-white/3 py-3 pl-4 pr-1">
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-slate-300">
                          Válido por (dias)
                        </span>
                      <input
                        type="number"
                        min="1"
                        value={displayNumericValue(config.validade.dias)}
                        onChange={(e) =>
                          handleConfigChange({
                            ...config,
                            validade: {
                              ...config.validade,
                              dias: parseNumericInput(e.target.value),
                            },
                          })
                        }
                        className={`w-full rounded-lg border bg-slate-950 p-2 text-slate-100 outline-none focus:ring-blue-500 ${
                          formErrors.validityDays
                            ? "border-rose-400"
                            : "border-white/10"
                        }`}
                      />
                      {formErrors.validityDays ? (
                        <span className="text-xs text-rose-300">
                          {formErrors.validityDays}
                        </span>
                      ) : null}
                    </label>
                  </div>
                )}

                <hr className="my-1 border-white/10" />

                <Toggle
                  label="Aplicar Desconto"
                  checked={config.desconto.ativo}
                  onChange={(c) =>
                    handleConfigChange({
                      ...config,
                      desconto: { ...config.desconto, ativo: c },
                    })
                  }
                />
                {config.desconto.ativo && (
                    <div className="mb-2 rounded-r-xl border-l-[3px] border-emerald-400 bg-white/3 py-3 pl-4 pr-1">
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-slate-300">
                          Valor do Desconto (R$)
                        </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={displayNumericValue(config.desconto.valor)}
                        onChange={(e) =>
                          handleConfigChange({
                            ...config,
                            desconto: {
                              ...config.desconto,
                              valor: parseNumericInput(e.target.value),
                            },
                          })
                        }
                        className={`w-full rounded-lg border bg-slate-950 p-2 text-slate-100 outline-none focus:ring-emerald-500 ${
                          formErrors.discount
                            ? "border-rose-400"
                            : "border-white/10"
                        }`}
                      />
                      {formErrors.discount ? (
                        <span className="text-xs text-rose-300">
                          {formErrors.discount}
                        </span>
                      ) : null}
                    </label>
                  </div>
                )}

                <hr className="my-1 border-white/10" />

                <Toggle
                  label="Condições de Pagamento"
                  checked={config.condicoesPagamento.ativo}
                  onChange={(c) =>
                    handleConfigChange({
                      ...config,
                      condicoesPagamento: {
                        ...config.condicoesPagamento,
                        ativo: c,
                      },
                    })
                  }
                />
                {config.condicoesPagamento.ativo && (
                    <div className="mb-2 rounded-r-xl border-l-[3px] border-fuchsia-400 bg-white/3 py-3 pl-4 pr-1">
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-slate-300">
                          Detalhes (PIX, parcelas, etc)
                        </span>
                      <textarea
                        rows={2}
                        value={config.condicoesPagamento.texto}
                        onChange={(e) =>
                          handleConfigChange({
                            ...config,
                            condicoesPagamento: {
                              ...config.condicoesPagamento,
                              texto: e.target.value,
                            },
                          })
                        }
                        className="w-full resize-none rounded-lg border border-white/10 bg-slate-950 p-2 text-slate-100 outline-none focus:ring-fuchsia-500"
                      />
                    </label>
                  </div>
                )}

                <hr className="my-1 border-white/10" />

                <Toggle
                  label="Observações e Termos de Garantia"
                  checked={config.observacoes.ativo}
                  onChange={(c) =>
                    handleConfigChange({
                      ...config,
                      observacoes: { ...config.observacoes, ativo: c },
                    })
                  }
                />
                {config.observacoes.ativo && (
                    <div className="mb-2 rounded-r-xl border-l-[3px] border-amber-400 bg-white/3 py-3 pl-4 pr-1">
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-slate-300">
                          Regras de negócio
                        </span>
                      <textarea
                        rows={3}
                        value={config.observacoes.texto}
                        onChange={(e) =>
                          handleConfigChange({
                            ...config,
                            observacoes: {
                              ...config.observacoes,
                              texto: e.target.value,
                            },
                          })
                        }
                        className="w-full resize-none rounded-lg border border-white/10 bg-slate-950 p-2 text-slate-100 outline-none focus:ring-amber-500"
                      />
                    </label>
                  </div>
                )}

                <hr className="my-1 border-white/10" />

                <Toggle
                  label="Campo de Assinatura"
                  checked={config.assinatura}
                  onChange={(c) => handleConfigChange({ ...config, assinatura: c })}
                />

                <hr className="my-1 border-white/10" />

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-semibold text-slate-300">
                    Rodapé personalizado do PDF
                  </span>
                  <textarea
                    rows={2}
                    value={config.footerText}
                    onChange={(e) =>
                      handleConfigChange({
                        ...config,
                        footerText: e.target.value,
                      })
                    }
                    className="w-full resize-none rounded-lg border border-white/10 bg-slate-950 p-2 text-slate-100 outline-none focus:ring-blue-500"
                    placeholder="Deixe em branco para manter o rodapé padrão do Orça Rápido."
                  />
                  <span className="text-xs text-slate-500">
                    Vazio: mostra o rodapé padrão de apoio ao projeto.
                    Preenchido: substitui pelo seu texto neste orçamento.
                  </span>
                </label>
              </div>
            </AccordionItem>
          </div>
        </aside>

        {/* Lado Direito (Preview - 7 colunas) com fundo escuro e sticky behavior */}
        <main className="custom-scrollbar relative z-0 flex h-full w-full justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_35%),linear-gradient(180deg,#0f172a,#020617)] lg:col-span-7">
          <div className="w-full py-8 px-4 sm:px-8 xl:px-12 flex justify-center items-start min-h-[calc(100vh-72px)]">
            <BudgetPreview
              profile={currentProfile}
              proposalNumber={proposalData.number}
              createdAt={mockDate}
              validityDays={
                config.validade.ativo && Number.isFinite(config.validade.dias)
                  ? config.validade.dias
                  : undefined
              }
              client={clientData}
              items={items}
              subtotal={subtotal}
              discount={appliedDiscount}
              total={total > 0 ? total : 0}
              showLogo={config.exibirLogo}
              showSignature={config.assinatura}
              footerText={config.footerText.trim() || undefined}
              paymentTerms={
                config.condicoesPagamento.ativo
                  ? config.condicoesPagamento.texto
                  : undefined
              }
              terms={
                config.observacoes.ativo ? config.observacoes.texto : undefined
              }
            />
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.4);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.6);
        }
      `}</style>
    </div>
  );
}
