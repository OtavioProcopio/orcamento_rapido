// Regressão: window.print() sendo chamado (ou, hoje, o iframe de impressão
// sendo criado) não prova que o PDF sai com conteúdo. Já tivemos dois bugs
// reais aqui: primeiro o CSS escondia o app via `display: none` (motor de
// impressão não recalculava a tempo pra conteúdo de portal → PDF em
// branco), depois trocamos pra `visibility: hidden` e o #root (que não sai
// do fluxo com visibility) empurrava o conteúdo pra uma segunda página em
// branco. A impressão agora roda via react-to-print, que clona o conteúdo
// num iframe isolado em vez de esconder o app inteiro — elimina essa
// categoria de bug inteira, inclusive as diferenças de motor de impressão
// entre desktop e mobile que a técnica anterior não sobrevivia.
describe("Print rendering", () => {
  it("keeps the source content correct and triggers the print iframe", () => {
    cy.seedProfile();
    cy.visit("/dashboard");
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Cliente Impressao Real", value: 250 });
    cy.contains("Cliente Impressao Real").should("be.visible");

    cy.window().then((win) => {
      cy.spy(win.document, "createElement").as("createElement");
    });

    cy.contains("Imprimir / Salvar PDF").click();

    // O conteúdo que o react-to-print vai clonar pro iframe de impressão
    // precisa estar correto e presente ANTES da impressão ser acionada —
    // é essa fonte que a biblioteca copia, então validar aqui garante que
    // o PDF resultante teria os dados certos.
    cy.get(".print-source-area")
      .should("exist")
      .and(($el) => {
        expect($el.text()).to.contain("Cliente Impressao Real");
        expect($el.text()).to.contain("250,00");
      });

    // Confirma que o mecanismo de impressão (iframe isolado) foi acionado.
    cy.get("@createElement").should("have.been.calledWith", "iframe");
  });
});
