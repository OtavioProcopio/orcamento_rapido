# Retrato as-is — Orça Rápido

Data: 2026-09-01
Branch analisada: `develop` @ `dc6ed2c`

## 1. Retrato

O Orça Rápido é uma SPA React (Vite + TypeScript + Tailwind 4) para MEIs/autônomos
emitirem e gerirem orçamentos. **100% frontend, sem backend, sem login, sem mensalidade** —
persistência é local ao navegador (IndexedDB com fallback e migração automática de
`localStorage`, ver §2). Deployada como site estático no GitHub Pages via
`.github/workflows/deploy-pages.yml`.

**Entrypoints**: `app/src/main.tsx` → `app/src/App.tsx` (rotas, `App.tsx:51-64`).

**Fluxo principal do usuário**:
`/` (`LandingPage.tsx:10`, CTA condicional a já ter perfil/orçamento) →
`/profile` (`ProfilePage.tsx:33`, cadastro do emissor MEI/empresa) →
`/builder` (`BudgetPage.tsx:104`, construtor com preview ao vivo, tela dividida) →
salva → `/dashboard` (`HomePage.tsx:27`, histórico, busca, imprimir/compartilhar/editar/excluir) →
opcionalmente `/pipeline` (`PipelinePage.tsx:24`, kanban de status por drag-and-drop),
`/clients` (`ClientsPage.tsx:32`, CRUD de clientes), `/data` (`DataManagementPage.tsx:15`,
backup JSON/CSV). Páginas legais em `/privacy`, `/terms`, `/storage-notice`
(`LegalPage.tsx:30`, roteada por prop `type`). Rota desconhecida → `Navigate to="/"`
(`App.tsx:64`).

**"PDF"**: não há lib de PDF (sem jsPDF/html2canvas). É `window.print()` nativo:
`app/src/utils/printBudget.ts`. `buildBudgetPrintHtml` (linhas 81-108) monta um documento
standalone reaproveitando `BudgetPreview` renderizado via `flushSync` (linhas 51-79),
clona `document.styleSheets` para não depender de rede no popup (linhas 29-44), injeta
`@page { size: A4; margin: 0 }` (linha 94). `printBudget` (linhas 123-181) abre janela nova
(`window.open("", "_blank")`, sem `noopener` propositalmente, linhas 128-134 — comentário do
próprio código cita bug conhecido de iframe no iOS Safari/Android), espera fontes
(`document.fonts.ready`, timeout de 2s) e chama `.print()`. Chamado de
`HomePage.tsx:11,414`. Regras `@media print` em `app/src/index.css:134-172` (força
`width: 210mm`, repete cabeçalho de tabela, evita quebra de item no meio).

## 2. Domínio identificado

Tipos em `app/src/types/index.ts`:

| Entidade | Arquivo:linha | Campos principais |
|---|---|---|
| `Budget` | `index.ts:55-69` | `id, number, status, createdAt, validUntil?, profileId?, client, items[], terms?, paymentTerms?, discount?, modules, totals` |
| `BudgetStatus` | `index.ts:1` | `"draft"\|"sent"\|"approved"\|"rejected"\|"paid"` — colunas do kanban |
| `BudgetItem` | `index.ts:15-21` | `id, descricao, quantidade, unidade, valorUnitario` |
| `BudgetClient` | `index.ts:23-30` | snapshot do cliente dentro do orçamento |
| `Client` | `index.ts:32-41` | `id, name, document?, address?, email?, phone?, notes?, createdAt` |
| `MeiProfile` | `index.ts:3-13` | `id, companyName, document?, userName, phone, email?, pixKey, logo?, createdAt` — multi-empresa |

Regras de negócio:
- Totais: `subtotal = Σ(quantidade × valorUnitario)`, `total = max(0, subtotal - discount)` — `app/src/utils/calculate.ts:3-24`.
- Item: quantidade > 0, valor unitário ≥ 0, descrição obrigatória — `app/src/utils/budgetSchema.ts:16-28`.
- Desconto não pode exceder subtotal (`superRefine`) — `budgetSchema.ts:56-74`.
- Orçamento exige ≥ 1 item — `budgetSchema.ts:46`. Validade em dias, se informada, ≥ 1 — `budgetSchema.ts:48-50`.
- CPF/CNPJ com dígito verificador real — `app/src/utils/document.ts:6-42`. Telefone ≥10 dígitos com DDD — `app/src/utils/maskPhone.ts`.
- `BudgetPage` bloqueia salvar sem perfil cadastrado, redireciona para `/profile` (`BudgetPage.tsx` ~599-616).
- Moeda: BRL-only via `Intl.NumberFormat` — `app/src/utils/format.ts:3-8` (campo `moeda` multi-moeda foi removido em auditoria anterior, ver `docs/relatorio-sistema.md:18`).
- Data: `formatDate` trata strings "date-only" sem deslocamento de fuso — `format.ts:12-24`.

