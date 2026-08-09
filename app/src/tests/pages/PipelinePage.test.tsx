import { MemoryRouter, Route, Routes } from "react-router-dom";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Budget, Client, MeiProfile } from "../../types";
import { PipelinePage } from "../../pages/PipelinePage";

const updateBudgetMock = jest.fn();
let budgets: Budget[] = [];
let clients: Client[] = [];
let profiles: MeiProfile[] = [];
let budgetsLoading = false;
let budgetsError: string | null = null;

jest.mock("../../hooks/useBudget", () => ({
  useBudget: () => ({
    budgets,
    loading: budgetsLoading,
    error: budgetsError,
    updateBudget: updateBudgetMock,
  }),
}));

jest.mock("../../hooks/useClients", () => ({
  useClients: () => ({
    clients,
    loading: false,
    error: null,
  }),
}));

jest.mock("../../hooks/useProfiles", () => ({
  useProfiles: () => ({
    profiles,
    loading: false,
    error: null,
  }),
}));

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: "b1",
  number: 1,
  status: "draft",
  createdAt: new Date().toISOString(),
  items: [],
  modules: { showTerms: true, showSignature: true },
  totals: { subtotal: 100, discount: 0, total: 100 },
  ...overrides,
  client: { name: "Cliente Teste", ...overrides.client },
});

beforeEach(() => {
  budgets = [];
  clients = [];
  profiles = [];
  budgetsLoading = false;
  budgetsError = null;
  jest.clearAllMocks();
  updateBudgetMock.mockResolvedValue([]);
});

