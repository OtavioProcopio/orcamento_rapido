import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Budget, Client } from "../../types";
import { ClientsPage } from "../../pages/ClientsPage";

const addClientMock = jest.fn();
const updateClientMock = jest.fn();
const deleteClientMock = jest.fn();
let clients: Client[] = [];
let budgets: Budget[] = [];

jest.mock("../../hooks/useClients", () => ({
  useClients: () => ({
    clients,
    loading: false,
    error: null,
    addClient: addClientMock,
    updateClient: updateClientMock,
    deleteClient: deleteClientMock,
  }),
}));

jest.mock("../../hooks/useBudget", () => ({
  useBudget: () => ({
    budgets,
    loading: false,
    error: null,
  }),
}));

const makeClient = (overrides: Partial<Client> = {}): Client => ({
  id: "c1",
  name: "Cliente Um",
  createdAt: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  clients = [];
  budgets = [];
  jest.clearAllMocks();
  addClientMock.mockResolvedValue([]);
  updateClientMock.mockResolvedValue([]);
  deleteClientMock.mockResolvedValue([]);
});

describe("ClientsPage", () => {
  it("renders an empty state when there are no clients", () => {
    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Nenhum cliente cadastrado")).toBeInTheDocument();
  });

  it("lists clients with their budget count", () => {
    clients = [makeClient({ id: "c1", name: "Maria", document: "111" })];
    budgets = [
      {
        id: "b1",
        number: 1,
        status: "draft",
        createdAt: new Date().toISOString(),
        client: { name: "Maria", clientId: "c1" },
        items: [],
        modules: { showTerms: true, showSignature: true },
        totals: { subtotal: 0, discount: 0, total: 0 },
      },
      {
        id: "b2",
        number: 2,
        status: "draft",
        createdAt: new Date().toISOString(),
        client: { name: "Cliente Avulso" },
        items: [],
        modules: { showTerms: true, showSignature: true },
        totals: { subtotal: 0, discount: 0, total: 0 },
      },
    ];

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("1 orçamento")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver orçamentos" }),
    ).toHaveAttribute("href", "/dashboard?clientId=c1");
  });

  it("filters clients by search term", async () => {
    clients = [
      makeClient({ id: "c1", name: "Maria" }),
      makeClient({ id: "c2", name: "Joao" }),
    ];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: /Buscar cliente/i }), "Joao");

    expect(screen.queryByText("Maria")).not.toBeInTheDocument();
    expect(screen.getByText("Joao")).toBeInTheDocument();
  });

  it("creates a new client from the form, masking document and phone", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Novo Cliente" }));
    await user.type(screen.getByLabelText("Nome"), "Cliente Novo");
    await user.type(screen.getByLabelText("CPF / CNPJ"), "52998224725");
    await user.type(screen.getByLabelText("Telefone"), "11988887777");
    await user.click(screen.getByRole("button", { name: "Cadastrar cliente" }));

    expect(addClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Cliente Novo",
        document: "529.982.247-25",
        phone: "11988887777",
      }),
    );
  });

  it("edits an existing client", async () => {
    clients = [makeClient({ id: "c1", name: "Cliente Antigo" })];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const nameField = screen.getByLabelText("Nome");
    await user.clear(nameField);
    await user.type(nameField, "Cliente Renomeado");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(updateClientMock).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ name: "Cliente Renomeado" }),
    );
  });

  it("navigates back to the dashboard", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/clients"]}>
        <Routes>
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/dashboard" element={<div>Painel</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(await screen.findByText("Painel")).toBeInTheDocument();
  });

  it("cancels the delete confirmation without deleting", async () => {
    clients = [makeClient({ id: "c1", name: "Cliente Mantido" })];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteClientMock).not.toHaveBeenCalled();
  });

  it("deletes a client after confirmation", async () => {
    clients = [makeClient({ id: "c1", name: "Cliente Para Excluir" })];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Confirmar" }));

    expect(deleteClientMock).toHaveBeenCalledWith("c1");
  });
});
