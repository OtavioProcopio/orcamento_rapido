describe("LGPD / legal pages", () => {
  it("links to privacy, terms and storage notice from the landing page footer", () => {
    cy.visit("/");

    cy.contains("a", "Política de privacidade").click();
    cy.contains("Política de Privacidade").should("be.visible");
    cy.contains("IndexedDB").should("be.visible");

    cy.visit("/");
    cy.contains("a", "Termos de uso").click();
    cy.contains("Termos de Uso").should("be.visible");

    cy.visit("/");
    cy.contains("a", "Aviso de armazenamento local").click();
    cy.contains("Aviso de Armazenamento Local").should("be.visible");
  });

  it("links to the same legal pages from the dashboard footer", () => {
    cy.seedProfile();
    cy.visit("/dashboard");

    cy.contains("a", "Política de privacidade").should(
      "have.attr",
      "href",
      "/privacy",
    );
    cy.contains("a", "Termos de uso").should("have.attr", "href", "/terms");
    cy.contains("a", "Aviso de armazenamento local").should(
      "have.attr",
      "href",
      "/storage-notice",
    );
  });

  it("redirects unknown routes back to the landing page", () => {
    cy.visit("/uma-rota-que-nao-existe");
    cy.get("[data-testid='landing-cta']").should("be.visible");
  });
});
