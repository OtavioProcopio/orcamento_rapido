describe("Data management (backup export/import)", () => {
  beforeEach(() => {
    cy.seedProfile();
  });

  it("alerts when there is nothing to export", () => {
    cy.visit("/data");
    cy.window().then((win) => cy.stub(win, "alert").as("alert"));

    cy.contains("Backup JSON").click();
    cy.get("@alert").should(
      "have.been.calledWith",
      "Não há orçamentos para exportar.",
    );

    cy.contains("Exportar CSV").click();
    cy.get("@alert").should(
      "have.been.calledWith",
      "Não há orçamentos para exportar.",
    );
  });

  it("asks for confirmation before importing and replaces the local history", () => {
    cy.visit("/dashboard");
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Cliente Antes do Import", value: 10 });
    cy.contains("Cliente Antes do Import").should("be.visible");

    cy.contains("Exportar/Importar Dados").click();
    cy.contains("Backup e Dados").should("be.visible");

    const backup = {
      app: "orca-rapido",
      version: 1,
      exportedAt: new Date().toISOString(),
      budgets: [
        {
          id: "imported-budget-1",
          number: 99,
          status: "approved",
          createdAt: new Date().toISOString(),
          client: { name: "Cliente Importado" },
          items: [],
          modules: { showTerms: true, showSignature: true, removeAds: false },
          totals: { subtotal: 0, discount: 0, total: 0 },
        },
      ],
    };

    cy.get("input[type='file']").selectFile(
      {
        contents: Cypress.Buffer.from(JSON.stringify(backup)),
        fileName: "backup.json",
        mimeType: "application/json",
      },
      { force: true },
    );

    cy.get("[role='dialog']").should("be.visible");
    cy.contains("backup.json").should("be.visible");
    cy.contains("button", "Importar e substituir").click();

    cy.contains("Importação realizada com sucesso!").should("be.visible");

    cy.visit("/dashboard");
    cy.contains("Cliente Importado").should("be.visible");
    cy.contains("Cliente Antes do Import").should("not.exist");
  });

  it("does not import when the confirmation is cancelled", () => {
    cy.visit("/data");

    cy.get("input[type='file']").selectFile(
      {
        contents: Cypress.Buffer.from(
          JSON.stringify({ app: "orca-rapido", version: 1, budgets: [] }),
        ),
        fileName: "backup-cancelado.json",
        mimeType: "application/json",
      },
      { force: true },
    );

    cy.get("[role='dialog']").should("be.visible");
    cy.get("[role='dialog']").contains("Cancelar").click();
    cy.get("[role='dialog']").should("not.exist");
    cy.contains("Importação realizada com sucesso!").should("not.exist");
  });
});
