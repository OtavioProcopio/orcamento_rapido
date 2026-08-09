import { renderHook, act, waitFor } from "@testing-library/react";
import { useProfiles } from "../../hooks/useProfiles";
import type { MeiProfile } from "../../types";
import { storageAdapter } from "../../storage/storageAdapter";

jest.mock("../../storage/storageAdapter", () => ({
  storageAdapter: {
    getProfiles: jest.fn(),
    addProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
  },
}));

describe("useProfiles", () => {
  const storageAdapterMock = jest.mocked(storageAdapter);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads profiles from storage", async () => {
    const profiles: MeiProfile[] = [
      {
        id: "1",
        companyName: "Empresa",
        userName: "Responsavel",
        phone: "11999999999",
        pixKey: "pix",
        createdAt: new Date().toISOString(),
      },
    ];
    storageAdapterMock.getProfiles.mockResolvedValue(profiles);

    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.profiles).toHaveLength(1));
    expect(result.current.loading).toBe(false);
  });

  it("adds a profile", async () => {
    storageAdapterMock.getProfiles.mockResolvedValue([]);
    const profile: MeiProfile = {
      id: "2",
      companyName: "Nova Empresa",
      userName: "Responsavel",
      phone: "11999999999",
      pixKey: "pix",
      createdAt: new Date().toISOString(),
    };
    storageAdapterMock.addProfile.mockResolvedValue([profile]);

    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addProfile(profile);
    });

    expect(storageAdapterMock.addProfile.mock.calls[0]?.[0]).toEqual(profile);
    expect(result.current.profiles).toEqual([profile]);
  });

  it("updates a profile", async () => {
    const profile: MeiProfile = {
      id: "1",
      companyName: "Empresa",
      userName: "Responsavel",
      phone: "11999999999",
      pixKey: "pix",
      createdAt: new Date().toISOString(),
    };
    storageAdapterMock.getProfiles.mockResolvedValue([profile]);
    storageAdapterMock.updateProfile.mockResolvedValue([
      { ...profile, companyName: "Empresa Atualizada" },
    ]);

    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.profiles).toHaveLength(1));

    await act(async () => {
      await result.current.updateProfile("1", {
        companyName: "Empresa Atualizada",
      });
    });

    expect(result.current.profiles[0].companyName).toBe("Empresa Atualizada");
  });

  it("deletes a profile", async () => {
    const profile: MeiProfile = {
      id: "1",
      companyName: "Empresa",
      userName: "Responsavel",
      phone: "11999999999",
      pixKey: "pix",
      createdAt: new Date().toISOString(),
    };
    storageAdapterMock.getProfiles.mockResolvedValue([profile]);
    storageAdapterMock.deleteProfile.mockResolvedValue([]);

    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.profiles).toHaveLength(1));

    await act(async () => {
      await result.current.deleteProfile("1");
    });

    expect(result.current.profiles).toEqual([]);
  });

  it("surfaces adapter failures for every flow", async () => {
    storageAdapterMock.getProfiles
      .mockRejectedValueOnce(new Error("read failed"))
      .mockResolvedValue([]);
    storageAdapterMock.addProfile.mockRejectedValueOnce(new Error("fail"));
    storageAdapterMock.updateProfile.mockRejectedValueOnce(new Error("fail"));
    storageAdapterMock.deleteProfile.mockRejectedValueOnce(new Error("fail"));

    const { result } = renderHook(() => useProfiles());
    await waitFor(() =>
      expect(result.current.error).toBe(
        "Não foi possível carregar as empresas cadastradas.",
      ),
    );

    await act(async () => {
      await result.current.refreshProfiles();
    });
    expect(result.current.error).toBeNull();

    const profile: MeiProfile = {
      id: "x",
      companyName: "Empresa",
      userName: "Responsavel",
      phone: "11999999999",
      pixKey: "pix",
      createdAt: new Date().toISOString(),
    };

    await expect(() => result.current.addProfile(profile)).rejects.toThrow(
      "profile-save-failed",
    );
    await expect(() =>
      result.current.updateProfile("x", { companyName: "Y" }),
    ).rejects.toThrow("profile-update-failed");
    await expect(() => result.current.deleteProfile("x")).rejects.toThrow(
      "profile-delete-failed",
    );
  });
});
