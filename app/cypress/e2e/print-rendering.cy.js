// Regressão: window.print() sendo chamado não prova que o PDF sai com
// conteúdo — um bug real em produção deixava a impressão em branco porque o
// CSS escondia o app via `display: none` em vez de `visibility: hidden`,
// o que alguns motores de impressão não recalculam a tempo pra conteúdo
// inserido via portal do React. Este teste emula mídia de impressão de
// verdade (via CDP) e verifica que a área de impressão fica visível com
// conteúdo, e que o resto do app fica oculto.
describe("Print rendering", () => {
  const emulatePrintMedia = () =>
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Emulation.setEmulatedMedia",
        params: { media: "print" },
      }),
    );

  const restoreScreenMedia = () =>
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Emulation.setEmulatedMedia",
        params: { media: "screen" },
      }),
    );

  afterEach(() => {
    restoreScreenMedia();
  });

  it("keeps the budget content visible and readable under print media", () => {
    cy.seedProfile();
    cy.visit("/dashboard");
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Cliente Impressao Real", value: 250 });
    cy.contains("Cliente Impressao Real").should("be.visible");

    cy.window().then((win) => {
      cy.stub(win, "print").as("print");
    });
    cy.contains("Imprimir / Salvar PDF").click();
    cy.get("@print").should("have.been.called");

    emulatePrintMedia();

    cy.get(".print-document-area")
      .should("be.visible")
      .and(($el) => {
        expect($el.text()).to.contain("Cliente Impressao Real");
        expect($el.text()).to.contain("250,00");
      });

    cy.get(".print-document-area").then(($el) => {
      const styles = window.getComputedStyle($el[0]);
      expect(styles.visibility).to.eq("visible");
    });

    // O resto do app (dashboard por trás) não pode aparecer na impressão.
    cy.get("#root").then(($el) => {
      const styles = window.getComputedStyle($el[0]);
      expect(styles.visibility).to.eq("hidden");
    });
  });
});
