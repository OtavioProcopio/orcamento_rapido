import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Budget } from "../../types";
import { HomePage } from "../../pages/HomePage";

const clearBudgetsMock = jest.fn();
const deleteBudgetMock = jest.fn();
let budgets: Budget[] = [];
let loading = false;
let error: string | null = null;

jest.mock("../../hooks/useBudget", () => ({
  useBudget: () => ({
    budgets,
    loading,
    error,
    clearBudgets: clearBudgetsMock,
    deleteBudget: deleteBudgetMock,
  }),
}));

jest.mock("../../hooks/useProfiles", () => ({
  useProfiles: () => ({
    profiles: [],
    loading: false,
    error: null,
  }),
}));

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: "b1",
  number: 1,
  status: "draft",
  createdAt: "2026-05-09T00:00:00.000Z",
  client: { name: "Cliente Teste", ...overrides.client },
  items: [],
  modules: { showTerms: true, showSignature: true, ...overrides.modules },
  totals: { subtotal: 0, discount: 0, total: 100, ...overrides.totals },
  ...overrides,
});

describe("HomePage additional flows", () => {
  beforeEach(() => {
    budgets = [];
    loading = false;
    error = null;
    clearBudgetsMock.mockReset();
    deleteBudgetMock.mockReset();
  });

  it("shows no results state for unmatched searches", async () => {
    budgets = [makeBudget({ client: { name: "Maria" } })];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: /Buscar/i }), "zzzz");

    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
  });

  it("keeps dialogs cancelable and surfaces loading and errors", async () => {
    budgets = [makeBudget()];
    loading = true;
    error = "Erro local";
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Carregando histórico...")).toBeInTheDocument();
    expect(screen.getByText("Erro local")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Resetar Orçamentos" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(clearBudgetsMock).not.toHaveBeenCalled();
  });
});
