import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { useBudget } from "../hooks/useBudget";
import { useClients } from "../hooks/useClients";
import { useProfiles } from "../hooks/useProfiles";
import { formatCurrency } from "../utils/format";
import { BUDGET_STATUSES, getBudgetStatusLabel } from "../utils/budgetStatus";
import { trackEvent } from "../utils/analytics";
import type { Budget } from "../types";

const columnAccent: Record<Budget["status"], string> = {
  draft: "border-slate-400/20 bg-slate-400/10 text-slate-200",
  sent: "border-blue-400/20 bg-blue-400/10 text-blue-200",
  approved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  rejected: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  paid: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
};

export const PipelinePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { budgets, loading, error, updateBudget } = useBudget();
  const { clients } = useClients();
  const { profiles } = useProfiles();
  const [draggedBudgetId, setDraggedBudgetId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Budget["status"] | null>(
    null,
  );
  const [moveError, setMoveError] = useState<string | null>(null);

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

  const filteredBudgets = useMemo(() => {
    const byClient = clientFilterId
      ? budgets.filter((budget) => budget.client.clientId === clientFilterId)
      : budgets;
    return profileFilterId
      ? byClient.filter((budget) => budget.profileId === profileFilterId)
      : byClient;
  }, [budgets, clientFilterId, profileFilterId]);

  const budgetsByStatus = useMemo(() => {
    const grouped = new Map<Budget["status"], Budget[]>();
    BUDGET_STATUSES.forEach((status) => grouped.set(status, []));
    filteredBudgets.forEach((budget) => {
      grouped.get(budget.status)?.push(budget);
    });
    return grouped;
  }, [filteredBudgets]);

  const showMultiProfileHint = profiles.length > 1;
  const resolveProfileName = (budget: Budget) =>
    profiles.find((profile) => profile.id === budget.profileId)?.companyName;

  const moveBudgetToStatus = async (
    budgetId: string,
    status: Budget["status"],
  ) => {
    const budget = budgets.find((item) => item.id === budgetId);
    if (!budget || budget.status === status) {
      return;
    }

    try {
      await updateBudget(budgetId, { status });
      setMoveError(null);
      trackEvent("pipeline-status-change");
    } catch {
      setMoveError("Não foi possível mover o orçamento. Tente novamente.");
    }
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
    budgetId: string,
  ) => {
    event.dataTransfer.setData("text/plain", budgetId);
    event.dataTransfer.effectAllowed = "move";
    setDraggedBudgetId(budgetId);
  };

  const handleDragEnd = () => {
    setDraggedBudgetId(null);
    setDragOverStatus(null);
  };

  const handleColumnDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    status: Budget["status"],
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleColumnDrop = (
    event: React.DragEvent<HTMLDivElement>,
    status: Budget["status"],
  ) => {
    event.preventDefault();
    const budgetId = event.dataTransfer.getData("text/plain") || draggedBudgetId;
    setDragOverStatus(null);
    setDraggedBudgetId(null);
    if (budgetId) {
      void moveBudgetToStatus(budgetId, status);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => {
          void navigate("/dashboard");
        }}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/8"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <PageHeader
        title="Pipeline de Vendas"
        subtitle="Arraste um orçamento entre as colunas para atualizar o status, ou use o seletor no card."
      />

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {moveError ? <p className="mt-4 text-sm text-rose-300">{moveError}</p> : null}
      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Carregando orçamentos...</p>
      ) : null}

      {clientFilterId ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-100">
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
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          <span>
            Filtrando orçamentos da empresa{" "}
            <strong>{profileFilter?.companyName ?? "empresa removida"}</strong>.
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

      {budgets.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-white/10 bg-white/3 p-3">
          <EmptyState
            title="Nenhum orçamento ainda"
            description="Crie um orçamento para acompanhá-lo aqui no pipeline."
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {BUDGET_STATUSES.map((status) => {
            const columnBudgets = budgetsByStatus.get(status) ?? [];
            return (
              <div
                key={status}
                data-status={status}
                data-testid={`column-${status}`}
                onDragOver={(event) => handleColumnDragOver(event, status)}
                onDragLeave={() =>
                  setDragOverStatus((current) =>
                    current === status ? null : current,
                  )
                }
                onDrop={(event) => handleColumnDrop(event, status)}
                className={`flex min-h-40 flex-col gap-3 rounded-[24px] border p-3 transition ${
                  dragOverStatus === status
                    ? "border-white/40 bg-white/8"
                    : "border-white/10 bg-white/3"
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${columnAccent[status]}`}
                  >
                    {getBudgetStatusLabel(status)}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {columnBudgets.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {columnBudgets.length === 0 ? (
                    <p className="px-1 text-xs text-slate-500">
                      Nenhum orçamento aqui.
                    </p>
                  ) : (
                    columnBudgets.map((budget) => (
                      <article
                        key={budget.id}
                        draggable
                        onDragStart={(event) => handleDragStart(event, budget.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          void navigate(`/builder?edit=${budget.id}`);
                        }}
                        className={`cursor-grab rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm shadow-[0_10px_30px_rgba(2,6,23,0.25)] transition hover:border-white/20 active:cursor-grabbing ${
                          draggedBudgetId === budget.id ? "opacity-40" : ""
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Orçamento #{budget.number}
                        </p>
                        <p className="mt-1 font-semibold text-white">
                          {budget.client.name || "Sem nome"}
                        </p>
                        {showMultiProfileHint ? (
                          <p className="mt-1 text-xs text-slate-400">
                            {resolveProfileName(budget) ?? "Empresa removida"}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm font-bold text-emerald-300">
                          {formatCurrency(budget.totals.total)}
                        </p>

                        <label
                          className="mt-3 block text-xs text-slate-400"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Mover para
                          <select
                            value={budget.status}
                            onChange={(event) => {
                              void moveBudgetToStatus(
                                budget.id,
                                event.target.value as Budget["status"],
                              );
                            }}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                          >
                            {BUDGET_STATUSES.map((option) => (
                              <option key={option} value={option}>
                                {getBudgetStatusLabel(option)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
