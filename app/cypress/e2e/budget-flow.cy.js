describe("Orca Rapido flow", () => {
  it("validates profile, budget builder, history print and deletion", () => {
    cy.visit("/");

    // Sem perfil/orçamentos salvos, o CTA da Landing leva direto para o
    // cadastro do perfil (ver ctaTarget em LandingPage.tsx).
    cy.get("[data-testid='landing-cta']").click();
    cy.contains("Dados usados nos orçamentos").should("be.visible");
    cy.contains("Nome da Empresa").find("input").type("Empresa Teste");
    cy.contains("Nome do Profissional").find("input").type("Profissional Teste");
    cy.contains("WhatsApp / Telefone").find("input").type("11999999999");
    cy.contains("Chave Pix").find("input").type("pix@teste.com");
    cy.contains("Salvar Perfil").click();
    cy.contains("Salvo com sucesso.").should("be.visible");
    cy.screenshot("01-perfil-salvo");

    cy.contains("Voltar").click();
    cy.contains("Novo Orçamento").click();
    cy.contains("Construtor de Orçamento").should("be.visible");

    cy.get("input[name='proposalNumber']").type("123");
    cy.get("input[name='clientName']").type("Cliente A");
    cy.get("input[name='clientDocument']").type("52998224725");
    cy.get("input[name='clientEmail']").type("cliente@teste.com");
    cy.get("input[name='clientAddress']").type("Rua Teste, 100");
    cy.get("input[name='clientPhone']").type("11988887777");

    cy.contains("2. Itens e Valores").click();
    cy.get("input[name='items.0.descricao']").type("Servico");
    cy.get("input[name='items.0.quantidade']").clear().type("2");
    cy.get("input[name='items.0.valorUnitario']").clear().type("50");
    cy.contains("TOTAL GERAL").parent().should("contain", "100,00");
    cy.screenshot("02-orcamento-preenchido");

    cy.contains("Configurações do Documento").click();
    cy.contains("Condições de Pagamento").click();
    cy.contains("Detalhes (PIX, parcelas, etc)")
      .parent()
      .find("textarea")
      .type("PIX na entrega");
    cy.contains("Observações e Termos de Garantia").click();
    cy.contains("Regras de negócio")
      .parent()
      .find("textarea")
      .type("Garantia de 30 dias.");

    cy.contains("Salvar Orçamento").click();
    cy.contains("Meu Painel", { timeout: 15000 }).should("be.visible");
    cy.contains("Cliente A").should("be.visible");

    cy.contains("CPF/CNPJ: 529.982.247-25").should("be.visible");
    cy.contains("Email: cliente@teste.com").should("be.visible");
    cy.contains("Endereço: Rua Teste, 100").should("be.visible");
    cy.contains("WhatsApp: (11) 98888-7777").should("be.visible");
    cy.contains("Servico").should("be.visible");
    cy.contains("PIX na entrega").should("be.visible");
    cy.screenshot("03-dashboard-com-orcamento");

    // A impressão abre uma janela separada (window.open) com o conteúdo do
    // orçamento — espiona a chamada pra confirmar que o mecanismo foi
    // acionado com o conteúdo certo, sem abrir uma janela de verdade.
    cy.window().then((win) => {
      const fakePrintWindow = {
        document: { open: cy.stub(), write: cy.stub().as("printWrite"), close: cy.stub() },
        focus: cy.stub(),
        print: cy.stub(),
        addEventListener: cy.stub(),
      };
      cy.stub(win, "open").returns(fakePrintWindow);
    });
    cy.contains("Imprimir / Salvar PDF").click();
    cy.get("@printWrite").should(($write) => {
      expect($write.args[0][0]).to.contain("Cliente A");
    });

    cy.contains("Excluir").click();
    cy.contains("Confirmar").click();
    cy.contains("Nenhum orçamento ainda").should("be.visible");
    cy.screenshot("04-historico-vazio-apos-exclusao");
  });
});
