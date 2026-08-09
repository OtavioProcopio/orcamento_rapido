import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Budget, MeiProfile } from "../../types";
import { BudgetPage } from "../../pages/BudgetPage";

const navigateMock = jest.fn();
const addBudgetMock = jest.fn();
const updateBudgetMock = jest.fn();

let budgets: Budget[] = [];
let profiles: MeiProfile[] = [
  {
    id: "profile-qa",
    companyName: "Empresa QA",
    userName: "Responsavel QA",
    phone: "11999999999",
    pixKey: "",
    createdAt: new Date().toISOString(),
  },
];

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
    loading: false,
    error: null,
    addBudget: addBudgetMock,
    updateBudget: updateBudgetMock,
  }),
}));

jest.mock("../../hooks/useProfiles", () => ({
  useProfiles: () => ({
    profiles,
    loading: false,
    error: null,
  }),
}));

const existingBudget: Budget = {
  id: "existing-1",
  number: 10,
  status: "sent",
  createdAt: "2026-05-01T12:00:00.000Z",
  validUntil: "2026-05-08T12:00:00.000Z",
  profileId: "profile-qa",
  client: {
    name: "Cliente Existente",
    document: "529.982.247-25",
    email: "cliente@existente.com",
    phone: "(11) 98888-7777",
    address: "Rua Existente, 1",
  },
  items: [
    {
      id: "item-1",
      descricao: "Item existente",
      quantidade: 3,
      unidade: "UN",
      valorUnitario: 40,
    },
  ],
  terms: "Garantia de 90 dias",
  paymentTerms: "PIX à vista",
  discount: 20,
  modules: { showTerms: true, showSignature: true },
  totals: { subtotal: 120, discount: 20, total: 100 },
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <BudgetPage />
    </MemoryRouter>,
  );

describe("BudgetPage edit/duplicate flows", () => {
  beforeEach(() => {
    budgets = [existingBudget];
    profiles = [
      {
        id: "profile-qa",
        companyName: "Empresa QA",
        userName: "Responsavel QA",
        phone: "11999999999",
        pixKey: "",
        createdAt: new Date().toISOString(),
      },
    ];
    navigateMock.mockReset();
    addBudgetMock.mockReset();
    updateBudgetMock.mockReset();
    updateBudgetMock.mockResolvedValue([existingBudget]);
    addBudgetMock.mockResolvedValue([existingBudget]);
  });

  it("preloads an existing budget when editing via ?edit=id and updates it on save", async () => {
    const user = userEvent.setup();
    renderAt("/builder?edit=existing-1");

    expect(await screen.findByDisplayValue("Cliente Existente")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    await waitFor(() => expect(updateBudgetMock).toHaveBeenCalledTimes(1));
    expect(updateBudgetMock).toHaveBeenCalledWith(
      "existing-1",
      expect.objectContaining({ id: "existing-1", number: 10 }),
    );
    expect(addBudgetMock).not.toHaveBeenCalled();
  });

  it("preloads and assigns a new number when duplicating via ?duplicate=id", async () => {
    renderAt("/builder?duplicate=existing-1");

    expect(await screen.findByDisplayValue("Cliente Existente")).toBeInTheDocument();
    // Próximo número sugerido = maior número existente (10) + 1.
    expect(screen.getByDisplayValue("11")).toBeInTheDocument();
  });

  it("shows an error when the edited budget id is not found", async () => {
    renderAt("/builder?edit=does-not-exist");

    expect(
      await screen.findByText("Orçamento não encontrado no histórico."),
    ).toBeInTheDocument();
  });

  it("navigates to /profile from the missing-profile warning banner", async () => {
    profiles = [];
    const user = userEvent.setup();
    renderAt("/builder");

    await user.click(
      await screen.findByRole("button", { name: "Ir para Perfil" }),
    );

    expect(navigateMock).toHaveBeenCalledWith("/profile");
  });

  it("adds a new item row when clicking 'Adicionar Novo Item'", async () => {
    const user = userEvent.setup();
    renderAt("/builder");

    await user.click(screen.getByRole("button", { name: /2\. Itens e Valores/i }));
    expect(screen.getAllByText(/^Item \d$/)).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /Adicionar Novo Item/i }));

    expect(screen.getAllByText(/^Item \d$/)).toHaveLength(2);
  });

  it("does not scramble digits when clearing and retyping quantity/value (regression)", async () => {
    const user = userEvent.setup();
    renderAt("/builder");

    await user.click(screen.getByRole("button", { name: /2\. Itens e Valores/i }));
    const quantityInput = screen.getByRole("spinbutton", { name: /Qtd\./i });
    const unitPriceInput = screen.getByRole("spinbutton", {
      name: /Valor Unitário/i,
    });

    await user.clear(quantityInput);
    await user.type(quantityInput, "2");
    await user.clear(unitPriceInput);
    await user.type(unitPriceInput, "50");

    expect(quantityInput).toHaveValue(2);
    expect(unitPriceInput).toHaveValue(50);
    expect(screen.getByText("TOTAL GERAL").parentElement).toHaveTextContent(
      "100,00",
    );
  });

  it("asks for confirmation before leaving with unsaved changes and respects cancel", async () => {
    const user = userEvent.setup();
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);
    renderAt("/builder");

    await user.type(
      screen.getByRole("textbox", { name: /Nome do Cliente/i }),
      "Rascunho",
    );
    await user.click(screen.getByRole("button", { name: /Voltar/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalledWith("/dashboard");

    confirmSpy.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: /Voltar/i }));
    expect(navigateMock).toHaveBeenCalledWith("/dashboard");

    confirmSpy.mockRestore();
  });

  it("navigates back without confirmation when there are no unsaved changes", async () => {
    const user = userEvent.setup();
    const confirmSpy = jest.spyOn(window, "confirm");
    renderAt("/builder");

    await user.click(screen.getByRole("button", { name: /Voltar/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
    confirmSpy.mockRestore();
  });

  it("warns the browser via beforeunload when there are unsaved changes", async () => {
    const user = userEvent.setup();
    renderAt("/builder");

    await user.type(
      screen.getByRole("textbox", { name: /Nome do Cliente/i }),
      "Rascunho",
    );

    const event = new Event("beforeunload", { cancelable: true }) as BeforeUnloadEvent;
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
