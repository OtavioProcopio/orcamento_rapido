import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataManagementPage } from "../../pages/DataManagementPage";
import { storageAdapter } from "../../storage/storageAdapter";
import {
  createBudgetBackup,
  createBudgetCsv,
  parseBudgetBackup,
} from "../../utils/backup";
import { downloadBlob } from "../../utils/download";
import type { Budget } from "../../types";

jest.mock("../../storage/storageAdapter", () => ({
  storageAdapter: {
    getBudgets: jest.fn(),
    saveBudgets: jest.fn(),
  },
}));

jest.mock("../../utils/backup", () => ({
  createBudgetBackup: jest.fn(() => '{"app":"orca-rapido"}'),
  parseBudgetBackup: jest.fn(() => [
    {
      id: "imported-budget",
      number: 7,
      status: "draft",
      createdAt: "2026-05-09T00:00:00.000Z",
      client: { name: "Importado" },
      items: [],
      modules: { showTerms: true, showSignature: true, removeAds: false },
      totals: { subtotal: 0, discount: 0, total: 0 },
    },
  ]),
  createBudgetCsv: jest.fn(() => "numero,status\n1,draft"),
}));

jest.mock("../../utils/download", () => ({
  downloadBlob: jest.fn(),
}));

const storageAdapterMock = jest.mocked(storageAdapter);
const createBudgetBackupMock = jest.mocked(createBudgetBackup);
const createBudgetCsvMock = jest.mocked(createBudgetCsv);
const parseBudgetBackupMock = jest.mocked(parseBudgetBackup);
const downloadBlobMock = jest.mocked(downloadBlob);

const budgets: Budget[] = [
  {
    id: "budget-1",
    number: 1,
    status: "draft",
    createdAt: "2026-05-09T00:00:00.000Z",
    client: { name: "Cliente" },
    items: [],
    modules: { showTerms: true, showSignature: true, removeAds: false },
    totals: { subtotal: 100, discount: 0, total: 100 },
  },
];

class FileReaderMock {
  result: string | ArrayBuffer | null = null;

  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsText = jest.fn((file: Blob & { __content?: string }) => {
    const text = file.__content ?? "";
    this.result = text;
    this.onload?.({
      target: { result: text },
    } as ProgressEvent<FileReader>);
  });
}

describe("DataManagementPage", () => {
  const alertMock = jest.spyOn(window, "alert").mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    storageAdapterMock.getBudgets.mockResolvedValue(budgets);
    storageAdapterMock.saveBudgets.mockResolvedValue();
    Object.defineProperty(window, "FileReader", {
      writable: true,
      value: FileReaderMock,
    });
  });

  afterAll(() => {
    alertMock.mockRestore();
  });

  it("exports JSON backup when budgets exist", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DataManagementPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Backup JSON" }));

    expect(createBudgetBackupMock).toHaveBeenCalledWith(budgets);
    expect(downloadBlobMock).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^orca-rapido-backup-/),
    );
  });

  it("exports CSV when budgets exist", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DataManagementPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Exportar CSV" }));

    expect(createBudgetCsvMock).toHaveBeenCalledWith(budgets);
    expect(downloadBlobMock).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^orca-rapido-dados-/),
    );
  });

  it("alerts when there is no data to export", async () => {
    storageAdapterMock.getBudgets.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DataManagementPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Backup JSON" }));

    expect(alertMock).toHaveBeenCalledWith("Não há orçamentos para exportar.");
    expect(downloadBlobMock).not.toHaveBeenCalled();
  });

  it("shows an error alert when export fails", async () => {
    storageAdapterMock.getBudgets.mockRejectedValueOnce(new Error("read failed"));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DataManagementPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Exportar CSV" }));

    expect(alertMock).toHaveBeenCalledWith("Erro ao exportar dados.");
  });

  it("imports valid backup files", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <DataManagementPage />
      </MemoryRouter>,
    );

    const input = container.querySelector("input[type='file']") as HTMLInputElement | null;
    if (!input) {
      throw new Error("Import input not found");
    }

    const file = new File(
      ['{"budgets":[{"id":"imported-budget"}]}'],
      "backup.json",
      { type: "application/json" },
    ) as File & { __content?: string };
    file.__content = '{"budgets":[{"id":"imported-budget"}]}';
    await user.upload(input, file);

    await waitFor(() => {
      expect(storageAdapterMock.saveBudgets.mock.calls.length).toBeGreaterThan(0);
    });
    expect(
      await screen.findByText(/Importação realizada com sucesso!/),
    ).toBeInTheDocument();
  });

  it("shows import error for invalid files", async () => {
    parseBudgetBackupMock.mockImplementationOnce(() => {
      throw new Error("invalid");
    });
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <DataManagementPage />
      </MemoryRouter>,
    );

    const input = container.querySelector("input[type='file']") as HTMLInputElement | null;
    if (!input) {
      throw new Error("Import input not found");
    }

    const file = new File(["invalid"], "backup.json", {
      type: "application/json",
    }) as File & { __content?: string };
    file.__content = "invalid";
    await user.upload(input, file);

    expect(
      await screen.findByText(/Erro ao ler o arquivo/),
    ).toBeInTheDocument();
  });
});