## 3. Persistência (crítico para "profissionalizar")

`app/src/storage/storageAdapter.ts` é a única camada de persistência:
- **Primário: IndexedDB** (DB `orca-rapido` v3, stores `profile/profiles/budgets/clients/meta` — `storageAdapter.ts:8-15`).
- **Fallback: localStorage** se `indexedDB` ausente (`storageAdapter.ts:405-407` e ramos `if (!db)` por método).
- Padrão de escrita é sempre "lê tudo → reescreve tudo", sem transação atômica cross-tab (comentário do próprio código em `tabSync.ts:1-6`).
- Sincronização entre abas via `BroadcastChannel` (`tabSync.ts`) — **só notifica, não faz merge**; consumida em `useBudget.ts:36-39` como aviso não-automático (para não descartar rascunho em edição).
- **Não há sync remoto nem backend.** Export/import manual de backup JSON e CSV em `app/src/utils/backup.ts`, via `DataManagementPage.tsx`. Único tráfego externo é analytics best-effort (GoatCounter, sem dados de negócio) — `app/src/utils/analytics.ts`, `index.html:35-40`, restrito por CSP.
- **Implicação direta**: trocar de navegador/dispositivo ou limpar dados do site apaga tudo, a menos que o usuário exporte backup manualmente. Isso é uma decisão de produto (privacidade "tudo fica no seu navegador"), não um bug — mas é uma fricção relevante para "profissionalizar" o uso (ver §6).

## 4. Componentes e hooks

- `app/src/components/` tem só peças genéricas/desacopladas: `BudgetPreview.tsx` (card do orçamento, reusado em tela e impressão), `ConfirmationDialog.tsx`, `RemoteUpdateBanner.tsx`, `ErrorBoundary.tsx`, `Button.tsx`, `EmptyState.tsx`, `PageHeader.tsx`. Nenhum importa `storageAdapter` — bom desacoplamento.
- Os componentes de negócio "pesados" (kanban, form de orçamento, CRUD de clientes) moram em `app/src/pages/`, não em `components/`.
- Hooks (`useBudget.ts`, `useClients.ts`, `useProfiles.ts`) são **quase cópia-e-cola** entre si: mesmo formato de estado (`loading/error/remoteUpdateAvailable`), mesmo `useEffect` de carga inicial, mesmo padrão de assinatura a `subscribeToStoreChanges`. ~90 linhas replicadas 3× — candidato natural a um `useCollection<T>` genérico, mas não é bug, é debt de duplicação.
- Exceção documentada: `DataManagementPage.tsx` chama `storageAdapter` diretamente (bulk export/import), fora do padrão "página fala com storage só via hook" — intencional (não precisa do estado reativo dos hooks).

## 5. Contrato de operação (existe, ao contrário do que o inventário mecânico sugeriu)

Há `Makefile` na raiz com `install/lint/test/coverage/build/dev-up/dev-down/e2e/check/validate/release/clean`.
`make validate` = lint + test + coverage + build, com piso de cobertura 90% em todas as
métricas (`Makefile`, `MIN_COVERAGE_*`). Não há Dockerfile/compose — ambiente padronizado
via Dev Container (`README.md`), não via `make dev` conteinerizado.

CI: `.github/workflows/ci.yml` (roda `make install` + `make validate` em PR e push para
`develop`), `.github/workflows/promote-main.yml` (promove `develop`→`main` com tag semver
após validação verde), `.github/workflows/deploy-pages.yml` (build com
`VITE_APP_BASE` dinâmico do Pages, copia `index.html`→`404.html` para SPA fallback,
`touch .nojekyll`, deploy via `actions/deploy-pages@v4`). Fluxo documentado e consistente
em `docs/fluxo-release.md` e `docs/diagramas.md`.

Razão teste/produção medida: **0.745** (38 arquivos de teste / 51 de produção — inventário
mecânico). Cobertura real declarada no último relatório interno (`docs/relatorio-sistema.md:29`,
2026-08-06): 98,1% statements / 90,29% branches / 95,73% functions / 99,15% lines — **não
re-executei `make coverage` nesta sessão para confirmar o número atual**, então trato como
"não medido nesta rodada, medido na anterior".

