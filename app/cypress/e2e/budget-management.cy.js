describe("Budget management flows", () => {
  beforeEach(() => {
    cy.seedProfile();
    cy.visit("/dashboard");
  });

  it("edits an existing budget and keeps the same proposal number", () => {
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Cliente Original", value: 100 });
    cy.contains("Cliente Original").should("be.visible");

    cy.contains("article", "Cliente Original")
      .contains("button", "Editar")
      .click();
    cy.contains("Construtor de Orçamento").should("be.visible");
    cy.get("input[name='clientName']").should("have.value", "Cliente Original");

    cy.get("input[name='clientName']").clear().type("Cliente Editado");
    cy.contains("Salvar Orçamento").click();

    cy.contains("Meu Painel", { timeout: 15000 }).should("be.visible");
    cy.contains("Cliente Editado").should("be.visible");
    cy.contains("Cliente Original").should("not.exist");
    cy.contains("Orçamento #1").should("be.visible");
  });

  it("duplicates a budget into a new proposal number", () => {
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Cliente Base", value: 200 });

    cy.contains("article", "Cliente Base")
      .contains("button", "Duplicar")
      .click();
    cy.contains("Construtor de Orçamento").should("be.visible");
    cy.get("input[name='clientName']").should("have.value", "Cliente Base");
    cy.get("input[name='proposalNumber']").should("have.value", "2");

    cy.contains("Salvar Orçamento").click();
    cy.contains("Meu Painel", { timeout: 15000 }).should("be.visible");
    cy.contains("Orçamento #1").should("be.visible");
    cy.contains("Orçamento #2").should("be.visible");
  });

  it("keeps the budget when a delete confirmation is cancelled", () => {
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Cliente Preservado", value: 50 });

    cy.contains("article", "Cliente Preservado")
      .contains("button", "Excluir")
      .click();
    cy.get("[role='dialog']").should("be.visible");
    cy.get("[role='dialog']").contains("Cancelar").click();

    cy.get("[role='dialog']").should("not.exist");
    cy.contains("Cliente Preservado").should("be.visible");
  });

  it("shares a generated budget via WhatsApp with a pre-filled message", () => {
    cy.contains("Novo Orçamento").click();
    cy.get("input[name='clientName']").type("Cliente WhatsApp");
    cy.get("input[name='clientPhone']").type("11988887777");
    cy.contains("2. Itens e Valores").click();
    cy.get("input[name='items.0.descricao']").type("Servico");
    cy.get("input[name='items.0.valorUnitario']").clear().type("100");
    cy.contains("Salvar Orçamento").click();
    cy.contains("Meu Painel", { timeout: 15000 }).should("be.visible");

    cy.window().then((win) => {
      cy.stub(win, "open").as("whatsappOpen");
    });
    cy.contains("article", "Cliente WhatsApp")
      .contains("button", "Compartilhar via WhatsApp")
      .click();

    cy.get("@whatsappOpen").should(
      "have.been.calledWith",
      Cypress.sinon.match(/^https:\/\/wa\.me\/5511988887777\?text=/),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("filters the history by search term", () => {
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Maria Comercio", value: 10 });
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Joao Servicos", value: 20 });

    cy.get('input[placeholder*="Cliente"]').type("Maria");
    cy.contains("Maria Comercio").should("be.visible");
    cy.contains("Joao Servicos").should("not.exist");

    cy.get('input[placeholder*="Cliente"]').clear().type("zzz-nao-existe");
    cy.contains("Nenhum resultado encontrado").should("be.visible");
  });

  it("keeps history intact when resetting is cancelled, clears it when confirmed", () => {
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Cliente Resetavel", value: 30 });

    cy.contains("Resetar Orçamentos").click();
    cy.get("[role='dialog']").contains("Cancelar").click();
    cy.contains("Cliente Resetavel").should("be.visible");

    cy.contains("Resetar Orçamentos").click();
    cy.get("[role='dialog']").contains("Confirmar").click();
    cy.contains("Nenhum orçamento ainda").should("be.visible");
  });
});
