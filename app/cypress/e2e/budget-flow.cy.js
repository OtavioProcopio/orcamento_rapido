describe("Orca Rapido flow", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.then(() => {
      return new Cypress.Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase("orca-rapido");
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => resolve();
      });
    });
  });

  it("validates profile, budget builder, history print and deletion", () => {
    cy.visit("/");

    cy.contains("Entrar no painel").click();
    cy.contains("Meu Painel").should("be.visible");

    cy.contains("Configurações / Perfil").click();
    cy.contains("Dados usados nos orçamentos").should("be.visible");
    cy.contains("Nome da Empresa").find("input").type("Empresa Teste");
    cy.contains("Nome do Profissional").find("input").type("Profissional Teste");
    cy.contains("WhatsApp / Telefone").find("input").type("11999999999");
    cy.contains("Chave Pix").find("input").type("pix@teste.com");
    cy.contains("Salvar Perfil").click();
    cy.contains("Salvo com sucesso.").should("be.visible");

    cy.contains("Voltar").click();
    cy.contains("Novo Orçamento").click();
    cy.contains("Construtor de Orçamento").should("be.visible");

    cy.get("input[name='proposalNumber']").type("123");
    cy.get("input[name='clientName']").type("Cliente A");
    cy.get("input[name='clientDocument']").type("52998224725");
    cy.get("input[name='clientEmail']").type("cliente@teste.com");
    cy.get("input[name='clientAddress']").type("Rua Teste, 100");
    cy.get("input[name='clientPhone']").type("11988887777");

    cy.get("input[name='items.0.descricao']").type("Servico");
    cy.get("input[name='items.0.quantidade']").clear().type("2");
    cy.get("input[name='items.0.valorUnitario']").clear().type("50");
    cy.contains("TOTAL GERAL").parent().should("contain", "100,00");

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

    cy.window().then((win) => {
      cy.stub(win, "print").as("print");
    });
    cy.contains("Imprimir / Salvar PDF").click();
    cy.contains("TOTAL GERAL").should("exist");
    cy.get("@print").should("have.been.called");

    cy.contains("Excluir").click();
    cy.contains("Confirmar").click();
    cy.contains("Nenhum orçamento ainda").should("be.visible");
  });
});
