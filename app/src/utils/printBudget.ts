import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { BudgetPreview } from "../components/BudgetPreview";
import type { Budget, MeiProfile } from "../types";

const calculateValidityDays = (budget: Budget): number | undefined => {
  if (!budget.validUntil) {
    return undefined;
  }

  const created = new Date(budget.createdAt).getTime();
  const validUntil = new Date(budget.validUntil).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.round((validUntil - created) / dayMs);

  return days > 0 ? days : undefined;
};

// Clona todas as folhas de estilo do documento atual (tanto <link> de
// produção quanto as <style> que o Vite injeta em dev) pra que a janela de
// impressão, isolada, renderize com exatamente a mesma aparência do
// preview em tela.
const collectStyleTags = (): string =>
  Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join("\n");

// Renderiza de forma síncrona num nó desanexado do documento (React não
// precisa que o container esteja no DOM pra montar) usando o próprio
// react-dom que o app já carrega — evita puxar react-dom/server (pensado
// pra servidor) só pra gerar uma string de HTML, o que inflaria o bundle
// em dezenas de KB pra todo mundo por causa de uma função de impressão.
const renderPreviewHtml = (budget: Budget, profile: MeiProfile): string => {
  const container = document.createElement("div");
  const root = createRoot(container);

  flushSync(() => {
    root.render(
      createElement(BudgetPreview, {
        profile,
        proposalNumber: budget.number,
        createdAt: budget.createdAt,
        validityDays: calculateValidityDays(budget),
        client: budget.client,
        items: budget.items,
        subtotal: budget.totals.subtotal,
        discount: budget.totals.discount,
        total: budget.totals.total,
        showLogo: Boolean(profile.logo),
        showSignature: budget.modules.showSignature,
        showBanner: true,
        paymentTerms: budget.paymentTerms,
        terms: budget.modules.showTerms ? budget.terms : undefined,
      }),
    );
  });

  const html = container.innerHTML;
  root.unmount();
  return html;
};

export const buildBudgetPrintHtml = (
  budget: Budget,
  profile: MeiProfile,
): string => {
  const previewHtml = renderPreviewHtml(budget, profile);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>orcamento-${budget.number}</title>
    ${collectStyleTags()}
    <style>
      @page { size: A4; margin: 0; }
      html, body { margin: 0; background: #ffffff; }
    </style>
  </head>
  <body>${previewHtml}</body>
</html>`;
};

const PRINT_DELAY_MS = 300;

export type OpenPrintWindow = (
  url?: string,
  target?: string,
  features?: string,
) => Window | null;

// Uma janela separada (não um iframe) é essencial: iOS Safari e alguns
// navegadores Android têm uma limitação conhecida onde `iframe.contentWindow
// .print()` imprime a página inteira por trás em vez do conteúdo do
// próprio iframe. Uma aba/janela de verdade não sofre desse problema.
export const printBudget = (
  budget: Budget,
  profile: MeiProfile,
  openWindow: OpenPrintWindow = window.open.bind(window),
): boolean => {
  const printWindow = openWindow("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    return false;
  }

  const html = buildBudgetPrintHtml(budget, profile);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Fecha a janela sozinha depois de imprimir, como boa prática de UX —
  // best-effort: se o navegador não disparar o evento, a janela só fica
  // aberta e o usuário pode fechar manualmente.
  printWindow.addEventListener("afterprint", () => {
    printWindow.close();
  });

  // Atraso fixo em vez de esperar o evento "load": como document.write +
  // close já constroem o documento de forma síncrona, escutar "load" tem
  // uma corrida real — em documentos sem <link> externo (dev, tudo inline)
  // o evento pode disparar antes do listener ser registrado, e o print
  // nunca aconteceria. A folha de estilo de produção é do mesmo domínio e
  // normalmente já está em cache do navegador, então esse atraso é mais
  // que suficiente pra aplicar o layout antes de imprimir.
  window.setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // A janela continua aberta; o usuário pode imprimir manualmente
      // pelo próprio menu do navegador se o disparo automático falhar.
    }
  }, PRINT_DELAY_MS);

  return true;
};
