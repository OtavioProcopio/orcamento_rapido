import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Budget, Client, MeiProfile } from "../../types";
import { HomePage } from "../../pages/HomePage";
import { printBudget } from "../../utils/printBudget";

const clearBudgetsMock = jest.fn();
const deleteBudgetMock = jest.fn();
let budgets: Budget[] = [];
let clients: Client[] = [];
let profiles: MeiProfile[] = [];

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
    profiles,
    loading: false,
    error: null,
  }),
}));

jest.mock("../../hooks/useClients", () => ({
  useClients: () => ({
    clients,
    loading: false,
    error: null,
  }),
}));

jest.mock("../../utils/printBudget", () => ({
  printBudget: jest.fn(),
}));

const printBudgetMock = jest.mocked(printBudget);

const makeBudget = (overrides: Partial<Budget> = {}): Budget => {
  const baseTotals = { subtotal: 0, discount: 0, total: 100 };
  const baseModules = {
    showTerms: true,
    showSignature: true,
  };
  const baseBudget: Budget = {
    id: "b1",
    number: 1,
    status: "draft",
    createdAt: new Date().toISOString(),
    client: { name: "Cliente Teste" },
    items: [],
    modules: { ...baseModules, ...overrides.modules },
    totals: { ...baseTotals, ...overrides.totals },
  };

  return {
    ...baseBudget,
    ...overrides,
    client: { ...baseBudget.client, ...overrides.client },
  };
};

