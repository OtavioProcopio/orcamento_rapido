// app/src/utils/download.ts

export const downloadBlob = (blob: globalThis.Blob, filename: string) => {
  // 1. Cria uma URL temporária na memória do navegador para o PDF
  const url = window.URL.createObjectURL(blob);

  // 2. Cria uma tag <a> invisível no HTML
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // 3. Simula um clique de mouse nesse link invisível
  document.body.appendChild(link);
  link.click();

  // 4. Limpa a sujeira
  document.body.removeChild(link);
  // Alguns navegadores podem não ter iniciado o download ainda se revogarmos
  // imediatamente.
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export const downloadUrl = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
