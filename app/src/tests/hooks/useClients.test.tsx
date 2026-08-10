import { renderHook, act, waitFor } from "@testing-library/react";
import { useClients } from "../../hooks/useClients";
import type { Client } from "../../types";
import { storageAdapter } from "../../storage/storageAdapter";

jest.mock("../../storage/storageAdapter", () => ({
  storageAdapter: {
    getClients: jest.fn(),
    addClient: jest.fn(),
    updateClient: jest.fn(),
    deleteClient: jest.fn(),
  },
}));

describe("useClients", () => {
  const storageAdapterMock = jest.mocked(storageAdapter);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads clients from storage", async () => {
    const clients: Client[] = [
      { id: "1", name: "Cliente", createdAt: new Date().toISOString() },
    ];
    storageAdapterMock.getClients.mockResolvedValue(clients);

    const { result } = renderHook(() => useClients());
    await waitFor(() => expect(result.current.clients).toHaveLength(1));
    expect(result.current.loading).toBe(false);
  });

  it("adds a client", async () => {
    storageAdapterMock.getClients.mockResolvedValue([]);
    const client: Client = {
      id: "2",
      name: "Novo Cliente",
      createdAt: new Date().toISOString(),
    };
    storageAdapterMock.addClient.mockResolvedValue([client]);

    const { result } = renderHook(() => useClients());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addClient(client);
    });

    expect(storageAdapterMock.addClient.mock.calls[0]?.[0]).toEqual(client);
    expect(result.current.clients).toEqual([client]);
  });

  it("updates a client", async () => {
    const client: Client = {
      id: "1",
      name: "Cliente",
      createdAt: new Date().toISOString(),
    };
    storageAdapterMock.getClients.mockResolvedValue([client]);
    storageAdapterMock.updateClient.mockResolvedValue([
      { ...client, name: "Cliente Atualizado" },
    ]);

    const { result } = renderHook(() => useClients());
    await waitFor(() => expect(result.current.clients).toHaveLength(1));

    await act(async () => {
      await result.current.updateClient("1", { name: "Cliente Atualizado" });
    });

    expect(result.current.clients[0].name).toBe("Cliente Atualizado");
  });

  it("deletes a client", async () => {
    const client: Client = {
      id: "1",
      name: "Cliente",
      createdAt: new Date().toISOString(),
    };
    storageAdapterMock.getClients.mockResolvedValue([client]);
    storageAdapterMock.deleteClient.mockResolvedValue([]);

    const { result } = renderHook(() => useClients());
    await waitFor(() => expect(result.current.clients).toHaveLength(1));

    await act(async () => {
      await result.current.deleteClient("1");
    });

    expect(result.current.clients).toEqual([]);
  });

  it("surfaces adapter failures for every flow", async () => {
    storageAdapterMock.getClients
      .mockRejectedValueOnce(new Error("read failed"))
      .mockResolvedValue([]);
    storageAdapterMock.addClient.mockRejectedValueOnce(new Error("fail"));
    storageAdapterMock.updateClient.mockRejectedValueOnce(new Error("fail"));
    storageAdapterMock.deleteClient.mockRejectedValueOnce(new Error("fail"));

    const { result } = renderHook(() => useClients());
    await waitFor(() =>
      expect(result.current.error).toBe("Não foi possível carregar os clientes."),
    );

    await act(async () => {
      await result.current.refreshClients();
    });
    expect(result.current.error).toBeNull();

    const client: Client = {
      id: "x",
      name: "Cliente",
      createdAt: new Date().toISOString(),
    };

    await expect(() => result.current.addClient(client)).rejects.toThrow(
      "client-save-failed",
    );
    await expect(() =>
      result.current.updateClient("x", { name: "Y" }),
    ).rejects.toThrow("client-update-failed");
    await expect(() => result.current.deleteClient("x")).rejects.toThrow(
      "client-delete-failed",
    );
  });

  it("flags a remote update from another tab and clears it on refresh", async () => {
    storageAdapterMock.getClients.mockResolvedValue([]);
    const { result } = renderHook(() => useClients());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.remoteUpdateAvailable).toBe(false);

    const otherTabChannel = new BroadcastChannel("orca-rapido-sync");
    otherTabChannel.postMessage({ store: "clients" });

    await waitFor(() => expect(result.current.remoteUpdateAvailable).toBe(true));

    await act(async () => {
      await result.current.refreshClients();
    });
    expect(result.current.remoteUpdateAvailable).toBe(false);

    otherTabChannel.close();
  });
});