**Nota de defasagem**: `docs/relatorio-sistema.md` (2026-08-06) lista como pendência #2
"Status como pipeline de vendas: transformar em Kanban" — **já implementado**
(`PipelinePage.tsx`, rota `/pipeline` em `App.tsx:57`, commit `9006f20`). Também não reflete
o cadastro multi-empresa (`af3dcdc`, rota `/clients`, `ClientsPage.tsx`). O documento deveria
ser atualizado antes de ser usado como fonte de verdade para decisão de produto.

## 6. O que falta para "profissional" — SEO e mobile (foco do pedido do usuário)

### SEO — gaps confirmados em `app/index.html` (42 linhas) e no repo:
- Só existe `<title>Orca Rapido</title>` (`index.html:30`) — sem acento, e **igual em todas
  as rotas** (nenhuma lib de head management: grep por `Helmet|document.title` em `src/`
  vazio). Compartilhar `/pipeline`, `/clients` etc. no WhatsApp/redes mostra sempre o mesmo
  título genérico.
- **Sem** `meta description`, Open Graph, Twitter Card, `link rel="canonical"` — impacto
  direto em preview de link e ranqueamento.
- **Sem** `robots.txt` nem `sitemap.xml` em `app/public/` (confirmado, pasta só tem fonts,
  `icons.svg`, `favicon.svg`).
- **Sem** `manifest.json`/service worker — não instalável como PWA, sem ícone customizado
  ao "adicionar à tela inicial" no celular (só favicon SVG, que iOS não usa bem para isso;
  falta `apple-touch-icon`).
- **Sem domínio próprio** (sem `CNAME`) — URL fica em `usuario.github.io/orcamento_rapido/`,
  menos "profissional"/memorável para o público MEI.
- **Positivo, não mexer**: roteamento é `BrowserRouter` (`App.tsx:46`, URLs limpas, bom para
  SEO) com `basename` dinâmico, e o workflow de deploy já resolve o problema clássico de
  refresh/deep-link quebrado no GH Pages copiando `index.html`→`404.html`
  (`deploy-pages.yml:40-43`). Isso já está corretamente resolvido.

### Mobile — causa raiz confirmada do preview ruim no celular (não é o `@media print`):
O usuário relatou que o PDF em si funciona bem em ambos, mas o **preview em tela dentro do
editor** fica ruim no celular. Verificado pessoalmente em `BudgetPage.tsx:624`:

```
<div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-72px)] relative">
  <aside className="... overflow-y-auto ... lg:col-span-5">        <!-- form -->
  <main  className="... overflow-y-auto ... lg:col-span-7">        <!-- preview, linha 1292 -->
```

Em desktop (`lg:grid-cols-12`) as duas colunas ficam lado a lado, cada uma rolando dentro da
altura fixa `h-[calc(100vh-72px)]` — funciona bem. Em mobile (`grid-cols-1`), as mesmas duas
divs viram **linhas** de grid dentro do mesmo container de altura fixa com
`overflow-hidden` no pai: as linhas de grid não recebem altura própria pelo conteúdo, então
formulário longo + preview inteiro competem pela mesma altura fixa e são cortados pelo
`overflow-hidden`, gerando rolagem interna dupla e confusa em vez de uma rolagem de página
única e natural. Agravado por `BudgetPreview.tsx:48`
(`aspect-[1/1.4142] w-full max-w-198.5 p-10 md:p-12` — proporção A4 fixa com padding grande
que não reduz abaixo de `p-10` em telas estreitas).

