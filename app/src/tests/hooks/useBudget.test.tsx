import { renderHook, act, waitFor } from "@testing-library/react";
import { useBudget } from "../../hooks/useBudget";
import type { Budget } from "../../types";
import { storageAdapter } from "../../storage/storageAdapter";

const BUDGETS_KEY = "@OrcaRapido:budgets";

jest.mock("../../storage/storageAdapter", () => ({
  storageAdapter: {
    getBudgets: jest.fn(),
    addBudget: jest.fn(),
    updateBudget: jest.fn(),
    clearBudgets: jest.fn(),
    deleteBudget: jest.fn(),
    saveBudgets: jest.fn(),
  },
}));

describe("useBudget", () => {
  const storageAdapterMock = jest.mocked(storageAdapter);
  const baseBudget = {
    status: "draft" as const,
    items: [],
    discount: 0,
    modules: { showTerms: true, showSignature: true, removeAds: false },
    totals: { subtotal: 0, discount: 0, total: 0 },
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("loads budgets from storage", async () => {
    const budgets: Budget[] = [
      {
        id: "1",
        number: 1,
        createdAt: new Date().toISOString(),
        client: { name: "Cliente" },
        ...baseBudget,
      },
    ];
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
    storageAdapterMock.getBudgets.mockResolvedValue(budgets);

    const { result } = renderHook(() => useBudget());
    await waitFor(() => expect(result.current.budgets).toHaveLength(1));
  });

  it("adds budget to top", async () => {
    storageAdapterMock.getBudgets.mockResolvedValue([]);
    storageAdapterMock.addBudget.mockResolvedValue([]);
    const { result } = renderHook(() => useBudget());
    const budget: Budget = {
      id: "2",
        number: 2,
      createdAt: new Date().toISOString(),
      client: { name: "Cliente" },
      ...baseBudget,
    };

    await act(async () => {
      await result.current.addBudget(budget);
    });

    expect(storageAdapterMock.addBudget.mock.calls[0]?.[0]).toEqual(budget);
  });

  it("deletes a budget from state and storage", async () => {
    const budgets: Budget[] = [
      {
        id: "1",
        number: 1,
        createdAt: new Date().toISOString(),
        client: { name: "Cliente 1" },
        ...baseBudget,
      },
      {
        id: "2",
        number: 2,
        createdAt: new Date().toISOString(),
        client: { name: "Cliente 2" },
        ...baseBudget,
      },
    ];
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
    storageAdapterMock.getBudgets.mockResolvedValue(budgets);
    storageAdapterMock.deleteBudget.mockResolvedValue([budgets[1]]);

    const { result } = renderHook(() => useBudget());
    await waitFor(() => expect(result.current.budgets).toHaveLength(2));

    await act(async () => {
      await result.current.deleteBudget("1");
    });

    expect(result.current.budgets).toHaveLength(1);
    expect(result.current.budgets[0].id).toBe("2");
  });

  it("refreshes budgets and clears prior errors", async () => {
    storageAdapterMock.getBudgets
      .mockRejectedValueOnce(new Error("read failed"))
      .mockResolvedValueOnce([]);

    const { result } = renderHook(() => useBudget());
    await waitFor(() =>
      expect(result.current.error).toBe("Não foi possível carregar os orçamentos."),
    );

    await act(async () => {
      await result.current.refreshBudgets();
    });

    expect(result.current.error).toBeNull();
  });

  it("updates a budget and synchronizes state", async () => {
    const budget: Budget = {
      id: "1",
      number: 1,
      createdAt: new Date().toISOString(),
      client: { name: "Cliente" },
      ...baseBudget,
    };
    storageAdapterMock.getBudgets.mockResolvedValue([budget]);
    storageAdapterMock.updateBudget.mockResolvedValue([
      { ...budget, status: "approved" },
    ]);

    const { result } = renderHook(() => useBudget());
    await waitFor(() => expect(result.current.budgets).toHaveLength(1));

    await act(async () => {
      await result.current.updateBudget("1", { status: "approved" });
    });

    expect(result.current.budgets[0].status).toBe("approved");
  });

  it("clears budgets and replace budgets", async () => {
    storageAdapterMock.getBudgets.mockResolvedValue([]);
    storageAdapterMock.clearBudgets.mockResolvedValue();
    storageAdapterMock.saveBudgets.mockResolvedValue();
    const replacement: Budget[] = [
      {
        id: "r1",
        number: 3,
        createdAt: new Date().toISOString(),
        client: { name: "Importado" },
        ...baseBudget,
      },
    ];

    const { result } = renderHook(() => useBudget());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.clearBudgets();
    });
    expect(result.current.budgets).toEqual([]);

    await act(async () => {
      await result.current.replaceBudgets(replacement);
    });
    expect(result.current.budgets).toEqual(replacement);
  });

  it("surfaces adapter failures for mutation flows", async () => {
    storageAdapterMock.getBudgets.mockResolvedValue([]);
    storageAdapterMock.addBudget.mockRejectedValueOnce(new Error("save failed"));
    storageAdapterMock.updateBudget.mockRejectedValueOnce(new Error("update failed"));
    storageAdapterMock.clearBudgets.mockRejectedValueOnce(new Error("clear failed"));
    storageAdapterMock.deleteBudget.mockRejectedValueOnce(new Error("delete failed"));
    storageAdapterMock.saveBudgets.mockRejectedValueOnce(new Error("replace failed"));

    const budget: Budget = {
      id: "x",
      number: 9,
      createdAt: new Date().toISOString(),
      client: { name: "Cliente" },
      ...baseBudget,
    };

    const { result } = renderHook(() => useBudget());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(() => result.current.addBudget(budget)).rejects.toThrow(
      "budget-save-failed",
    );
    await expect(() => result.current.updateBudget("x", { status: "sent" })).rejects.toThrow(
      "budget-update-failed",
    );
    await expect(() => result.current.clearBudgets()).rejects.toThrow("budget-clear-failed");
    await expect(() => result.current.deleteBudget("x")).rejects.toThrow("budget-delete-failed");
    await expect(() => result.current.replaceBudgets([budget])).rejects.toThrow(
      "budget-import-failed",
    );
  });
});
