import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetPage } from "../../pages/BudgetPage";

describe("BudgetPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders page header and live preview placeholders", () => {
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Construtor de Orçamento")).toBeInTheDocument();
    expect(screen.getByText("Nome da empresa")).toBeInTheDocument();
    expect(screen.getByText("Sem nome")).toBeInTheDocument();
    expect(screen.getByText("Item sem descrição")).toBeInTheDocument();
    expect(screen.getByText(/TOTAL GERAL/i)).toBeInTheDocument();
  });

  it("saves a valid budget and redirects to dashboard", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    const proposalInput = screen.getByRole("textbox", {
      name: /Nº do Orçamento/i,
    });
    await user.clear(proposalInput);
    await user.type(proposalInput, "42");
    await user.type(screen.getByRole("textbox", { name: /Nome do Cliente/i }), "Cliente A");
    await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
    await user.type(screen.getByPlaceholderText("Ex: Desenvolvimento de Site"), "Servico");
    await user.clear(screen.getByRole("spinbutton", { name: /Valor Unitário/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Valor Unitário/i }), "150");
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    await waitFor(() =>
      expect(localStorage.getItem("@OrcaRapido:budgets")).toBeTruthy(),
    );
    const raw = localStorage.getItem("@OrcaRapido:budgets");
    const budgets = JSON.parse(raw || "[]");
    expect(budgets[0]).toMatchObject({
      number: 42,
      client: { name: "Cliente A" },
    });
    expect(budgets[0].previewImageDataUrl).toBeUndefined();
  });

  it("persists optional document settings when values are valid", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: /Nº do Orçamento/i }), "orc-abc");
    await user.type(screen.getByRole("textbox", { name: /Nome do Cliente/i }), "Cliente B");
    await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
    await user.type(screen.getByPlaceholderText("Ex: Desenvolvimento de Site"), "Consultoria");
    await user.clear(screen.getByRole("spinbutton", { name: /Valor Unitário/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Valor Unitário/i }), "50");

    await user.click(screen.getByRole("button", { name: /3. Configurações do Documento/i }));
    await user.click(screen.getByRole("checkbox", { name: /Validade do Orçamento/i }));
    await user.click(screen.getByRole("checkbox", { name: /Aplicar Desconto/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Valor do Desconto/i }), "25");
    await user.click(screen.getByRole("checkbox", { name: /Condições de Pagamento/i }));
    await user.type(screen.getByRole("textbox", { name: /Detalhes/i }), "50% entrada\n50% entrega");
    await user.click(screen.getByRole("checkbox", { name: /Observações e Termos/i }));
    await user.type(screen.getByRole("textbox", { name: /Regras de negócio/i }), "Garantia de 30 dias");
    await user.click(screen.getByRole("checkbox", { name: /Campo de Assinatura/i }));
    await user.click(screen.getByRole("checkbox", { name: /Banner de Parceria/i }));

    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    await waitFor(() =>
      expect(localStorage.getItem("@OrcaRapido:budgets")).toBeTruthy(),
    );
    const budgets = JSON.parse(localStorage.getItem("@OrcaRapido:budgets") || "[]");
    expect(budgets).toHaveLength(1);
    expect(budgets[0]).toMatchObject({
      number: 1,
      client: { name: "Cliente B" },
      paymentTerms: "50% entrada\n50% entrega",
      terms: "Garantia de 30 dias",
      discount: 25,
      modules: {
        showTerms: true,
        showSignature: false,
        removeAds: true,
      },
      totals: {
        subtotal: 50,
        discount: 25,
        total: 25,
      },
    });
    expect(budgets[0]).not.toHaveProperty("validUntil");
  });

  it("blocks invalid submit with visible validation errors", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    expect(
      await screen.findByText("Revise os campos destacados antes de salvar."),
    ).toBeInTheDocument();
    expect(screen.getByText("Nome do cliente é obrigatório.")).toBeInTheDocument();
    expect(localStorage.getItem("@OrcaRapido:budgets")).toBeNull();
  });

  it("renders the empty item state when all items are removed", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
    await user.click(screen.getByTitle("Remover item"));

    expect(
      screen.getByText("Nenhum item adicionado ao orçamento."),
    ).toBeInTheDocument();
  });

  it("updates the saved draft instead of creating duplicates on repeated saves", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: /Nome do Cliente/i }), "Cliente inicial");
    await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
    await user.type(screen.getByPlaceholderText("Ex: Desenvolvimento de Site"), "Serviço");
    await user.clear(screen.getByRole("spinbutton", { name: /Valor Unitário/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Valor Unitário/i }), "100");
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));
    await user.click(screen.getByRole("button", { name: /1. Dados da Proposta e Cliente/i }));
    await user.clear(screen.getByRole("textbox", { name: /Nome do Cliente/i }));
    await user.type(screen.getByRole("textbox", { name: /Nome do Cliente/i }), "Cliente atualizado");
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    await waitFor(() =>
      expect(localStorage.getItem("@OrcaRapido:budgets")).toBeTruthy(),
    );
    const budgets = JSON.parse(localStorage.getItem("@OrcaRapido:budgets") || "[]");
    expect(budgets).toHaveLength(1);
    expect(budgets[0].client.name).toBe("Cliente atualizado");
  });
});
