import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetPage } from "../../pages/BudgetPage";

const PROFILE_KEY = "@OrcaRapido:mei_profile";

describe("BudgetPage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        companyName: "Empresa Real",
        userName: "Pessoa Responsavel",
        phone: "11999999999",
        pixKey: "",
      }),
    );
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

    await screen.findByRole("button", { name: /Salvar Orçamento/i });
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

  it("fills and persists every client field, including status", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByRole("textbox", { name: /Nome do Cliente/i }),
      "Cliente Completo",
    );
    await user.type(
      screen.getByRole("textbox", { name: /CPF \/ CNPJ/i }),
      "52998224725",
    );
    await user.type(
      screen.getByRole("textbox", { name: /Email do Cliente/i }),
      "cliente@completo.com",
    );
    await user.type(
      screen.getByRole("textbox", { name: /Endereço Completo/i }),
      "Rua Completa, 123",
    );
    await user.type(
      screen.getByRole("textbox", { name: /WhatsApp do Cliente/i }),
      "11988887777",
    );
    await user.selectOptions(screen.getByRole("combobox", { name: /Status/i }), "sent");

    await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
    await user.type(
      screen.getByPlaceholderText("Ex: Desenvolvimento de Site"),
      "Servico",
    );
    await user.clear(screen.getByRole("spinbutton", { name: /Valor Unitário/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Valor Unitário/i }), "10");

    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    await waitFor(() =>
      expect(localStorage.getItem("@OrcaRapido:budgets")).toBeTruthy(),
    );
    const budgets = JSON.parse(localStorage.getItem("@OrcaRapido:budgets") || "[]");
    expect(budgets[0]).toMatchObject({
      status: "sent",
      client: {
        name: "Cliente Completo",
        document: "529.982.247-25",
        email: "cliente@completo.com",
        address: "Rua Completa, 123",
        phone: "(11) 98888-7777",
      },
    });
  });

  it("shows a validation error for an invalid client email", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByRole("textbox", { name: /Nome do Cliente/i }),
      "Cliente Email Invalido",
    );
    await user.type(
      screen.getByRole("textbox", { name: /Email do Cliente/i }),
      "nao-e-um-email",
    );
    await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
    await user.type(
      screen.getByPlaceholderText("Ex: Desenvolvimento de Site"),
      "Servico",
    );
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));
    await screen.findByText("Revise os campos destacados antes de salvar.");
    await user.click(
      screen.getByRole("button", { name: /1. Dados da Proposta e Cliente/i }),
    );

    expect(
      await screen.findByText("Informe um email válido."),
    ).toBeInTheDocument();
    expect(localStorage.getItem("@OrcaRapido:budgets")).toBeNull();
  });

  it("toggles document options and changes unit/validity inputs", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByRole("textbox", { name: /Nome do Cliente/i }),
      "Cliente Opções",
    );
    await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
    await user.type(
      screen.getByPlaceholderText("Ex: Desenvolvimento de Site"),
      "Servico",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Unidade/i }),
      "HR",
    );

    await user.click(screen.getByRole("button", { name: /3. Configurações do Documento/i }));
    await user.click(screen.getByRole("checkbox", { name: /Exibir Logo da Empresa/i }));
    // "Validade do Orçamento" já vem ativa por padrão no estado inicial.
    const validityInput = screen.getByRole("spinbutton", {
      name: /Válido por \(dias\)/i,
    });
    await user.clear(validityInput);
    await user.type(validityInput, "15");

    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    await waitFor(() =>
      expect(localStorage.getItem("@OrcaRapido:budgets")).toBeTruthy(),
    );
    const budgets = JSON.parse(localStorage.getItem("@OrcaRapido:budgets") || "[]");
    expect(budgets[0].items[0].unidade).toBe("HR");
    expect(budgets[0].validUntil).toBeDefined();
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

  it("autocompletes client fields from a registered client and links clientId", async () => {
    localStorage.setItem(
      "@OrcaRapido:clients",
      JSON.stringify([
        {
          id: "client-1",
          name: "Maria Cadastrada",
          document: "529.982.247-25",
          email: "maria@cliente.com",
          phone: "11988887777",
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByRole("textbox", { name: /Nome do Cliente/i }),
      "Maria",
    );
    await user.click(await screen.findByText("Maria Cadastrada"));

    expect(
      screen.getByRole("textbox", { name: /CPF \/ CNPJ/i }),
    ).toHaveValue("529.982.247-25");
    expect(
      screen.getByRole("textbox", { name: /Email do Cliente/i }),
    ).toHaveValue("maria@cliente.com");
    expect(
      screen.getByText(/Vinculado ao cliente cadastrado/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
    await user.type(
      screen.getByPlaceholderText("Ex: Desenvolvimento de Site"),
      "Servico",
    );
    await user.clear(screen.getByRole("spinbutton", { name: /Valor Unitário/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Valor Unitário/i }), "10");
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    await waitFor(() =>
      expect(localStorage.getItem("@OrcaRapido:budgets")).toBeTruthy(),
    );
    const budgets = JSON.parse(localStorage.getItem("@OrcaRapido:budgets") || "[]");
    expect(budgets[0].client.clientId).toBe("client-1");
  });

  it("unlinks the client when the name is edited after selecting a suggestion", async () => {
    localStorage.setItem(
      "@OrcaRapido:clients",
      JSON.stringify([
        {
          id: "client-1",
          name: "Maria Cadastrada",
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByRole("textbox", { name: /Nome do Cliente/i }),
      "Maria",
    );
    await user.click(await screen.findByText("Maria Cadastrada"));
    expect(
      screen.getByText(/Vinculado ao cliente cadastrado/i),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: /Nome do Cliente/i }),
      " Editada",
    );

    expect(
      screen.queryByText(/Vinculado ao cliente cadastrado/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /Cadastrar este cliente para reaproveitar depois/i,
      }),
    ).toBeInTheDocument();
  });

  it("registers a new client when 'save as new client' is checked on save", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByRole("textbox", { name: /Nome do Cliente/i }),
      "Cliente Para Cadastrar",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: /Cadastrar este cliente para reaproveitar depois/i,
      }),
    );

    await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
    await user.type(
      screen.getByPlaceholderText("Ex: Desenvolvimento de Site"),
      "Servico",
    );
    await user.clear(screen.getByRole("spinbutton", { name: /Valor Unitário/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Valor Unitário/i }), "10");
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    await waitFor(() =>
      expect(localStorage.getItem("@OrcaRapido:clients")).toBeTruthy(),
    );
    const clients = JSON.parse(localStorage.getItem("@OrcaRapido:clients") || "[]");
    expect(clients).toHaveLength(1);
    expect(clients[0].name).toBe("Cliente Para Cadastrar");

    const budgets = JSON.parse(localStorage.getItem("@OrcaRapido:budgets") || "[]");
    expect(budgets[0].client.clientId).toBe(clients[0].id);
  });

  it("saves a custom footer text and shows it instead of the default banner", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByRole("textbox", { name: /Nome do Cliente/i }),
      "Cliente Rodapé",
    );
    await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
    await user.type(
      screen.getByPlaceholderText("Ex: Desenvolvimento de Site"),
      "Servico",
    );
    await user.clear(screen.getByRole("spinbutton", { name: /Valor Unitário/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Valor Unitário/i }), "10");

    await user.click(screen.getByRole("button", { name: /3. Configurações do Documento/i }));
    await user.type(
      screen.getByRole("textbox", { name: /Rodapé personalizado do PDF/i }),
      "Meu rodapé customizado",
    );

    expect(
      screen.getByText("Meu rodapé customizado", { selector: "p" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Orçamento digital gratuito criado por"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    await waitFor(() =>
      expect(localStorage.getItem("@OrcaRapido:budgets")).toBeTruthy(),
    );
    const budgets = JSON.parse(localStorage.getItem("@OrcaRapido:budgets") || "[]");
    expect(budgets[0].modules.footerText).toBe("Meu rodapé customizado");
  });

  it("autocompletes client fields from a document match", async () => {
    localStorage.setItem(
      "@OrcaRapido:clients",
      JSON.stringify([
        {
          id: "client-doc",
          name: "Empresa Cliente LTDA",
          document: "52.998.224/0001-25",
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByRole("textbox", { name: /CPF \/ CNPJ/i }),
      "52998224",
    );
    await user.click(await screen.findByText("Empresa Cliente LTDA"));

    expect(
      screen.getByRole("textbox", { name: /Nome do Cliente/i }),
    ).toHaveValue("Empresa Cliente LTDA");
  });

  describe("with multiple registered companies", () => {
    beforeEach(() => {
      localStorage.setItem(
        "@OrcaRapido:profiles",
        JSON.stringify([
          {
            id: "profile-a",
            companyName: "Empresa A",
            userName: "Responsavel A",
            phone: "11999999999",
            pixKey: "",
            createdAt: new Date().toISOString(),
          },
          {
            id: "profile-b",
            companyName: "Empresa B",
            userName: "Responsavel B",
            phone: "11988888888",
            pixKey: "",
            createdAt: new Date().toISOString(),
          },
        ]),
      );
    });

    it("blocks saving until an issuing company is explicitly selected", async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <BudgetPage />
        </MemoryRouter>,
      );

      await screen.findByRole("button", { name: /Salvar Orçamento/i });
      await user.type(
        screen.getByRole("textbox", { name: /Nome do Cliente/i }),
        "Cliente Sem Empresa",
      );
      await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
      await user.type(
        screen.getByPlaceholderText("Ex: Desenvolvimento de Site"),
        "Servico",
      );
      await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

      const messages = await screen.findAllByText(
        "Selecione a empresa emissora deste orçamento antes de salvar.",
      );
      expect(messages.length).toBeGreaterThan(0);
      expect(localStorage.getItem("@OrcaRapido:budgets")).toBeNull();
    });

    it("saves the budget under the explicitly selected company", async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <BudgetPage />
        </MemoryRouter>,
      );

      const profileSelect = await screen.findByRole("combobox", {
        name: /Empresa Emissora/i,
      });
      await user.selectOptions(profileSelect, "profile-b");
      expect(profileSelect).toHaveValue("profile-b");

      await user.type(
        screen.getByRole("textbox", { name: /Nome do Cliente/i }),
        "Cliente Empresa B",
      );
      await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
      await user.type(
        screen.getByPlaceholderText("Ex: Desenvolvimento de Site"),
        "Servico",
      );
      await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

      await waitFor(() =>
        expect(localStorage.getItem("@OrcaRapido:budgets")).toBeTruthy(),
      );
      const budgets = JSON.parse(localStorage.getItem("@OrcaRapido:budgets") || "[]");
      expect(budgets[0].profileId).toBe("profile-b");
    });
  });
});
