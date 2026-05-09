import { useCallback, useEffect, useRef, useState } from "react";
import type { MeiProfile } from "../types";
import { storageAdapter } from "../storage/storageAdapter";

export const useProfile = () => {
  const [profile, setProfile] = useState<MeiProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    storageAdapter
      .getProfile()
      .then((storedProfile) => {
        if (!active) {
          return;
        }
        setProfile(storedProfile);
        setError(null);
      })
      .catch(() => {
        if (active) {
          setError("Não foi possível carregar o perfil salvo.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const saveProfile = useCallback(async (nextProfile: MeiProfile) => {
    try {
      await storageAdapter.saveProfile(nextProfile);
      setProfile(nextProfile);
      setSaved(true);
      setError(null);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Não foi possível salvar o perfil.");
      throw new Error("profile-save-failed");
    }
  }, []);

  return {
    profile,
    saveProfile,
    saved,
    loading,
    error,
  };
};
