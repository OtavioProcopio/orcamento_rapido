// Regressão: já tivemos QUATRO bugs reais de impressão saindo em branco
// nesta mesma funcionalidade — CSS escondendo o app com display:none,
// depois com visibility:hidden (segunda página fantasma), um iframe
// isolado que funcionava no desktop mas tem limitação conhecida em
// mobile (Safari/Chrome imprimem a página de trás inteira), e por fim
// `window.open(..., "noopener")`, que por especificação SEMPRE retorna
// null — a aba abria (por isso "about:blank") mas o código não tinha
// como escrever conteúdo nela nem chamar print().
//
// Esse último ficou escondido justamente porque os testes mockavam o
// próprio window.open, testando a simulação em vez do comportamento real
// do navegador. Tentamos aqui verificar com cy.spy (deixando a chamada
// real acontecer) mas o Cypress roda o app dentro de um iframe da própria
// interface dele e SEMPRE anula window.open, com ou sem noopener — não é
// possível testar essa combinação específica aqui. A verificação real
// contra um navegador de verdade está em playwright/print-window.spec.ts,
// que usa Playwright justamente porque ele suporta abrir/inspecionar
// janelas/abas de verdade, o que o Cypress não suporta.
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

    cy.get("@windowOpen").should("have.been.calledWith", "", "_blank");
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
