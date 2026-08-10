import { useCallback, useEffect, useState } from "react";
import type { Budget } from "../types";
import { storageAdapter } from "../storage/storageAdapter";
import { subscribeToStoreChanges } from "../utils/tabSync";

export const useBudget = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteUpdateAvailable, setRemoteUpdateAvailable] = useState(false);

  const refreshBudgets = useCallback(async () => {
    try {
      const storedBudgets = await storageAdapter.getBudgets();
      setBudgets(storedBudgets);
      setError(null);
      setRemoteUpdateAvailable(false);
    } catch {
      setError("Não foi possível carregar os orçamentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshBudgets();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshBudgets]);

  // Outra aba salvou orçamentos (ver storageAdapter.ts + utils/tabSync.ts) —
  // esta aba pode estar com uma cópia desatualizada em memória. Só avisa;
  // não recarrega sozinho pra não descartar um rascunho em andamento.
  useEffect(
    () => subscribeToStoreChanges("budgets", () => setRemoteUpdateAvailable(true)),
    [],
  );

  const addBudget = useCallback(async (budget: Budget) => {
    try {
      const updated = await storageAdapter.addBudget(budget);
      setBudgets(updated);
      setError(null);
      return updated;
    } catch {
      setError("Não foi possível salvar o orçamento.");
      throw new Error("budget-save-failed");
    }
  }, []);

  const updateBudget = useCallback(async (id: string, patch: Partial<Budget>) => {
    try {
      const updated = await storageAdapter.updateBudget(id, patch);
      setBudgets(updated);
      setError(null);
      return updated;
    } catch {
      setError("Não foi possível atualizar o orçamento.");
      throw new Error("budget-update-failed");
    }
  }, []);

  const clearBudgets = useCallback(async () => {
    try {
      await storageAdapter.clearBudgets();
      setBudgets([]);
      setError(null);
    } catch {
      setError("Não foi possível limpar o histórico.");
      throw new Error("budget-clear-failed");
    }
  }, []);

  const replaceBudgets = useCallback(async (nextBudgets: Budget[]) => {
    try {
      await storageAdapter.saveBudgets(nextBudgets);
      setBudgets(nextBudgets);
      setError(null);
    } catch {
      setError("Não foi possível importar os orçamentos.");
      throw new Error("budget-import-failed");
    }
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    try {
      const updated = await storageAdapter.deleteBudget(id);
      setBudgets(updated);
      setError(null);
      return updated;
    } catch {
      setError("Não foi possível excluir o orçamento.");
      throw new Error("budget-delete-failed");
    }
  }, []);

  return {
    budgets,
    loading,
    error,
    remoteUpdateAvailable,
    addBudget,
    refreshBudgets,
    updateBudget,
    clearBudgets,
    deleteBudget,
    replaceBudgets,
  };
};
