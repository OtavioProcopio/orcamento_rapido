// Regressão: já tivemos TRÊS bugs reais de impressão saindo em branco nesta
// mesma funcionalidade — CSS escondendo o app com display:none, depois com
// visibility:hidden (que deixava uma segunda página fantasma), e por fim um
// iframe isolado que funcionava no desktop mas o Safari/Chrome de celular
// tem uma limitação conhecida de imprimir a página inteira por trás em vez
// do conteúdo do iframe. A impressão agora abre uma janela/aba separada de
// verdade (não um iframe) só com o conteúdo do orçamento — técnica clássica
// que não sofre da limitação de iframe em mobile. Este teste verifica o
// HTML escrito nessa janela, não apenas que algo foi "chamado".
describe("Print rendering", () => {
  it("writes exactly the preview content into the print window, with the banner always visible", () => {
    cy.seedProfile();
    cy.visit("/dashboard");
    cy.contains("Novo Orçamento").click();
    cy.createBudget({ clientName: "Cliente Impressao Real", value: 250 });
    cy.contains("Cliente Impressao Real").should("be.visible");

    cy.window().then((win) => {
      const fakePrintWindow = {
        document: {
          open: cy.stub(),
          write: cy.stub().as("printWrite"),
          close: cy.stub(),
        },
        focus: cy.stub(),
        print: cy.stub().as("printCall"),
        addEventListener: cy.stub(),
      };
      cy.stub(win, "open").as("windowOpen").returns(fakePrintWindow);
    });

    cy.contains("Imprimir / Salvar PDF").click();

    cy.get("@windowOpen").should(
      "have.been.calledWith",
      "",
      "_blank",
      "noopener,noreferrer",
    );
    cy.get("@printWrite").should(($write) => {
      const html = $write.args[0][0];
      expect(html).to.contain("Cliente Impressao Real");
      expect(html).to.contain("250,00");
      expect(html).to.contain("Orçamento digital gratuito criado por");
    });

    // O react-to-print e as tentativas anteriores caíram exatamente aqui:
    // "algo foi chamado" não prova que o conteúdo certo chegou na janela de
    // impressão. Damos tempo pro setTimeout interno disparar o print real.
    cy.wait(400);
    cy.get("@printCall").should("have.been.called");
  });

  it("keeps the partner banner even when creating a budget with it previously removable", () => {
    // O toggle de remover o banner não existe mais no formulário — o plano
    // gratuito não permite desativá-lo.
    cy.seedProfile();
    cy.visit("/builder");
    cy.contains("3. Configurações do Documento").click();
    cy.contains("Banner de Parceria").should("not.exist");
  });
});
