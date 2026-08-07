import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import {
  createBudgetBackup,
  parseBudgetBackup,
  createBudgetCsv,
} from "../utils/backup";
import { storageAdapter } from "../storage/storageAdapter";
import { downloadBlob } from "../utils/download";

export function DataManagementPage() {
  const [importStatus, setImportStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = async () => {
    try {
      const data = await storageAdapter.getBudgets();
      if (!data || data.length === 0) {
        alert("Não há orçamentos para exportar.");
        return;
      }
      const backupStr = createBudgetBackup(data);
      const blob = new Blob([backupStr], { type: "application/json" });
      downloadBlob(blob, `orca-rapido-backup-${Date.now()}.json`);
    } catch {
      alert("Erro ao exportar dados.");
    }
  };

  const handleExportCsv = async () => {
    try {
      const data = await storageAdapter.getBudgets();
      if (!data || data.length === 0) {
        alert("Não há orçamentos para exportar.");
        return;
      }
      const csvStr = createBudgetCsv(data);
      const blob = new Blob([csvStr], { type: "text/csv" });
      downloadBlob(blob, `orca-rapido-dados-${Date.now()}.csv`);
    } catch {
      alert("Erro ao exportar dados.");
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(null);
    setPendingImportFile(file);
  };

  const handleCancelImport = () => {
    setPendingImportFile(null);
    resetFileInput();
  };

  const handleConfirmImport = () => {
    const file = pendingImportFile;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedBudgets = parseBudgetBackup(text);

        await storageAdapter.saveBudgets(parsedBudgets);
        setImportStatus({
          message:
            "Importação realizada com sucesso! " +
            parsedBudgets.length +
            " orçamentos recuperados. Recarregue a página caso necessário.",
          type: "success",
        });
      } catch {
        setImportStatus({
          message:
            "Erro ao ler o arquivo. Certifique-se de ser um backup JSON válido do Orça Rápido.",
          type: "error",
        });
      }
    };
    reader.readAsText(file);

    setPendingImportFile(null);
    resetFileInput();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center text-sm font-medium text-slate-400 transition hover:text-slate-300"
      >
        &larr; Voltar ao painel
      </Link>

      <PageHeader
        title="Backup e Dados"
        subtitle="Exporte ou importe seus orçamentos para manter uma cópia segura do histórico local."
      />

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-800 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold text-white">Exportar Dados</h2>
          <p className="mb-6 text-sm leading-6 text-slate-300">
            Baixe seus orçamentos. O formato JSON é para backup e restaurar
            depois. O CSV é útil para planilhas.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => {
                void handleExportJson();
              }}
              variant="primary"
            >
              Backup JSON
            </Button>
            <Button
              onClick={() => {
                void handleExportCsv();
              }}
              variant="secondary"
            >
              Exportar CSV
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-800 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold text-white">Importar Dados</h2>
          <p className="mb-6 text-sm leading-6 text-slate-300">
            Traga seus orçamentos de volta ao sistema do arquivo JSON de backup.{" "}
            <strong className="text-red-400">
              Atenção: A importação irá substituir os orçamentos locais.
            </strong>
          </p>
          <div className="flex flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelected}
              className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-blue-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-300 hover:file:bg-blue-500/20"
            />
            {importStatus && (
              <p
                className={`text-sm font-medium ${importStatus.type === "success" ? "text-emerald-400" : "text-red-400"}`}
              >
                {importStatus.message}
              </p>
            )}
          </div>
        </section>
      </div>

      {pendingImportFile ? (
        <ConfirmationDialog
          title="Substituir histórico local"
          description={`Isso vai substituir TODOS os orçamentos salvos neste navegador pelo conteúdo de "${pendingImportFile.name}". Essa ação não pode ser desfeita. Deseja continuar?`}
          confirmLabel="Importar e substituir"
          onCancel={handleCancelImport}
          onConfirm={handleConfirmImport}
        />
      ) : null}
    </div>
  );
}
