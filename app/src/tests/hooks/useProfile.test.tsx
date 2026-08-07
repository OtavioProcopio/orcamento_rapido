import { renderHook, act, waitFor } from "@testing-library/react";
import { useProfile } from "../../hooks/useProfile";
import type { MeiProfile } from "../../types";
import { storageAdapter } from "../../storage/storageAdapter";

const PROFILE_KEY = "@OrcaRapido:mei_profile";

jest.mock("../../storage/storageAdapter", () => ({
  storageAdapter: {
    getProfile: jest.fn(),
    saveProfile: jest.fn(),
  },
}));

describe("useProfile", () => {
  const storageAdapterMock = jest.mocked(storageAdapter);

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("loads profile from storage", async () => {
    const profile: MeiProfile = {
      companyName: "Empresa",
      userName: "Nome",
      phone: "11999999999",
      pixKey: "pix",
      logo: undefined,
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    storageAdapterMock.getProfile.mockResolvedValue(profile);

    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.profile).toEqual(profile));
  });

  it("saves profile and toggles saved flag", async () => {
    storageAdapterMock.getProfile.mockResolvedValue(null);
    storageAdapterMock.saveProfile.mockResolvedValue();
    const { result } = renderHook(() => useProfile());
    const profile: MeiProfile = {
      companyName: "Empresa",
      userName: "Nome",
      phone: "11999999999",
      pixKey: "pix",
      logo: undefined,
    };

    await act(async () => {
      await result.current.saveProfile(profile);
    });

    expect(result.current.profile).toEqual(profile);
    expect(result.current.saved).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.saved).toBe(false);
  });

  it("exposes load errors", async () => {
    storageAdapterMock.getProfile.mockRejectedValueOnce(new Error("load failed"));

    const { result } = renderHook(() => useProfile());

    await waitFor(() =>
      expect(result.current.error).toBe("Não foi possível carregar o perfil salvo."),
    );
    expect(result.current.loading).toBe(false);
  });

  it("surfaces save failures", async () => {
    storageAdapterMock.getProfile.mockResolvedValue(null);
    storageAdapterMock.saveProfile.mockRejectedValueOnce(new Error("save failed"));
    const { result } = renderHook(() => useProfile());
    const profile: MeiProfile = {
      companyName: "Empresa",
      userName: "Nome",
      phone: "11999999999",
      pixKey: "pix",
      logo: undefined,
    };

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.saveProfile(profile)).rejects.toThrow(
      "profile-save-failed",
    );
    await waitFor(() =>
      expect(result.current.error).toBe("Não foi possível salvar o perfil."),
    );
  });

  it("ignores a profile load that resolves after unmount", async () => {
    let resolveGetProfile: (value: MeiProfile | null) => void = () => {};
    storageAdapterMock.getProfile.mockReturnValue(
      new Promise((resolve) => {
        resolveGetProfile = resolve;
      }),
    );

    const { unmount } = renderHook(() => useProfile());
    unmount();

    // Resolver após o unmount não deve lançar nem tentar atualizar estado
    // de um componente desmontado (guarda `if (!active) return`).
    await act(async () => {
      resolveGetProfile({
        companyName: "Tardio",
        userName: "Nome",
        phone: "11999999999",
        pixKey: "pix",
      });
      await Promise.resolve();
    });
  });

  it("clears a pending 'saved' timeout when saving again quickly", async () => {
    storageAdapterMock.getProfile.mockResolvedValue(null);
    storageAdapterMock.saveProfile.mockResolvedValue();
    const { result } = renderHook(() => useProfile());
    const profile: MeiProfile = {
      companyName: "Empresa",
      userName: "Nome",
      phone: "11999999999",
      pixKey: "pix",
      logo: undefined,
    };

    await act(async () => {
      await result.current.saveProfile(profile);
    });
    expect(result.current.saved).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await act(async () => {
      await result.current.saveProfile(profile);
    });
    expect(result.current.saved).toBe(true);

    // O timer da primeira chamada foi cancelado: 2s após a SEGUNDA chamada
    // (não 1.5s, que seria 2s após a primeira) o flag ainda deve estar ativo.
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(result.current.saved).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current.saved).toBe(false);
  });

  it("clears the pending 'saved' timeout on unmount", async () => {
    storageAdapterMock.getProfile.mockResolvedValue(null);
    storageAdapterMock.saveProfile.mockResolvedValue();
    const { result, unmount } = renderHook(() => useProfile());
    const profile: MeiProfile = {
      companyName: "Empresa",
      userName: "Nome",
      phone: "11999999999",
      pixKey: "pix",
      logo: undefined,
    };

    await act(async () => {
      await result.current.saveProfile(profile);
    });

    expect(() => unmount()).not.toThrow();
  });
});
