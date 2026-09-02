import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { usePageMetadata } from "../../../src/hooks/usePageMetadata";

const renderAt = (path: string, metadata: { title: string; description: string }) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  );
  return renderHook(() => usePageMetadata(metadata), { wrapper });
};

describe("usePageMetadata", () => {
  const originalBasename = __APP_BASENAME__;

  beforeEach(() => {
    document.title = "";
    document
      .querySelectorAll('meta[name="description"], link[rel="canonical"]')
      .forEach((tag) => tag.remove());
    // jest.config.cjs fixa __APP_BASENAME__ como "/" (o padrão de dev do
    // vite.config.ts) — os testes de canonical simulam o basename real do
    // deploy de produção (VITE_APP_BASE="/orcamento_rapido/"), que é o
    // cenário que a URL canônica realmente precisa acertar.
    (globalThis as unknown as { __APP_BASENAME__: string }).__APP_BASENAME__ =
      "/orcamento_rapido/";
  });

  afterEach(() => {
    (globalThis as unknown as { __APP_BASENAME__: string }).__APP_BASENAME__ =
      originalBasename;
  });

  it("sets document.title when the hook mounts", () => {
    // Arrange & Act
    renderAt("/dashboard", {
      title: "Meus orçamentos — Orça Rápido",
      description: "Veja e gerencie seus orçamentos.",
    });

    // Assert
    expect(document.title).toBe("Meus orçamentos — Orça Rápido");
  });

  it("creates the meta description tag when it does not exist yet", () => {
    // Arrange & Act
    renderAt("/dashboard", {
      title: "Meus orçamentos — Orça Rápido",
      description: "Veja e gerencie seus orçamentos.",
    });

    // Assert
    const tag = document.querySelector('meta[name="description"]');
    expect(tag).not.toBeNull();
    expect(tag?.getAttribute("content")).toBe("Veja e gerencie seus orçamentos.");
  });

  it("updates the existing meta description tag instead of duplicating it", () => {
    // Arrange
    const existing = document.createElement("meta");
    existing.setAttribute("name", "description");
    existing.setAttribute("content", "descrição antiga");
    document.head.appendChild(existing);

    // Act
    renderAt("/dashboard", {
      title: "Meus orçamentos — Orça Rápido",
      description: "Veja e gerencie seus orçamentos.",
    });

    // Assert
    const tags = document.querySelectorAll('meta[name="description"]');
    expect(tags).toHaveLength(1);
    expect(tags[0].getAttribute("content")).toBe("Veja e gerencie seus orçamentos.");
  });

  it("creates a canonical link pointing to the absolute URL of the current route", () => {
    // Arrange & Act
    renderAt("/dashboard", {
      title: "Meus orçamentos — Orça Rápido",
      description: "Veja e gerencie seus orçamentos.",
    });

    // Assert
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute("href")).toBe(
      "https://otavioprocopio.github.io/orcamento_rapido/dashboard",
    );
  });

  it("points the canonical link to the site root when the route is the home page", () => {
    // Arrange & Act
    renderAt("/", {
      title: "Orça Rápido",
      description: "Orçamentos profissionais para MEIs e autônomos.",
    });

    // Assert
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute("href")).toBe(
      "https://otavioprocopio.github.io/orcamento_rapido/",
    );
  });

  it("updates title, description and canonical again when the metadata prop changes", () => {
    // Arrange
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={["/dashboard"]}>{children}</MemoryRouter>
    );
    const { rerender } = renderHook(
      ({ title, description }: { title: string; description: string }) =>
        usePageMetadata({ title, description }),
      {
        wrapper,
        initialProps: {
          title: "Meus orçamentos — Orça Rápido",
          description: "Veja e gerencie seus orçamentos.",
        },
      },
    );

    // Act
    rerender({
      title: "Funil de vendas — Orça Rápido",
      description: "Acompanhe seus orçamentos por etapa.",
    });

    // Assert
    expect(document.title).toBe("Funil de vendas — Orça Rápido");
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute("content"),
    ).toBe("Acompanhe seus orçamentos por etapa.");
  });
});
