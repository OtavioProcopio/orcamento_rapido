import { useCallback, useEffect, useState } from "react";
import type { MeiProfile } from "../types";
import { storageAdapter } from "../storage/storageAdapter";
import { subscribeToStoreChanges } from "../utils/tabSync";

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<MeiProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteUpdateAvailable, setRemoteUpdateAvailable] = useState(false);

  const refreshProfiles = useCallback(async () => {
    try {
      const storedProfiles = await storageAdapter.getProfiles();
      setProfiles(storedProfiles);
      setError(null);
      setRemoteUpdateAvailable(false);
    } catch {
      setError("Não foi possível carregar as empresas cadastradas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshProfiles();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshProfiles]);

  // Outra aba salvou empresas (ver storageAdapter.ts + utils/tabSync.ts) —
  // só avisa; não recarrega sozinho pra não descartar um formulário aberto.
  useEffect(
    () => subscribeToStoreChanges("profiles", () => setRemoteUpdateAvailable(true)),
    [],
  );

  const addProfile = useCallback(async (profile: MeiProfile) => {
    try {
      const updated = await storageAdapter.addProfile(profile);
      setProfiles(updated);
      setError(null);
      return updated;
    } catch {
      setError("Não foi possível salvar a empresa.");
      throw new Error("profile-save-failed");
    }
  }, []);

  const updateProfile = useCallback(
    async (id: string, patch: Partial<MeiProfile>) => {
      try {
        const updated = await storageAdapter.updateProfile(id, patch);
        setProfiles(updated);
        setError(null);
        return updated;
      } catch {
        setError("Não foi possível atualizar a empresa.");
        throw new Error("profile-update-failed");
      }
    },
    [],
  );

  const deleteProfile = useCallback(async (id: string) => {
    try {
      const updated = await storageAdapter.deleteProfile(id);
      setProfiles(updated);
      setError(null);
      return updated;
    } catch {
      setError("Não foi possível excluir a empresa.");
      throw new Error("profile-delete-failed");
    }
  }, []);

  return {
    profiles,
    loading,
    error,
    remoteUpdateAvailable,
    addProfile,
    refreshProfiles,
    updateProfile,
    deleteProfile,
  };
};
