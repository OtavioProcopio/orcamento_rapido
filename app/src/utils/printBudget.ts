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

// Em produção o CSS vem de um <link rel="stylesheet"> externo. Clonar essa
// tag literalmente faria a janela de impressão precisar buscar o arquivo
// de novo pela rede antes de conseguir renderizar — em conexão lenta
// (típico em mobile) isso corre contra o atraso fixo antes do print() e
// pode disparar a impressão num documento ainda sem estilo, ou falhar.
// Em vez de clonar a tag, lemos as regras já parseadas de
// `document.styleSheets` (a folha já está carregada nesta página) e
// embutimos como <style> inline — a janela de impressão não depende de
// nenhuma requisição de rede pra CSS.
const collectStyleTags = (): string =>
  Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
        return `<style>${rules}</style>`;
      } catch {
        // Folha de outra origem sem CORS liberado não deixa ler
        // cssRules — o app não carrega CSS de terceiros, mas fica
        // defensivo caso isso mude no futuro.
        return "";
      }
    })
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
      /* min-height: 0 sobrescreve a regra "body { min-height: 100vh }" do
         index.css, clonada acima por collectStyleTags() junto com todo o
         resto da folha de estilo do app. Esse min-height existe pra manter
         o gradiente de fundo cobrindo a tela toda no app normal, mas na
         janela de impressão ele força o body a ficar tão alto quanto o
         viewport (ou a altura da página no cálculo de vh em impressão),
         bem maior que o conteúdo real — empurrando pra uma segunda página
         em branco. */
      html, body { margin: 0; min-height: 0; background: #ffffff; }
    </style>
  </head>
  <body>${previewHtml}</body>
</html>`;
};

const PRINT_DELAY_MS = 150;
const FONT_READY_TIMEOUT_MS = 2000;

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
  // Sem "noopener": essa flag faz window.open() retornar null por
  // especificação (é assim que noopener corta a referência de propósito),
  // o que tornava IMPOSSÍVEL escrever conteúdo ou chamar print() na janela
  // aberta — ela ficava travada em about:blank pra sempre. Como o conteúdo
  // é 100% nosso (nenhuma URL de terceiro é carregada), não há o risco de
  // reverse tabnabbing que "noopener" existe pra prevenir.
  const printWindow = openWindow("", "_blank");

  if (!printWindow) {
    return false;
  }

  const html = buildBudgetPrintHtml(budget, profile);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Fechar a janela sozinha em "afterprint" foi tentado e removido: em
  // mobile a impressão/geração de PDF costuma ser assíncrona (o evento
  // pode disparar antes do sistema terminar de gerar o arquivo a partir
  // do conteúdo da janela), então fechar nesse momento arrisca cortar a
  // geração no meio, quebrando a impressão. Deixa o usuário fechar a aba
  // manualmente — é menos elegante, mas não arrisca a impressão em si.

  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // A janela continua aberta; o usuário pode imprimir manualmente
      // pelo próprio menu do navegador se o disparo automático falhar.
    }
  };

  // Um atraso fixo curto pra deixar o documento (construído de forma
  // síncrona por document.write + close) assentar, e então esperar de
  // verdade o carregamento das fontes (@font-face ainda depende de rede
  // mesmo com o CSS embutido) antes de imprimir — com um teto de
  // segurança pra não travar pra sempre se `fonts.ready` nunca resolver.
  window.setTimeout(() => {
    const fontsReady = printWindow.document.fonts?.ready;
    if (!fontsReady?.then) {
      triggerPrint();
      return;
    }

    const timeout = new Promise<void>((resolve) => {
      window.setTimeout(resolve, FONT_READY_TIMEOUT_MS);
    });
    Promise.race([fontsReady, timeout]).then(triggerPrint, triggerPrint);
  }, PRINT_DELAY_MS);

  return true;
};
