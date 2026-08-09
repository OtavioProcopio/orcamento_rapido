import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Budget } from "../../types";
import { HomePage } from "../../pages/HomePage";
import { printBudget } from "../../utils/printBudget";

const navigateMock = jest.fn();
const clearBudgetsMock = jest.fn();
const deleteBudgetMock = jest.fn();
let budgets: Budget[] = [];

jest.mock("react-router-dom", () => {
  const actual: typeof import("react-router-dom") =
    jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

jest.mock("../../hooks/useBudget", () => ({
  useBudget: () => ({
    budgets,
    loading: false,
    error: null,
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

jest.mock("../../utils/printBudget", () => ({
  printBudget: jest.fn(() => true),
}));

const printBudgetMock = jest.mocked(printBudget);

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: "b1",
  number: 1,
  status: "draft",
  createdAt: "2026-05-01T12:00:00.000Z",
  client: { name: "Cliente Teste", ...overrides.client },
  items: [],
  modules: {
    showTerms: true,
    showSignature: true,
    ...overrides.modules,
  },
  totals: { subtotal: 0, discount: 0, total: 100, ...overrides.totals },
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe("HomePage navigation and print validity", () => {
  beforeEach(() => {
    budgets = [];
    navigateMock.mockReset();
    clearBudgetsMock.mockReset();
    deleteBudgetMock.mockReset();
    printBudgetMock.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("navigates to /data, /profile and /builder from the header actions", async () => {
    budgets = [makeBudget()];
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Exportar/Importar Dados" }),
    );
    expect(navigateMock).toHaveBeenCalledWith("/data");

    await user.click(screen.getByRole("button", { name: "Empresas" }));
    expect(navigateMock).toHaveBeenCalledWith("/profile");

    await user.click(screen.getByRole("button", { name: "Novo Orçamento" }));
    expect(navigateMock).toHaveBeenCalledWith("/builder");
  });

  it("navigates to edit and duplicate routes from a budget card", async () => {
    budgets = [makeBudget({ id: "card-1" })];
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(navigateMock).toHaveBeenCalledWith("/builder?edit=card-1");

    await user.click(screen.getByRole("button", { name: "Duplicar" }));
    expect(navigateMock).toHaveBeenCalledWith("/builder?duplicate=card-1");
  });

  it("navigates to /builder from the empty state call-to-action", async () => {
    budgets = [];
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Criar Orçamento" }));
    expect(navigateMock).toHaveBeenCalledWith("/builder");
  });

  it("opens the print window with the selected budget's data", async () => {
    const budget = makeBudget({
      id: "with-validity",
      createdAt: "2026-05-01T12:00:00.000Z",
      validUntil: "2026-05-08T12:00:00.000Z",
    });
    budgets = [budget];
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Imprimir / Salvar PDF" }),
    );

    expect(printBudgetMock).toHaveBeenCalledWith(
      budget,
      expect.objectContaining({ companyName: "" }),
    );
  });
});
