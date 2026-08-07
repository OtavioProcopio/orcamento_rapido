import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfilePage } from "../../pages/ProfilePage";
import { fileToBase64 } from "../../utils/file";

const PROFILE_KEY = "@OrcaRapido:mei_profile";
const navigateMock = jest.fn();

jest.mock("react-router-dom", () => {
  const actual: typeof import("react-router-dom") =
    jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

jest.mock("../../utils/file", () => ({
  fileToBase64: jest.fn(() => "abc"),
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("navigates back to the dashboard", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("validates required fields", async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Salvar Perfil" }),
    );

    expect(
      await screen.findByText("Nome da empresa é obrigatório."),
    ).toBeInTheDocument();
    expect(screen.getByText("WhatsApp/Telefone é obrigatório.")).toBeInTheDocument();
  });

  it("saves profile to storage", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Nome da Empresa"), "Empresa");
    await user.type(screen.getByLabelText("CPF / CNPJ"), "52998224725");
    await user.type(screen.getByLabelText("Nome do Profissional"), "Pessoa");
    await user.type(
      screen.getByLabelText("WhatsApp / Telefone"),
      "11999999999",
    );

    await user.click(screen.getByRole("button", { name: "Salvar Perfil" }));

    await waitFor(() => {
      const saved = localStorage.getItem(PROFILE_KEY);
      expect(saved).toContain("Empresa");
      expect(saved).toContain("529.982.247-25");
    });

    expect(await screen.findByText("Salvo com sucesso.")).toBeInTheDocument();
  });

  it("handles file select", async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      throw new Error("File input not found");
    }
    const file = new File(["hello"], "hello.png", { type: "image/png" });
    await userEvent.upload(input, file);
    await waitFor(() => {
      expect(fileToBase64).toHaveBeenCalled();
    });
    expect(await screen.findByAltText("Pré-visualização da logo")).toHaveAttribute(
      "src",
      "abc",
    );
  });

  it("clears the logo preview when the file selection is cancelled", async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      throw new Error("File input not found");
    }
    const file = new File(["hello"], "hello.png", { type: "image/png" });
    await userEvent.upload(input, file);
    expect(
      await screen.findByAltText("Pré-visualização da logo"),
    ).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [] } });

    await waitFor(() => {
      expect(
        screen.queryByAltText("Pré-visualização da logo"),
      ).not.toBeInTheDocument();
    });
  });
});
