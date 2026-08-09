import { useCallback, useEffect, useState } from "react";
import type { MeiProfile } from "../types";
import { storageAdapter } from "../storage/storageAdapter";

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<MeiProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfiles = useCallback(async () => {
    try {
      const storedProfiles = await storageAdapter.getProfiles();
      setProfiles(storedProfiles);
      setError(null);
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
    addProfile,
    refreshProfiles,
    updateProfile,
    deleteProfile,
  };
};