Outros indícios de responsividade problemática:
- `PipelinePage.tsx:220,226,253-254`: drag-and-drop do kanban usa API nativa HTML5
  (`draggable`, `onDragStart/onDragOver/onDrop`), que **não funciona por toque** em
  mobile/tablet — sem fallback (ex.: menu de ação ou seleção) para mover cards no celular,
  mesmo o grid já colapsando (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-5`, linha 212).
- `LandingPage.tsx:49`: bloco "Uso local no navegador / Sem mensalidade" é
  `hidden ... md:block` — some completamente em mobile em vez de reposicionar; pode perder
  argumento de venda justamente para quem acessa a landing pelo celular.

### `@media print` (a parte que já funciona bem, não mexer sem necessidade)
`app/src/index.css:134-172` já tem ajustes específicos que os comentários do próprio
arquivo (linhas 140-147) descrevem como correção de um bug anterior de página em branco
extra em "pipelines de impressão mobile". Coerente com o relato do usuário de que o PDF
funciona bem nos dois.

## 7. Riscos

- **Perda de dados entre abas concorrentes**: escrita "lê tudo → reescreve tudo" sem
  merge real; risco reconhecido no próprio código (`tabSync.ts:1-6`).
- **`openDatabase` engole erro silenciosamente**: se IndexedDB existir mas falhar ao abrir,
  cai para `null` via `.catch(() => null)` (`storageAdapter.ts:434`) e usa localStorage sem
  avisar o usuário — pode divergir dados se IndexedDB voltar a funcionar depois.
- **Sem diferenciação de erro de quota/disco cheio** em operações de storage — hooks
  mostram mensagem genérica (`useBudget.ts:41-51`).
- **Redundância de ferramental de teste**: Cypress e Playwright coexistem (`package.json`)
  — não é risco de segurança, mas é debt de manutenção.
- **Nenhum segredo em código** confirmado (grep vazio por api key/secret/token/password).
  Único endpoint externo é o domínio público do GoatCounter, sem credenciais.
- **`docs/relatorio-sistema.md` desatualizado** (§5) — se usado para decisão de produto sem
  confronto com o código, leva a redecidir algo que já foi implementado.

## 8. Plano de adoção em ondas

O projeto **já tem** contrato de operação, estrutura de testes e CI funcionando — não é o
caso comum de "legado sem nada". As ondas aqui são as que faltam para o objetivo real do
usuário (produto usável/profissional, SEO, mobile), não uma adoção de zero.

**Onda 1 — Meta tags e SEO estático de base**
- Critério de pronto: `app/index.html` com `meta description`, Open Graph, Twitter Card,
  `apple-touch-icon`; `app/public/robots.txt` e `sitemap.xml` versionados; título corrigido
  para "Orça Rápido" (com acento). Verificável rodando `make build` e inspecionando
  `app/dist/index.html` + validando sitemap contra as rotas reais de `App.tsx`.
- Risco de parar no meio: nenhum — são arquivos estáticos aditivos, zero acoplamento com
  lógica existente.

**Onda 2 — Título dinâmico por rota**
- Critério de pronto: cada rota de `App.tsx` atualiza `document.title` (e idealmente
  `meta description`) ao montar — via hook simples (`useDocumentTitle`) ou
  `react-helmet-async`. Verificável inspecionando `document.title` em cada rota via teste
  ou manualmente.
- Risco de parar no meio: baixo — se só algumas páginas ganharem título dinâmico, as
  demais continuam com o título estático atual (não quebra nada), mas fica inconsistente
  até completar todas as rotas.

**Onda 3 — Correção do preview mobile em `BudgetPage.tsx`**
- Critério de pronto: em viewport < `lg` (1024px), o layout de `BudgetPage.tsx:624` deixa
  de forçar `h-[calc(100vh-72px)]` + `overflow-hidden` nas duas colunas simultaneamente —
  passa a permitir rolagem de página única (ex.: altura fixa só a partir de `lg:`, ou tabs
  Formulário/Preview em mobile). Verificável testando manualmente em viewport mobile (ou
  Playwright com viewport reduzido) que todo o formulário e todo o preview ficam acessíveis
  por scroll sem corte.
- Risco de parar no meio: médio — é uma mudança de layout central da página mais usada do
  app; se parar com CSS parcialmente ajustado, pode piorar o desktop atual (que já funciona
  bem). Fazer com teste visual antes/depois em ambos os breakpoints.

**Onda 4 — Kanban por toque + PWA + domínio**
- Critério de pronto: `PipelinePage.tsx` ganha um fallback de interação por toque (ex.: menu
  de ação "mover para..." nos cards, além do drag-and-drop); `manifest.json` +
  `apple-touch-icon` publicados e linkados em `index.html`; decisão registrada sobre domínio
  próprio (custa dinheiro e infra, é decisão de produto do usuário, não técnica).
  Verificável testando o kanban em device touch real/emulado, e Lighthouse PWA score.
- Risco de parar no meio: baixo para PWA/domínio (aditivo); médio para o kanban touch, pois
  mexe em interação já funcional no desktop — precisa não quebrar o drag-and-drop existente.

## Portão desta análise

- [x] Toda afirmação sobre o código cita arquivo e linha.
- [x] Nada foi estimado onde era possível medir — cobertura de teste é citada como "medida
      na rodada anterior (2026-08-06), não re-executada nesta sessão", não como número atual
      inventado.
- [x] Plano de ondas com critério de pronto verificável por onda.
- [x] Nenhum arquivo do projeto analisado foi modificado (só leitura + este arquivo novo em
      `.specify/memory/`).
