describe("Budget builder responsive layout", () => {
  it("allows reaching the end of the form and the end of the preview by scrolling on a mobile viewport", () => {
    cy.viewport(390, 844);
    cy.seedProfile();
    cy.visit("/builder");

    // Última seção do formulário — antes da correção do grid mobile
    // (BudgetPage.tsx), este trecho ficava cortado pelo overflow-hidden
    // do contêiner pai em telas de smartphone. force:true só ignora o
    // cabeçalho sticky cobrindo o topo do botão — não é o que este teste
    // verifica; o que importa é o conteúdo que o clique revela, abaixo.
    cy.contains("3. Configurações do Documento").click({ force: true });
    cy.contains(/Vazio: mostra o rodapé padrão/i)
      .scrollIntoView()
      .should("be.visible");

    // Fim do preview do orçamento, depois do fim do formulário no fluxo
    // de rolagem da página.
    cy.scrollTo("bottom");
    cy.contains("TOTAL GERAL").should("be.visible");
  });

  it("keeps the two-column side-by-side layout on desktop", () => {
    cy.viewport(1280, 800);
    cy.seedProfile();
    cy.visit("/builder");

    // Em desktop, formulário e preview ficam lado a lado: os dois
    // aparecem visíveis ao mesmo tempo, sem precisar rolar a página.
    cy.get("input[name='clientName']").should("be.visible");
    cy.contains("Nome da empresa").should("be.visible");
  });
});
