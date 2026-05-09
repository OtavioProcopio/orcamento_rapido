import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingPage } from "../../pages/LandingPage";
import type { Budget, MeiProfile } from "../../types";

const navigateMock = jest.fn();

let budgets: Budget[] = [];
let profile: MeiProfile | null = null;
let budgetsLoading = false;
let profileLoading = false;

jest.mock("react-router-dom", () => {
  const actual: typeof import("react-router-dom") =
    jest.requireActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

jest.mock("../../hooks/useBudget", () => ({
  useBudget: () => ({
    budgets,
    loading: budgetsLoading,
    error: null,
  }),
}));

jest.mock("../../hooks/useProfile", () => ({
  useProfile: () => ({
    profile,
    loading: profileLoading,
    error: null,
  }),
}));

describe("LandingPage", () => {
  beforeEach(() => {
    budgets = [];
    profile = null;
    budgetsLoading = false;
    profileLoading = false;
    navigateMock.mockReset();
  });

  it("routes first-time users to company profile setup", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Começar a usar" }));

    expect(navigateMock).toHaveBeenCalledWith("/profile");
  });

  it("routes returning users with history to dashboard", async () => {
    const user = userEvent.setup();
    budgets = [
      {
        id: "budget-1",
        number: 1,
        status: "draft",
        createdAt: "2026-05-09T00:00:00.000Z",
        client: { name: "Cliente" },
        items: [],
        modules: { showTerms: true, showSignature: true, removeAds: false },
        totals: { subtotal: 0, discount: 0, total: 0 },
      },
    ];

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Começar a usar" }));

    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("shows security and usage guidance", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Segurança e LGPD/i)).toBeInTheDocument();
    expect(screen.getByText(/Como funciona/i)).toBeInTheDocument();
    expect(screen.getByText(/Os dados operacionais ficam armazenados localmente/i)).toBeInTheDocument();
  });
});