const renderPipeline = (initialEntry = "/pipeline") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/dashboard" element={<div>Painel</div>} />
        <Route path="/builder" element={<div>Construtor</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("PipelinePage", () => {
  it("renders an empty state when there are no budgets", () => {
    renderPipeline();

    expect(screen.getByText("Nenhum orçamento ainda")).toBeInTheDocument();
  });

  it("groups budgets into columns by status with counts", () => {
    budgets = [
      makeBudget({ id: "a", status: "draft", client: { name: "Rascunho Cliente" } }),
      makeBudget({ id: "b", status: "approved", client: { name: "Aprovado Cliente" } }),
    ];
    renderPipeline();

    const draftColumn = screen.getByTestId("column-draft");
    const approvedColumn = screen.getByTestId("column-approved");
    expect(within(draftColumn).getByText("Rascunho Cliente")).toBeInTheDocument();
    expect(within(approvedColumn).getByText("Aprovado Cliente")).toBeInTheDocument();
    expect(within(screen.getByTestId("column-sent")).getByText("Nenhum orçamento aqui.")).toBeInTheDocument();
  });

  it("moves a budget to another status via the select fallback", async () => {
    budgets = [makeBudget({ id: "a", status: "draft" })];
    const user = userEvent.setup();
    renderPipeline();

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "sent");

    expect(updateBudgetMock).toHaveBeenCalledWith("a", { status: "sent" });
  });

  it("does not call updateBudget when the same status is reselected", async () => {
    budgets = [makeBudget({ id: "a", status: "draft" })];
    const user = userEvent.setup();
    renderPipeline();

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "draft");

    expect(updateBudgetMock).not.toHaveBeenCalled();
  });

  it("shows an error message when moving a budget fails", async () => {
    budgets = [makeBudget({ id: "a", status: "draft" })];
    updateBudgetMock.mockRejectedValueOnce(new Error("failed"));
    const user = userEvent.setup();
    renderPipeline();

    await user.selectOptions(screen.getByRole("combobox"), "sent");

    expect(
      await screen.findByText("Não foi possível mover o orçamento. Tente novamente."),
    ).toBeInTheDocument();
  });

  it("shows the issuing company on cards when more than one profile exists", () => {
    profiles = [
      { id: "p1", companyName: "Empresa Um", userName: "R", phone: "1", pixKey: "", createdAt: "" },
      { id: "p2", companyName: "Empresa Dois", userName: "R", phone: "1", pixKey: "", createdAt: "" },
    ];
    budgets = [makeBudget({ id: "a", profileId: "p1" })];
    renderPipeline();

    expect(screen.getByText("Empresa Um")).toBeInTheDocument();
  });

  it("navigates to the builder when a card is clicked", async () => {
    budgets = [makeBudget({ id: "a" })];
    const user = userEvent.setup();
    renderPipeline();

    await user.click(screen.getByText("Cliente Teste"));

    expect(await screen.findByText("Construtor")).toBeInTheDocument();
  });

  it("navigates back to the dashboard", async () => {
    const user = userEvent.setup();
    renderPipeline();

    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(await screen.findByText("Painel")).toBeInTheDocument();
  });

  it("filters by clientId from the URL and allows clearing it", async () => {
    clients = [{ id: "c1", name: "Cliente Filtrado", createdAt: new Date().toISOString() }];
    budgets = [
      makeBudget({ id: "a", client: { name: "Cliente Filtrado", clientId: "c1" } }),
      makeBudget({ id: "b", client: { name: "Outro Cliente" } }),
    ];
    const user = userEvent.setup();
    renderPipeline("/pipeline?clientId=c1");

    expect(screen.getByText(/Filtrando orçamentos de/)).toBeInTheDocument();
    expect(
      within(screen.getByTestId("column-draft")).getByText("Cliente Filtrado"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Outro Cliente")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar filtro" }));

    expect(screen.queryByText(/Filtrando orçamentos de/)).not.toBeInTheDocument();
    expect(screen.getByText("Outro Cliente")).toBeInTheDocument();
  });

  it("filters by profileId from the URL and allows clearing it", async () => {
    profiles = [
      { id: "p1", companyName: "Empresa Filtrada", userName: "R", phone: "1", pixKey: "", createdAt: "" },
    ];
    budgets = [
      makeBudget({ id: "a", profileId: "p1", client: { name: "Cliente Da Empresa" } }),
      makeBudget({ id: "b", client: { name: "Outro Cliente" } }),
    ];
    const user = userEvent.setup();
    renderPipeline("/pipeline?profileId=p1");

    expect(screen.getByText(/Filtrando orçamentos da empresa/)).toBeInTheDocument();
    expect(screen.queryByText("Outro Cliente")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar filtro" }));

    expect(
      screen.queryByText(/Filtrando orçamentos da empresa/),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Outro Cliente")).toBeInTheDocument();
  });

  it("shows loading and error states", () => {
    budgetsLoading = true;
    budgetsError = "Erro local";
    renderPipeline();

    expect(screen.getByText("Carregando orçamentos...")).toBeInTheDocument();
    expect(screen.getByText("Erro local")).toBeInTheDocument();
  });

  it("shows fallback labels when the filtered client/profile no longer exists", () => {
    budgets = [makeBudget({ id: "a" })];
    renderPipeline("/pipeline?clientId=missing&profileId=missing");

    expect(screen.getByText("cliente removido")).toBeInTheDocument();
    expect(screen.getByText("empresa removida")).toBeInTheDocument();
  });

  it("falls back to placeholder labels for a nameless client and a removed company", () => {
    profiles = [
      { id: "p1", companyName: "Empresa Ativa", userName: "R", phone: "1", pixKey: "", createdAt: "" },
      { id: "p2", companyName: "Empresa Extra", userName: "R", phone: "1", pixKey: "", createdAt: "" },
    ];
    budgets = [
      makeBudget({ id: "a", profileId: "profile-removido", client: { name: "" } }),
    ];
    renderPipeline();

    expect(screen.getByText("Sem nome")).toBeInTheDocument();
    expect(screen.getByText("Empresa removida")).toBeInTheDocument();
  });

  it("dims the card being dragged until the drag ends", () => {
    budgets = [makeBudget({ id: "a" })];
    renderPipeline();

    const card = screen.getByText("Cliente Teste").closest("article");
    if (!card) {
      throw new Error("card not found");
    }
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(k: string, v: string) {
        this.data[k] = v;
      },
      getData(k: string) {
        return this.data[k];
      },
      dropEffect: "",
      effectAllowed: "",
    };

    act(() => {
      card.dispatchEvent(
        Object.assign(new Event("dragstart", { bubbles: true }), { dataTransfer }),
      );
    });
    expect(card.className).toContain("opacity-40");
  });

  it("uses the last-known dragged budget id when the drop event carries no data", () => {
    budgets = [makeBudget({ id: "a", status: "draft" })];
    renderPipeline();

    const card = screen.getByText("Cliente Teste").closest("article");
    const approvedColumn = screen.getByTestId("column-approved");
    if (!card) {
      throw new Error("card not found");
    }
    const dragDataTransfer = {
      data: {} as Record<string, string>,
      setData(k: string, v: string) {
        this.data[k] = v;
      },
      getData(k: string) {
        return this.data[k];
      },
      dropEffect: "",
      effectAllowed: "",
    };
    const emptyDataTransfer = {
      getData: () => "",
      dropEffect: "",
    };

    act(() => {
      card.dispatchEvent(
        Object.assign(new Event("dragstart", { bubbles: true }), {
          dataTransfer: dragDataTransfer,
        }),
      );
    });
    act(() => {
      approvedColumn.dispatchEvent(
        Object.assign(new Event("drop", { bubbles: true, cancelable: true }), {
          dataTransfer: emptyDataTransfer,
        }),
      );
    });

    expect(updateBudgetMock).toHaveBeenCalledWith("a", { status: "approved" });
  });

  it("moves a card between columns via native drag and drop", () => {
    budgets = [makeBudget({ id: "a", status: "draft" })];
    renderPipeline();

    const card = screen.getByText("Cliente Teste").closest("article");
    const approvedColumn = screen.getByTestId("column-approved");
    if (!card) {
      throw new Error("card not found");
    }

    const dataTransfer = { data: {} as Record<string, string>, setData(k: string, v: string) { this.data[k] = v; }, getData(k: string) { return this.data[k]; }, dropEffect: "", effectAllowed: "" };

    card.dispatchEvent(
      Object.assign(new Event("dragstart", { bubbles: true }), { dataTransfer }),
    );
    approvedColumn.dispatchEvent(
      Object.assign(new Event("dragover", { bubbles: true, cancelable: true }), { dataTransfer }),
    );
    approvedColumn.dispatchEvent(
      Object.assign(new Event("drop", { bubbles: true, cancelable: true }), { dataTransfer }),
    );

    expect(updateBudgetMock).toHaveBeenCalledWith("a", { status: "approved" });
  });

  it("tracks drag-over state per column and clears it on dragleave/dragend", () => {
    budgets = [makeBudget({ id: "a", status: "draft" })];
    renderPipeline();

    const card = screen.getByText("Cliente Teste").closest("article");
    const approvedColumn = screen.getByTestId("column-approved");
    const draftColumn = screen.getByTestId("column-draft");
    if (!card) {
      throw new Error("card not found");
    }
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(k: string, v: string) {
        this.data[k] = v;
      },
      getData(k: string) {
        return this.data[k];
      },
      dropEffect: "",
      effectAllowed: "",
    };

    act(() => {
      card.dispatchEvent(
        Object.assign(new Event("dragstart", { bubbles: true }), { dataTransfer }),
      );
    });
    act(() => {
      approvedColumn.dispatchEvent(
        Object.assign(new Event("dragover", { bubbles: true, cancelable: true }), {
          dataTransfer,
        }),
      );
    });
    expect(approvedColumn.className).toContain("border-white/40");

    // dragleave numa coluna diferente da que está com drag-over ativo não
    // deve limpar o estado (branch "current !== status" do setState).
    act(() => {
      draftColumn.dispatchEvent(new Event("dragleave", { bubbles: true }));
    });
    expect(approvedColumn.className).toContain("border-white/40");

    act(() => {
      approvedColumn.dispatchEvent(new Event("dragleave", { bubbles: true }));
    });
    expect(approvedColumn.className).not.toContain("border-white/40");

    act(() => {
      card.dispatchEvent(new Event("dragend", { bubbles: true }));
    });
    expect(card.className).not.toContain("opacity-40");
  });
});
