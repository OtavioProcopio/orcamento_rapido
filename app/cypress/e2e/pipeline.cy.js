describe("Sales pipeline (Kanban)", () => {
  beforeEach(() => {
    cy.seedProfile();
    cy.visit("/dashboard");
  });

  it("shows a new budget in the Rascunho column and moves it via the select fallback", () => {
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Cliente Pipeline", value: 120 });

    cy.contains("Pipeline").click();
    cy.contains("Pipeline de Vendas").should("be.visible");

    cy.get("[data-status='draft']")
      .contains("Cliente Pipeline")
      .should("be.visible");
    cy.get("[data-status='sent']")
      .contains("Cliente Pipeline")
      .should("not.exist");

    cy.get("[data-status='draft']")
      .contains("article", "Cliente Pipeline")
      .find("select")
      .select("Enviado");

    cy.get("[data-status='sent']")
      .contains("Cliente Pipeline")
      .should("be.visible");
    cy.get("[data-status='draft']")
      .contains("Cliente Pipeline")
      .should("not.exist");
  });

  it("moves a budget across columns via native drag and drop", () => {
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Cliente Drag", value: 90 });
    cy.contains("Pipeline").click();

    cy.get("[data-status='draft']")
      .contains("article", "Cliente Drag")
      .then(($card) => {
        // Depois do drop, o React já move o card pra outra coluna (novo nó
        // no DOM) — não há como (nem necessidade de) disparar "dragend" no
        // elemento original, que nesse ponto já se desconectou do DOM.
        const dataTransfer = new DataTransfer();
        cy.wrap($card).trigger("dragstart", { dataTransfer });
        cy.get("[data-status='approved']").trigger("dragover", { dataTransfer });
        cy.get("[data-status='approved']").trigger("drop", { dataTransfer });
      });

    cy.get("[data-status='approved']")
      .contains("Cliente Drag")
      .should("be.visible");
    cy.get("[data-status='draft']")
      .contains("Cliente Drag")
      .should("not.exist");
  });

  it("navigates to the builder when a card is clicked", () => {
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Cliente Editar Card", value: 60 });
    cy.contains("Pipeline").click();

    cy.get("[data-status='draft']").contains("Cliente Editar Card").click();

    cy.contains("Construtor de Orçamento").should("be.visible");
    cy.get("input[name='clientName']").should(
      "have.value",
      "Cliente Editar Card",
    );
  });
});
