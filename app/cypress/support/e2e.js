beforeEach(() => {
  cy.window().then((win) => {
    win.localStorage.clear();
  });
  cy.then(() => {
    return new Cypress.Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase("orca-rapido");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
  });
});

// Preenche o perfil diretamente via localStorage (fallback usado antes da
// migração para IndexedDB) para specs que não testam o cadastro em si e só
// precisam de um perfil válido já configurado.
Cypress.Commands.add("seedProfile", () => {
  cy.window().then((win) => {
    win.localStorage.setItem(
      "@OrcaRapido:mei_profile",
      JSON.stringify({
        companyName: "Empresa Seed",
        userName: "Responsavel Seed",
        phone: "11999999999",
        pixKey: "pix@seed.com",
      }),
    );
  });
});

// Assume que a página já está em /builder. Preenche o mínimo necessário
// para um orçamento válido e salva.
Cypress.Commands.add(
  "createBudget",
  ({ clientName, description = "Servico", value = 100 } = {}) => {
    cy.get("input[name='clientName']").type(clientName);
    cy.contains("2. Itens e Valores").click();
    cy.get("input[name='items.0.descricao']").type(description);
    cy.get("input[name='items.0.valorUnitario']").clear().type(String(value));
    cy.contains("Salvar Orçamento").click();
    cy.contains("Meu Painel", { timeout: 15000 }).should("be.visible");
  },
);
