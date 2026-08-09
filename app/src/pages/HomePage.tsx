import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { EmptyState } from "../components/EmptyState";
import { useBudget } from "../hooks/useBudget";
import { useClients } from "../hooks/useClients";
import { useProfiles } from "../hooks/useProfiles";
import { formatCurrency, formatDate } from "../utils/format";
import { printBudget as openBudgetPrintWindow } from "../utils/printBudget";
import { buildBudgetWhatsAppShareUrl } from "../utils/whatsapp";
import { getBudgetStatusLabel } from "../utils/budgetStatus";
import type { Budget, MeiProfile } from "../types";

const BLANK_PROFILE: MeiProfile = {
  id: "",
  companyName: "",
  userName: "",
  phone: "",
  pixKey: "",
  logo: undefined,
  createdAt: "",
};

export const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    budgets,
    loading,
    error,
    clearBudgets,
    deleteBudget,
  } = useBudget();
  const { profiles } = useProfiles();
  const { clients } = useClients();
  const [printError, setPrintError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const clientFilterId = searchParams.get("clientId");
  const clientFilter = clientFilterId
    ? clients.find((client) => client.id === clientFilterId)
    : null;
  const profileFilterId = searchParams.get("profileId");
  const profileFilter = profileFilterId
    ? profiles.find((profile) => profile.id === profileFilterId)
    : null;

  const clearClientFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("clientId");
    setSearchParams(nextParams);
  };

  const clearProfileFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("profileId");
    setSearchParams(nextParams);
  };
  const [confirmation, setConfirmation] = useState<
    | { action: "delete"; budgetId: string; label: string }
    | { action: "reset"; label: string }
    | null
  >(null);

  const resolveProfileForBudget = (budget: Budget): MeiProfile =>
    profiles.find((profile) => profile.id === budget.profileId) ??
    BLANK_PROFILE;

  const filteredBudgets = useMemo(() => {
    const byClient = clientFilterId
      ? budgets.filter((budget) => budget.client.clientId === clientFilterId)
      : budgets;
    const byProfile = profileFilterId
      ? byClient.filter((budget) => budget.profileId === profileFilterId)
      : byClient;

    const term = search.trim().toLowerCase();
    if (!term) {
      return byProfile;
    }

    return byProfile.filter((budget) =>
      [
        budget.client.name,
        budget.client.document,
        budget.client.phone,
        budget.client.email,
        budget.status,
        String(budget.number),
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term)),
    );
  }, [budgets, search, clientFilterId, profileFilterId]);

  const handlePrintBudget = (budgetId: string) => {
    const budget = budgets.find((item) => item.id === budgetId);
    if (!budget) {
      return;
    }

    setPrintError(null);
    // Chamado de forma síncrona dentro do handler de clique: window.open
    // precisa rodar no mesmo tick do gesto do usuário, senão o navegador
    // trata como pop-up não solicitado e bloqueia.
    const opened = openBudgetPrintWindow(budget, resolveProfileForBudget(budget));
    if (!opened) {
      setPrintError(
        "Não foi possível abrir a janela de impressão. Verifique se o navegador está bloqueando pop-ups.",
      );
    }
  };

  const handleShareWhatsApp = (budget: Budget) => {
    const url = buildBudgetWhatsAppShareUrl(
      budget,
      resolveProfileForBudget(budget).companyName,
    );
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDeleteBudget = (budgetId: string) => {
    const budget = budgets.find((item) => item.id === budgetId);
    const label = budget?.client.name || `#${budget?.number ?? ""}`;
    setConfirmation({ action: "delete", budgetId, label });
  };

  const handleResetBudgets = () => {
    setConfirmation({ action: "reset", label: "todo o histórico" });
  };

  const handleConfirmAction = async () => {
    if (!confirmation) {
      return;
    }

    if (confirmation.action === "delete") {
      await deleteBudget(confirmation.budgetId);
    } else {
      await clearBudgets();
    }
    setConfirmation(null);
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">Meu Painel</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Acompanhe seu histórico de orçamentos, gere novamente os PDFs e
              acesse rapidamente as configurações do perfil.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="ghost" onClick={() => { void navigate("/data"); }}>
              Exportar/Importar Dados
            </Button>
            <Button variant="ghost" onClick={() => { void navigate("/clients"); }}>
              Clientes
            </Button>
            <Button variant="ghost" onClick={() => { void navigate("/pipeline"); }}>
              Pipeline
            </Button>
            <Button variant="ghost" onClick={handleResetBudgets}>
              Resetar Orçamentos
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void navigate("/profile");
              }}
            >
              Empresas
            </Button>
            <Button
              onClick={() => {
                void navigate("/builder");
              }}
            >
              Novo Orçamento
            </Button>
          </div>
        </header>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
          <span>Dados salvos localmente neste navegador.</span>
          <a className="underline-offset-4 hover:underline" href="/privacy">
            Política de privacidade
          </a>
          <a className="underline-offset-4 hover:underline" href="/terms">
            Termos de uso
          </a>
          <a
            className="underline-offset-4 hover:underline"
            href="/storage-notice"
          >
            Aviso de armazenamento local
          </a>
        </div>

        <section className="mt-8">
          {clientFilterId ? (
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-100">
              <span>
                Filtrando orçamentos de{" "}
                <strong>{clientFilter?.name ?? "cliente removido"}</strong>.
              </span>
              <button
                type="button"
                onClick={clearClientFilter}
                className="ml-auto text-xs font-semibold uppercase tracking-wide text-blue-200 underline-offset-4 hover:underline"
              >
                Limpar filtro
              </button>
            </div>
          ) : null}
          {profileFilterId ? (
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              <span>
                Filtrando orçamentos da empresa{" "}
                <strong>
                  {profileFilter?.companyName ?? "empresa removida"}
                </strong>
                .
              </span>
              <button
                type="button"
                onClick={clearProfileFilter}
                className="ml-auto text-xs font-semibold uppercase tracking-wide text-cyan-200 underline-offset-4 hover:underline"
              >
                Limpar filtro
              </button>
            </div>
          ) : null}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="w-full max-w-md text-sm font-medium text-slate-300">
              Buscar no histórico
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cliente, número, documento ou telefone"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            {printError ? (
              <p className="text-sm text-rose-300">{printError}</p>
            ) : null}
            {loading ? (
              <p className="text-sm text-slate-400">Carregando histórico...</p>
            ) : null}
          </div>

          {budgets.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-white/3 p-3">
              <EmptyState
                title="Nenhum orçamento ainda"
                description="Crie seu primeiro orçamento para ver o histórico aqui."
                action={
                  <Button
                    onClick={() => {
                      void navigate("/builder");
                    }}
                  >
                    Criar Orçamento
                  </Button>
                }
              />
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-white/3 p-3">
              <EmptyState
                title="Nenhum resultado encontrado"
                description="Tente buscar por outro cliente, número ou documento."
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredBudgets.map((budget) => (
                <article
                  key={budget.id}
                  className="rounded-[28px] border border-white/10 bg-white/4 p-5 shadow-[0_20px_50px_rgba(2,6,23,0.25)] transition hover:border-white/15 hover:bg-white/6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Orçamento #{budget.number}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-white">
                        {budget.client.name}
                      </h2>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                      {getBudgetStatusLabel(budget.status)}
                    </span>
                  </div>

                  <dl className="mt-6 grid gap-4 text-sm">
                    <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                      <dt className="text-slate-400">Data de Emissão</dt>
                      <dd className="mt-1 font-medium text-slate-100">
                        {formatDate(budget.createdAt)}
                      </dd>
                    </div>
                    {budget.validUntil ? (
                      <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                        <dt className="text-slate-400">Válido até</dt>
                        <dd className="mt-1 font-medium text-slate-100">
                          {formatDate(budget.validUntil)}
                        </dd>
                      </div>
                    ) : null}
                    <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                      <dt className="text-slate-400">Cliente</dt>
                      <dd className="mt-2 grid gap-1 font-medium text-slate-100">
                        {budget.client.document ? (
                          <span>CPF/CNPJ: {budget.client.document}</span>
                        ) : null}
                        {budget.client.email ? (
                          <span>Email: {budget.client.email}</span>
                        ) : null}
                        {budget.client.address ? (
                          <span>Endereço: {budget.client.address}</span>
                        ) : null}
                        {budget.client.phone ? (
                          <span>WhatsApp: {budget.client.phone}</span>
                        ) : null}
                        {!budget.client.document &&
                        !budget.client.address &&
                        !budget.client.phone ? (
                          <span>Sem dados extras informados</span>
                        ) : null}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                      <dt className="text-slate-400">Itens</dt>
                      <dd className="mt-2 space-y-2 text-slate-100">
                        <span className="block font-medium">
                          {budget.items.length} item(ns) no orçamento
                        </span>
                        {budget.items.slice(0, 3).map((item) => (
                          <span
                            key={item.id}
                            className="block text-xs text-slate-400"
                          >
                            {item.quantidade} {item.unidade} -{" "}
                            {item.descricao || "Item sem descrição"} (
                            {formatCurrency(item.quantidade * item.valorUnitario)}
                            )
                          </span>
                        ))}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                      <dt className="text-slate-400">Total</dt>
                      <dd className="mt-1 text-lg font-semibold text-white">
                        {formatCurrency(budget.totals.total)}
                      </dd>
                    </div>
                    {budget.paymentTerms || budget.terms ? (
                      <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                        <dt className="text-slate-400">Observações</dt>
                        <dd className="mt-2 line-clamp-3 text-slate-100">
                          {budget.paymentTerms || budget.terms}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="mt-6 grid gap-3">
                    <p className="text-xs text-slate-500">
                      Use a janela de impressão para imprimir ou salvar como
                      PDF.
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          void navigate(`/builder?edit=${budget.id}`);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          void navigate(`/builder?duplicate=${budget.id}`);
                        }}
                      >
                        Duplicar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handlePrintBudget(budget.id)}
                      >
                        Imprimir / Salvar PDF
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleShareWhatsApp(budget)}
                      >
                        Compartilhar via WhatsApp
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteBudget(budget.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      {confirmation ? (
        <ConfirmationDialog
          title={
            confirmation.action === "delete"
              ? "Excluir orçamento"
              : "Resetar histórico"
          }
          description={
            confirmation.action === "delete"
              ? `Excluir o orçamento ${confirmation.label} do histórico deste navegador?`
              : "Isso vai apagar todo o histórico de orçamentos salvo neste navegador."
          }
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            void handleConfirmAction();
          }}
        />
      ) : null}
    </>
  );
};
