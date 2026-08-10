import { useCallback, useEffect, useState } from "react";
import type { Client } from "../types";
import { storageAdapter } from "../storage/storageAdapter";
import { subscribeToStoreChanges } from "../utils/tabSync";

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteUpdateAvailable, setRemoteUpdateAvailable] = useState(false);

  const refreshClients = useCallback(async () => {
    try {
      const storedClients = await storageAdapter.getClients();
      setClients(storedClients);
      setError(null);
      setRemoteUpdateAvailable(false);
    } catch {
      setError("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshClients();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshClients]);

  // Outra aba salvou clientes (ver storageAdapter.ts + utils/tabSync.ts) —
  // só avisa; não recarrega sozinho pra não descartar um formulário aberto.
  useEffect(
    () => subscribeToStoreChanges("clients", () => setRemoteUpdateAvailable(true)),
    [],
  );

  const addClient = useCallback(async (client: Client) => {
    try {
      const updated = await storageAdapter.addClient(client);
      setClients(updated);
      setError(null);
      return updated;
    } catch {
      setError("Não foi possível salvar o cliente.");
      throw new Error("client-save-failed");
    }
  }, []);

  const updateClient = useCallback(async (id: string, patch: Partial<Client>) => {
    try {
      const updated = await storageAdapter.updateClient(id, patch);
      setClients(updated);
      setError(null);
      return updated;
    } catch {
      setError("Não foi possível atualizar o cliente.");
      throw new Error("client-update-failed");
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    try {
      const updated = await storageAdapter.deleteClient(id);
      setClients(updated);
      setError(null);
      return updated;
    } catch {
      setError("Não foi possível excluir o cliente.");
      throw new Error("client-delete-failed");
    }
  }, []);

  return {
    clients,
    loading,
    error,
    remoteUpdateAvailable,
    addClient,
    refreshClients,
    updateClient,
    deleteClient,
  };
};
