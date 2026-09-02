import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { LegalPage } from "../../../src/pages/LegalPage";

describe("LegalPage", () => {
  it("renders the privacy policy content and its own title/description", () => {
    // Arrange & Act
    render(
      <MemoryRouter>
        <LegalPage type="privacy" />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByText("Política de Privacidade")).toBeInTheDocument();
    expect(document.title).toBe("Política de Privacidade — Orça Rápido");
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute("content"),
    ).toBeTruthy();
  });

  it("renders the terms of use content and its own title/description", () => {
    // Arrange & Act
    render(
      <MemoryRouter>
        <LegalPage type="terms" />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByText("Termos de Uso")).toBeInTheDocument();
    expect(document.title).toBe("Termos de Uso — Orça Rápido");
  });

  it("renders the local storage notice content and its own title/description", () => {
    // Arrange & Act
    render(
      <MemoryRouter>
        <LegalPage type="storage" />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByText("Aviso de Armazenamento Local")).toBeInTheDocument();
    expect(document.title).toBe("Aviso de Armazenamento Local — Orça Rápido");
  });

  it("links back to the dashboard", () => {
    // Arrange & Act
    render(
      <MemoryRouter>
        <LegalPage type="privacy" />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
