import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Budget, MeiProfile } from "../../types";
import { ProfilePage } from "../../pages/ProfilePage";
import { fileToBase64, validateLogoFile } from "../../utils/file";

const addProfileMock = jest.fn();
const updateProfileMock = jest.fn();
const deleteProfileMock = jest.fn();
let profiles: MeiProfile[] = [];
let budgets: Budget[] = [];

jest.mock("../../hooks/useProfiles", () => ({
  useProfiles: () => ({
    profiles,
    loading: false,
    error: null,
    addProfile: addProfileMock,
    updateProfile: updateProfileMock,
    deleteProfile: deleteProfileMock,
  }),
}));

jest.mock("../../hooks/useBudget", () => ({
  useBudget: () => ({
    budgets,
    loading: false,
    error: null,
  }),
}));

jest.mock("../../utils/file", () => ({
  fileToBase64: jest.fn(() => "abc"),
  validateLogoFile: jest.fn(() => null),
  MAX_LOGO_SIZE_BYTES: 1_000_000,
}));

const makeProfile = (overrides: Partial<MeiProfile> = {}): MeiProfile => ({
  id: "p1",
  companyName: "Empresa Um",
  userName: "Responsavel",
  phone: "11999999999",
  pixKey: "pix",
  createdAt: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  profiles = [];
  budgets = [];
  jest.clearAllMocks();
  addProfileMock.mockResolvedValue([]);
  updateProfileMock.mockResolvedValue([]);
  deleteProfileMock.mockResolvedValue([]);
});

describe("ProfilePage", () => {
  it("renders an empty state when there are no profiles", () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Nenhuma empresa cadastrada")).toBeInTheDocument();
  });

  it("lists profiles with their budget count and a link to filtered orçamentos", () => {
    profiles = [makeProfile({ id: "p1", companyName: "Maria ME" })];
    budgets = [
      {
        id: "b1",
        number: 1,
        status: "draft",
        createdAt: new Date().toISOString(),
        profileId: "p1",
        client: { name: "Cliente" },
        items: [],
        modules: { showTerms: true, showSignature: true },
        totals: { subtotal: 0, discount: 0, total: 0 },
      },
      {
        id: "b2",
        number: 2,
        status: "draft",
        createdAt: new Date().toISOString(),
        client: { name: "Cliente Sem Perfil" },
        items: [],
        modules: { showTerms: true, showSignature: true },
        totals: { subtotal: 0, discount: 0, total: 0 },
      },
    ];

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Maria ME")).toBeInTheDocument();
    expect(screen.getByText("1 orçamento")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver orçamentos" }),
    ).toHaveAttribute("href", "/dashboard?profileId=p1");
  });

  it("creates a new profile from the form, masking document and phone", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Nova Empresa" }));
    await user.type(screen.getByLabelText("Nome da Empresa"), "Empresa Nova");
    await user.type(screen.getByLabelText("Nome do Profissional"), "Pessoa");
    await user.type(screen.getByLabelText("CPF / CNPJ"), "52998224725");
    await user.type(screen.getByLabelText("WhatsApp / Telefone"), "11988887777");
    await user.click(screen.getByRole("button", { name: "Cadastrar empresa" }));

    expect(addProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: "Empresa Nova",
        userName: "Pessoa",
        document: "529.982.247-25",
        phone: "11988887777",
      }),
    );
  });

  it("shows validation errors for required fields", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Nova Empresa" }));
    await user.click(screen.getByRole("button", { name: "Cadastrar empresa" }));

    expect(
      await screen.findByText("Nome da empresa é obrigatório."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nome do profissional é obrigatório."),
    ).toBeInTheDocument();
    expect(addProfileMock).not.toHaveBeenCalled();
  });

  it("edits an existing profile", async () => {
    profiles = [makeProfile({ id: "p1", companyName: "Empresa Antiga" })];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const nameField = screen.getByLabelText("Nome da Empresa");
    await user.clear(nameField);
    await user.type(nameField, "Empresa Renomeada");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(updateProfileMock).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ companyName: "Empresa Renomeada" }),
    );
  });

  it("uploads a logo and shows the preview", async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Nova Empresa" }));
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      throw new Error("File input not found");
    }
    const file = new File(["hello"], "hello.png", { type: "image/png" });
    await userEvent.upload(input, file);

    expect(fileToBase64).toHaveBeenCalled();
    expect(
      await screen.findByAltText("Pré-visualização da logo"),
    ).toHaveAttribute("src", "abc");
  });

  it("rejects a logo that fails validation", async () => {
    (validateLogoFile as jest.Mock).mockReturnValueOnce(
      "Arquivo muito grande. O tamanho máximo é 1MB.",
    );

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Nova Empresa" }));
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      throw new Error("File input not found");
    }
    const file = new File(["hello"], "hello.png", { type: "image/png" });
    (fileToBase64 as jest.Mock).mockClear();
    await userEvent.upload(input, file);

    expect(
      await screen.findByText("Arquivo muito grande. O tamanho máximo é 1MB."),
    ).toBeInTheDocument();
    expect(fileToBase64).not.toHaveBeenCalled();
  });

  it("navigates back to the dashboard", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard" element={<div>Painel</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(await screen.findByText("Painel")).toBeInTheDocument();
  });

  it("cancels the delete confirmation without deleting", async () => {
    profiles = [makeProfile({ id: "p1", companyName: "Empresa Mantida" })];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteProfileMock).not.toHaveBeenCalled();
  });

  it("deletes a profile after confirmation", async () => {
    profiles = [makeProfile({ id: "p1", companyName: "Empresa Para Excluir" })];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Confirmar" }));

    expect(deleteProfileMock).toHaveBeenCalledWith("p1");
  });
});
