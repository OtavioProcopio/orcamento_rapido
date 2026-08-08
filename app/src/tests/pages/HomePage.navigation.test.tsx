import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Budget } from "../../types";
import { HomePage } from "../../pages/HomePage";

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

jest.mock("../../hooks/useProfile", () => ({
  useProfile: () => ({
    profile: null,
    loading: false,
    error: null,
  }),
}));

const triggerPrintMock = jest.fn();

jest.mock("react-to-print", () => ({
  useReactToPrint: () => triggerPrintMock,
}));

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
    removeAds: false,
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
    triggerPrintMock.mockClear();
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

    await user.click(
      screen.getByRole("button", { name: "Configurações / Perfil" }),
    );
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

  it("computes and shows the validity window when printing a budget with validUntil", async () => {
    budgets = [
      makeBudget({
        id: "with-validity",
        createdAt: "2026-05-01T12:00:00.000Z",
        validUntil: "2026-05-08T12:00:00.000Z",
      }),
    ];
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Imprimir / Salvar PDF" }),
    );

    expect(screen.getByText(/Validade:/).closest("p")).toHaveTextContent(
      "7 dias",
    );
    await waitFor(() => expect(triggerPrintMock).toHaveBeenCalled());
  });

  it("omits the validity window when validUntil is not after createdAt", async () => {
    budgets = [
      makeBudget({
        id: "expired-window",
        createdAt: "2026-05-01T12:00:00.000Z",
        validUntil: "2026-05-01T12:00:00.000Z",
      }),
    ];
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Imprimir / Salvar PDF" }),
    );

    expect(screen.queryByText(/Validade:/)).not.toBeInTheDocument();
  });
});
