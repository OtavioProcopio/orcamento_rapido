import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { BudgetPreview } from "../components/BudgetPreview";
import { Button } from "../components/Button";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { EmptyState } from "../components/EmptyState";
import { useBudget } from "../hooks/useBudget";
import { useProfile } from "../hooks/useProfile";
import { createBrowserPrintSession } from "../utils/browserPrintService";
import { formatCurrency, formatDate } from "../utils/format";
import type { Budget } from "../types";

const calculateValidityDays = (budget: Budget) => {
  if (!budget.validUntil) {
    return undefined;
  }

  const created = new Date(budget.createdAt).getTime();
  const validUntil = new Date(budget.validUntil).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.round((validUntil - created) / dayMs);

  return days > 0 ? days : undefined;
};

const getStatusLabel = (status: Budget["status"]) =>
  ({
    draft: "Rascunho",
    sent: "Enviado",
    approved: "Aprovado",
    rejected: "Recusado",
    paid: "Pago",
  })[status];

export const HomePage = () => {
  const navigate = useNavigate();
  const {
    budgets,
    loading,
    error,
    clearBudgets,
    deleteBudget,
  } = useBudget();
  const { profile } = useProfile();
  const [printBudgetId, setPrintBudgetId] = useState<string | null>(null);
  const [printError, setPrintError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [confirmation, setConfirmation] = useState<
    | { action: "delete"; budgetId: string; label: string }
    | { action: "reset"; label: string }
    | null
  >(null);

  const profileData = profile ?? {
    companyName: "",
    userName: "",
    phone: "",
    pixKey: "",
    logo: undefined,
  };

  const printBudget = useMemo(
    () => budgets.find((item) => item.id === printBudgetId) ?? null,
    [budgets, printBudgetId],
  );

  const filteredBudgets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return budgets;
    }

    return budgets.filter((budget) =>
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
  }, [budgets, search]);

  useEffect(() => {
    if (!printBudget) {
      return undefined;
    }

    return createBrowserPrintSession({
      onAfterPrint: () => setPrintBudgetId(null),
      onError: () => {
        setPrintBudgetId(null);
        setPrintError("Não foi possível abrir a impressão deste orçamento.");
      },
    });
  }, [printBudget]);

  const handlePrintBudget = (budgetId: string) => {
    setPrintError(null);
    setPrintBudgetId(budgetId);
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

  const printDocument = printBudget ? (
    <div className="print-document-area" aria-hidden="true">
      <BudgetPreview
        profile={profileData}
        proposalNumber={printBudget.number}
        createdAt={printBudget.createdAt}
        validityDays={calculateValidityDays(printBudget)}
        client={printBudget.client}
        items={printBudget.items}
        subtotal={printBudget.totals.subtotal}
        discount={printBudget.totals.discount}
        total={printBudget.totals.total}
        showLogo={Boolean(profileData.logo)}
        showSignature={printBudget.modules.showSignature}
        showBanner={!printBudget.modules.removeAds}
        paymentTerms={printBudget.paymentTerms}
        terms={printBudget.modules.showTerms ? printBudget.terms : undefined}
      />
    </div>
  ) : null;

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
            <Button variant="ghost" onClick={handleResetBudgets}>
              Resetar Orçamentos
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void navigate("/profile");
              }}
            >
              Configurações / Perfil
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
                      {getStatusLabel(budget.status)}
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
      {printDocument ? createPortal(printDocument, document.body) : null}
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