beforeEach(() => {
  budgets = [];
  clients = [];
  profiles = [];
  clearBudgetsMock.mockClear();
  deleteBudgetMock.mockClear();
  jest.clearAllMocks();
  printBudgetMock.mockReturnValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("HomePage", () => {
  it("renders dashboard content", () => {
    budgets = [makeBudget()];
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Meu Painel")).toBeInTheDocument();
    expect(screen.getByText("Cliente Teste")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    budgets = [];
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Nenhum orçamento ainda")).toBeInTheDocument();
  });

  it("filters budgets by client, document, phone and number", async () => {
    budgets = [
      makeBudget({ id: "a", number: 10, client: { name: "Maria", document: "111" } }),
      makeBudget({ id: "b", number: 20, client: { name: "Joao", phone: "22999999999" } }),
    ];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: /Buscar/i }), "2299");

    expect(screen.queryByText("Maria")).not.toBeInTheDocument();
    expect(screen.getByText("Joao")).toBeInTheDocument();
  });

  it("opens the print window for the selected budget", async () => {
    const budget = makeBudget({
      id: "print-me",
      client: { name: "Cliente Impressao" },
      items: [
        {
          id: "item-print",
          descricao: "Servico para imprimir",
          quantidade: 1,
          unidade: "UN",
          valorUnitario: 100,
        },
      ],
    });
    budgets = [budget];
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", { name: "Imprimir / Salvar PDF" }),
    );

    expect(printBudgetMock).toHaveBeenCalledWith(
      budget,
      expect.objectContaining({ companyName: "" }),
    );
  });

  it("shows a user-facing error when the print window can't be opened", async () => {
    budgets = [
      makeBudget({
        id: "print-error",
        client: { name: "Cliente Impressao" },
      }),
    ];
    printBudgetMock.mockReturnValue(false);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: "Imprimir / Salvar PDF" }),
    );

    expect(
      await screen.findByText(
        "Não foi possível abrir a janela de impressão. Verifique se o navegador está bloqueando pop-ups.",
      ),
    ).toBeInTheDocument();
  });

  it("opens WhatsApp with a pre-filled message targeting the client's phone", async () => {
    budgets = [
      makeBudget({
        id: "share-me",
        number: 7,
        client: { name: "Cliente WhatsApp", phone: "(11) 98888-7777" },
        totals: { subtotal: 100, discount: 0, total: 100 },
      }),
    ];
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: "Compartilhar via WhatsApp" }),
    );

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/5511988887777?text="),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("clears budgets after confirmation", async () => {
    budgets = [makeBudget()];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: "Resetar Orçamentos" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(clearBudgetsMock).toHaveBeenCalled();
  });

  it("shows budget details and deletes one budget after confirmation", async () => {
    budgets = [
      makeBudget({
        id: "delete-me",
        client: {
          name: "Cliente Completo",
          document: "123",
          address: "Rua A",
          phone: "11999999999",
        },
        items: [
          {
            id: "item-1",
            descricao: "Servico detalhado",
            quantidade: 2,
            unidade: "UN",
            valorUnitario: 75,
          },
        ],
        paymentTerms: "PIX na entrega",
        totals: { subtotal: 150, discount: 0, total: 150 },
      }),
    ];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("CPF/CNPJ: 123")).toBeInTheDocument();
    expect(screen.getByText("Endereço: Rua A")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp: 11999999999")).toBeInTheDocument();
    expect(screen.getByText(/Servico detalhado/)).toBeInTheDocument();
    expect(screen.getByText("PIX na entrega")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(deleteBudgetMock).toHaveBeenCalledWith("delete-me");
  });

  it("navigates to the clients page", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/clients" element={<div>Página de Clientes</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Clientes" }));

    expect(await screen.findByText("Página de Clientes")).toBeInTheDocument();
  });

  it("filters the dashboard by clientId from the URL and allows clearing it", async () => {
    clients = [
      { id: "c1", name: "Cliente Filtrado", createdAt: new Date().toISOString() },
    ];
    budgets = [
      makeBudget({
        id: "a",
        client: { name: "Cliente Filtrado", clientId: "c1" },
      }),
      makeBudget({ id: "b", client: { name: "Outro Cliente" } }),
    ];
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/dashboard?clientId=c1"]}>
        <Routes>
          <Route path="/dashboard" element={<HomePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Filtrando orçamentos de/)).toBeInTheDocument();
    expect(screen.getAllByText("Cliente Filtrado")).toHaveLength(2);
    expect(screen.queryByText("Outro Cliente")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar filtro" }));

    expect(
      screen.queryByText(/Filtrando orçamentos de/),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Outro Cliente")).toBeInTheDocument();
  });

  it("shows a fallback label when the filtered clientId no longer matches a client", () => {
    budgets = [makeBudget({ id: "a", client: { name: "Cliente Órfão", clientId: "missing" } })];

    render(
      <MemoryRouter initialEntries={["/dashboard?clientId=missing"]}>
        <Routes>
          <Route path="/dashboard" element={<HomePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("cliente removido")).toBeInTheDocument();
  });

  it("navigates to the companies page", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/profile" element={<div>Página de Empresas</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Empresas" }));

    expect(await screen.findByText("Página de Empresas")).toBeInTheDocument();
  });

  it("filters the dashboard by profileId from the URL, allows clearing it, and prints using that profile", async () => {
    profiles = [
      {
        id: "p1",
        companyName: "Empresa Filtrada",
        userName: "Responsavel",
        phone: "11999999999",
        pixKey: "pix",
        createdAt: new Date().toISOString(),
      },
    ];
    budgets = [
      makeBudget({
        id: "a",
        profileId: "p1",
        client: { name: "Cliente da Empresa" },
      }),
      makeBudget({ id: "b", client: { name: "Outro Cliente" } }),
    ];
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/dashboard?profileId=p1"]}>
        <Routes>
          <Route path="/dashboard" element={<HomePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Filtrando orçamentos da empresa/)).toBeInTheDocument();
    expect(screen.getByText("Empresa Filtrada")).toBeInTheDocument();
    expect(screen.getByText("Cliente da Empresa")).toBeInTheDocument();
    expect(screen.queryByText("Outro Cliente")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Imprimir / Salvar PDF" })[0]);
    expect(printBudgetMock).toHaveBeenCalledWith(
      budgets[0],
      expect.objectContaining({ companyName: "Empresa Filtrada" }),
    );

    await user.click(screen.getByRole("button", { name: "Limpar filtro" }));

    expect(
      screen.queryByText(/Filtrando orçamentos da empresa/),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Outro Cliente")).toBeInTheDocument();
  });

  it("shows a fallback label when the filtered profileId no longer matches a profile", () => {
    budgets = [makeBudget({ id: "a", profileId: "missing" })];

    render(
      <MemoryRouter initialEntries={["/dashboard?profileId=missing"]}>
        <Routes>
          <Route path="/dashboard" element={<HomePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("empresa removida")).toBeInTheDocument();
  });
});
