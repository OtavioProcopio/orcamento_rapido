import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomePage } from "../../pages/HomePage";
import { LegalPage } from "../../pages/LegalPage";

jest.mock("../../hooks/useBudget", () => ({
  useBudget: () => ({
    budgets: [],
    loading: false,
    error: null,
    clearBudgets: jest.fn(),
    deleteBudget: jest.fn(),
    replaceBudgets: jest.fn(),
  }),
}));

jest.mock("../../hooks/useProfile", () => ({
  useProfile: () => ({
    profile: null,
    loading: false,
    error: null,
  }),
}));

describe("basic accessibility checks", () => {
  it("renders legal pages with reachable headings", () => {
    render(
      <MemoryRouter>
        <LegalPage type="privacy" />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Política de Privacidade" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar" })).toBeInTheDocument();
  });

  it("uses an accessible modal for destructive actions", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Resetar Orçamentos" }));

    const dialog = screen.getByRole("dialog", { name: "Resetar histórico" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
  });
});
