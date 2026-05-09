import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Budget } from "../../types";
import { BudgetPage } from "../../pages/BudgetPage";

const navigateMock = jest.fn();
const addBudgetMock = jest.fn();
const updateBudgetMock = jest.fn();

let budgets: Budget[] = [];

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

jest.mock("../../hooks/useProfile", () => ({
  useProfile: () => ({
    profile: null,
    loading: false,
    error: null,
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <BudgetPage />
    </MemoryRouter>,
  );

const fillRequiredFields = async () => {
  const user = userEvent.setup();

  await user.type(screen.getByRole("textbox", { name: /Nome do Cliente/i }), "Cliente QA");
  await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
  await user.type(
    screen.getByPlaceholderText("Ex: Desenvolvimento de Site"),
    "Servico essencial",
  );

  return user;
};

describe("BudgetPage validation flows", () => {
  beforeEach(() => {
    budgets = [];
    navigateMock.mockReset();
    addBudgetMock.mockReset();
    updateBudgetMock.mockReset();
    jest.restoreAllMocks();
    jest.spyOn(global.Date, "now").mockReturnValue(
      new Date("2026-05-08T12:00:00.000Z").getTime(),
    );
  });

  it("blocks saving when no client is selected", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    expect(
      await screen.findByText("Nome do cliente é obrigatório."),
    ).toBeInTheDocument();
    expect(addBudgetMock).not.toHaveBeenCalled();
    expect(updateBudgetMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("blocks saving when quantity is zero", async () => {
    const user = userEvent.setup();
    renderPage();

    await fillRequiredFields();
    const quantityInput = screen.getByRole("spinbutton", { name: /Qtd\./i });
    await user.clear(quantityInput);
    await user.type(quantityInput, "0");
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    expect(
      await screen.findByText("Quantidade deve ser maior que 0."),
    ).toBeInTheDocument();
    expect(addBudgetMock).not.toHaveBeenCalled();
  });

  it("blocks saving when unit value is negative", async () => {
    const user = userEvent.setup();
    renderPage();

    await fillRequiredFields();
    const unitPriceInput = screen.getByRole("spinbutton", {
      name: /Valor Unitário/i,
    });
    fireEvent.change(unitPriceInput, { target: { value: "-5" } });
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    expect(
      await screen.findByText("Valor não pode ser negativo."),
    ).toBeInTheDocument();
    expect(addBudgetMock).not.toHaveBeenCalled();
  });

  it("blocks saving when discount exceeds subtotal", async () => {
    const user = userEvent.setup();
    renderPage();

    await fillRequiredFields();
    const unitPriceInput = screen.getByRole("spinbutton", {
      name: /Valor Unitário/i,
    });
    await user.clear(unitPriceInput);
    await user.type(unitPriceInput, "100");

    await user.click(screen.getByRole("button", { name: /3. Configurações do Documento/i }));
    await user.click(screen.getByRole("checkbox", { name: /Aplicar Desconto/i }));

    const discountInput = screen.getByRole("spinbutton", {
      name: /Valor do Desconto/i,
    });
    await user.clear(discountInput);
    await user.type(discountInput, "150");
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));
    await user.click(screen.getByRole("button", { name: /3. Configurações do Documento/i }));

    expect(
      await screen.findByText("Desconto não pode ser maior que o subtotal."),
    ).toBeInTheDocument();
    expect(addBudgetMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("blocks saving when all items are removed", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole("textbox", { name: /Nome do Cliente/i }), "Cliente QA");
    await user.click(screen.getByRole("button", { name: /2. Itens e Valores/i }));
    await user.click(screen.getByTitle("Remover item"));
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    expect(
      await screen.findByText("Revise os campos destacados antes de salvar."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nenhum item adicionado ao orçamento."),
    ).toBeInTheDocument();
    expect(addBudgetMock).not.toHaveBeenCalled();
  });

  it("keeps zero unit value as a valid free item and saves with total zero", async () => {
    const user = userEvent.setup();
    renderPage();

    await fillRequiredFields();
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    await waitFor(() => expect(addBudgetMock).toHaveBeenCalledTimes(1));
    expect(addBudgetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        client: expect.objectContaining({ name: "Cliente QA" }),
        totals: expect.objectContaining({
          subtotal: 0,
          discount: 0,
          total: 0,
        }),
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("shows a user-facing error when saving fails", async () => {
    addBudgetMock.mockRejectedValueOnce(new Error("storage failed"));
    const user = userEvent.setup();
    renderPage();

    await fillRequiredFields();
    await user.click(screen.getByRole("button", { name: /Salvar Orçamento/i }));

    expect(
      await screen.findByText("Não foi possível salvar o orçamento."),
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Salvar Orçamento/i }),
      ).toBeEnabled(),
    );
  });
});
