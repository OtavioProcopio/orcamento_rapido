# Tarefas — SEO, títulos por rota e builder utilizável em celular

> Ordem de dependência. `[P]` marca tarefa paralelizável (não toca arquivo de outra `[P]`
> da mesma fase). Teste vem antes da implementação que ele prova.
>
> Este projeto não usa a estrutura `app/adapters|core|infra` nem `app/tests/bdd/` da
> constituição (gap de adoção documentado em `.specify/memory/as-is.md` e em `plan.md` §
> "Arquivos a criar ou alterar" — decisão amparada pelo Princípio 4). As fases abaixo seguem
> a ordem real de dependência deste projeto (hook compartilhado → páginas que o consomem →
> conteúdo estático → verificação de integração), e os "cenários de aceite" da spec são
> rastreados até os testes Jest/Cypress reais que os provam, na seção Rastreabilidade.
>
> **Correção feita já em `/bu:implement`**: o guard `guard_structure.py` do plugin bloqueia
> qualquer `Write`/`Edit` de arquivo de teste fora de `app/tests/` — o que este projeto legado
> nunca seguiu (convenção real é `app/src/tests/`). Como isso é imposto pela ferramenta, não é
> uma preferência de estilo que dava para manter, T001/T002 abaixo estendem `tsconfig.jest.json`
> e `eslint.config.js` para reconhecer `app/tests/unit/`, e todo teste **tocado por esta
> feature** (novo ou existente) vai para lá — só os arquivos que esta feature já ia tocar,
> não uma migração geral dos outros ~30 arquivos de teste do projeto.

## Fase 1 — Tooling (pré-requisito do guard de estrutura) e hook compartilhado

- [x] T001 `app/tsconfig.jest.json` (alterar) — adiciona `"tests/unit"` ao array `include`, para o ts-jest reconhecer arquivos fora de `src/`
- [x] T002 `app/eslint.config.js` (alterar) — estende o glob do bloco de regras relaxadas de teste de `**/src/tests/**/*.{ts,tsx}` para também cobrir `**/tests/unit/**/*.{ts,tsx}`, senão os arquivos migrados abaixo ficam sob as regras `recommendedTypeChecked` completas (que o padrão de teste deste projeto, com bastante `jest.mock`, não passa)
- [x] T003 Teste unitário de `usePageMetadata` em `app/tests/unit/hooks/usePageMetadata.test.tsx` (criar) — cobre: seta `document.title`; cria a tag `<meta name="description">` quando ela não existe; atualiza o `content` quando ela já existe; refaz isso a cada novo `{title, description}` recebido; cria/atualiza `<link rel="canonical">` com a URL absoluta calculada a partir de `useLocation().pathname` (renderizando com `MemoryRouter initialEntries={["/dashboard"]}` e conferindo que o `href` muda ao trocar de rota — achado do `/bu:analyze`, ver `plan.md`)
- [x] T004 Implementar `usePageMetadata` em `app/src/hooks/usePageMetadata.ts` (criar) — título, description e canonical dinâmico

## Fase 2 — Páginas (RF-01, RF-02, e RF-05/RF-06 em `BudgetPage.tsx`)

### 2a — Testes [P]

Cada tarefa abaixo **move** o arquivo existente de `app/src/tests/pages/<Nome>.test.tsx` para
o caminho novo (conteúdo + import paths ajustados, nada de comportamento perdido) e acrescenta
o caso novo, num único passo — não faz sentido mover e depois editar separadamente.

- [x] T005 [P] `app/tests/unit/pages/LandingPage.test.tsx` (mover de `app/src/tests/pages/LandingPage.test.tsx` + alterar) — caso: define título/descrição da rota `/`
- [x] T006 [P] `app/tests/unit/pages/HomePage.test.tsx` (mover de `app/src/tests/pages/HomePage.test.tsx` + alterar) — caso: define título/descrição da rota `/dashboard`
- [x] T007 [P] `app/tests/unit/pages/ProfilePage.test.tsx` (mover de `app/src/tests/pages/ProfilePage.test.tsx` + alterar) — caso: define título/descrição da rota `/profile`
- [x] T008 [P] `app/tests/unit/pages/BudgetPage.test.tsx` (mover de `app/src/tests/pages/BudgetPage.test.tsx` + alterar) — caso: define título/descrição da rota `/builder`
- [x] T009 [P] `app/tests/unit/pages/DataManagementPage.test.tsx` (mover de `app/src/tests/pages/DataManagementPage.test.tsx` + alterar) — caso: define título/descrição da rota `/data`
- [x] T010 [P] `app/tests/unit/pages/ClientsPage.test.tsx` (mover de `app/src/tests/pages/ClientsPage.test.tsx` + alterar) — caso: define título/descrição da rota `/clients`
- [x] T011 [P] `app/tests/unit/pages/PipelinePage.test.tsx` (mover de `app/src/tests/pages/PipelinePage.test.tsx` + alterar) — caso: define título/descrição da rota `/pipeline`
- [x] T012 [P] `app/tests/unit/pages/LegalPage.test.tsx` (criar — não existia; gap pré-existente coberto porque a feature toca o arquivo) — casos: título/descrição corretos para `type="privacy"`, `type="terms"` e `type="storage"`

### 2b — Implementação [P]

- [x] T013 [P] `app/src/pages/LandingPage.tsx` (alterar) — chama `usePageMetadata` com o título/descrição de `plan.md`
- [x] T014 [P] `app/src/pages/HomePage.tsx` (alterar) — idem
- [x] T015 [P] `app/src/pages/ProfilePage.tsx` (alterar) — idem
- [x] T016 [P] `app/src/pages/BudgetPage.tsx` (alterar) — chama `usePageMetadata` **e** corrige as classes Tailwind incondicionais para `lg:`-condicionais no wrapper mais externo do componente (`h-screen`/`overflow-hidden`, achado rodando o Cypress real de T034 — o plano original não tinha citado esse nível) e no contêiner do grid + `aside`/`main`, conforme `plan.md` § "Correção do builder em mobile" — resolve RF-05 e RF-06
- [x] T017 [P] `app/src/pages/DataManagementPage.tsx` (alterar) — chama `usePageMetadata`
- [x] T018 [P] `app/src/pages/ClientsPage.tsx` (alterar) — chama `usePageMetadata`
- [x] T019 [P] `app/src/pages/PipelinePage.tsx` (alterar) — chama `usePageMetadata`; **nenhuma outra mudança** — RF-07 já está implementado (`<select>` "Mover para" em `:278-299`, já testado em `PipelinePage.test.tsx:98-127`)
- [x] T020 [P] `app/src/pages/LegalPage.tsx` (alterar) — chama `usePageMetadata` com título/descrição derivados da prop `type`

## Fase 3 — Conteúdo estático (RF-03, RF-04, RF-08)

### 3a — Assets binários (sem teste — mesmo precedente de `favicon.svg`/`icons.svg`)

- [x] T021 `app/scripts/og-image-source.svg` (criar) — arte 1200×630, cores da marca (`#0D2366`, `#05AE47`, já usadas em `favicon.svg`), nome do produto + tagline
- [x] T022 `app/public/og-image.png` (criar) — rasterizar T021 via `npx --yes sharp-cli`
- [x] T023 [P] `app/public/icons/icon-192.png` (criar) — rasterizar `app/public/favicon.svg` via `npx --yes sharp-cli`
- [x] T024 [P] `app/public/icons/icon-512.png` (criar) — idem, 512×512
- [x] T025 [P] `app/public/apple-touch-icon.png` (criar) — idem, 180×180

### 3b — Testes [P]

- [x] T026 [P] `app/tests/unit/utils/manifest.test.ts` (criar) — `JSON.parse` de `app/public/manifest.json` e verifica `name`, `short_name`, `display: "standalone"`, `start_url`, `icons` com entradas 192 e 512
- [x] T027 [P] `app/tests/unit/utils/robotsTxt.test.ts` (criar) — lê `app/public/robots.txt` e verifica que permite indexação geral e referencia o `sitemap.xml`
- [x] T028 [P] `app/tests/unit/utils/sitemap.test.ts` (criar) — lê `app/public/sitemap.xml`, faz parse de XML e verifica que a lista de `<loc>` bate exatamente com as 10 rotas de RF-01, todas com a URL base `https://otavioprocopio.github.io/orcamento_rapido/`

### 3c — Implementação [P]

- [x] T029 [P] `app/public/manifest.json` (criar) — `start_url: "."`, ícones com caminho relativo (`icons/icon-192.png`, `icons/icon-512.png`, sem `/` inicial)
- [x] T030 [P] `app/public/robots.txt` (criar)
- [x] T031 [P] `app/public/sitemap.xml` (criar)

### 3d — `index.html` (depende de 3a e 3c existirem para referenciar os caminhos certos)

- [x] T032 `app/tests/unit/utils/indexHtml.test.ts` (criar) — lê `app/index.html` e verifica: `<title>` com "Orça Rápido" grafado corretamente; `<meta name="description">`; `<link rel="canonical">` **estático apontando para `/` (valor de pré-render — o dinâmico por rota é responsabilidade de `usePageMetadata`, testado em T003)**; `og:title`/`og:description`/`og:image`/`og:url` absolutos; `twitter:card`/`twitter:title`/`twitter:description`/`twitter:image`; `<link rel="manifest" href="%BASE_URL%manifest.json">`; `<link rel="apple-touch-icon" href="%BASE_URL%apple-touch-icon.png">`; `<meta name="theme-color">`
- [x] T033 `app/index.html` (alterar) — conforme `plan.md` § "Decisões técnicas" (URLs absolutas nas tags que crawlers leem sem JS; `%BASE_URL%` nos assets locais)

## Fase 4 — Integração (verificação real de RF-05/RF-06 em viewport mobile)

- [x] T034 `app/cypress/e2e/budget-builder-mobile.cy.js` (criar) — depende de T016. Dois casos no mesmo spec: (a) em viewport mobile (`cy.viewport(390, 844)` ou equivalente), preenche o formulário do builder e confere que consegue rolar até o fim do formulário e até o total do preview, sem elemento inacessível; (b) em viewport desktop (`cy.viewport(1280, 800)`), confere que o layout de duas colunas lado a lado continua se comportando como hoje — regressão de RF-06 quebra este caso

## Fase 5 — Fechamento

- [x] T035 `make validate` verde (lint + test + coverage + build) — critério de pronto da feature para efeito de `/bu:implement`; `make e2e` (Cypress + Playwright, incluindo T034) roda à parte, como já acontece com todos os specs existentes

## Rastreabilidade

| Requisito | Tarefas |
|---|---|
| RF-01 (título por rota) | T003, T004, T005–T012, T013–T020 |
| RF-02 (description por rota) | T003, T004, T005–T012, T013–T020 |
| RF-03 (Open Graph / Twitter Card em `/`) | T021, T022, T032, T033 |
| RF-04 (robots.txt / sitemap.xml) | T026, T027, T028, T029, T030, T031, T032, T033 |
| RF-05 (builder rolável em mobile) | T016, T034 |
| RF-06 (desktop não regride) | T016, T034 |
| RF-07 (mover no pipeline por toque) | Nenhuma — já implementado em `PipelinePage.tsx:278-299`, já testado em `PipelinePage.test.tsx:98-127` (ver `plan.md` § Decisões técnicas) |
| RF-08 (instalável como PWA) | T023, T024, T025, T026, T029, T032, T033 |
| RNF-01 (Lighthouse SEO ≥ 90) | Sem tarefa automatizada — verificação manual após deploy, ver `plan.md` § Riscos |
| RNF-02 (cobertura ≥ 90% nos arquivos alterados) | T035 |
| RNF-03 (`make validate` verde) | T035 |

## Cenários de aceite → verificação automatizada

O projeto não tem `app/tests/bdd/` (sem executor de Gherkin no toolchain — ver nota no topo
deste arquivo). Cada Cenário do `spec.md` é provado pelo teste automatizado abaixo, não por um
`.feature` separado:

| Cenário (spec.md) | Provado por |
|---|---|
| Título correto por rota | T005–T012 (testes), T013–T020 (implementação) |
| Meta description por rota | T005–T012, T013–T020 |
| Prévia de compartilhamento | T032, T033 |
| Indexação por buscadores | T027, T028, T030, T031 |
| Builder rolável em smartphone | T034 (caso mobile) |
| Builder — desktop não regride | T034 (caso desktop) |
| Mover orçamento no pipeline por toque | `PipelinePage.test.tsx:98-127` (já existe, nenhuma tarefa nova) |
| Instalar o app na tela inicial | T023–T026, T029, T032, T033 |

## Convergence

> Seção **append-only**, escrita por `/bu:converge`. Cada rodada acrescenta um bloco;
> nada é reescrito.

### Rodada 1 — 2026-09-02

| Requisito | Estado | Evidência |
|---|---|---|
| RF-01 (título por rota) | realizado | `usePageMetadata.ts` seta `document.title`; chamado em `LandingPage.tsx`, `HomePage.tsx`, `ProfilePage.tsx`, `BudgetPage.tsx`, `DataManagementPage.tsx`, `ClientsPage.tsx`, `PipelinePage.tsx`, `LegalPage.tsx` (título varia por `type`). Testado por rota em `app/tests/unit/pages/*.test.tsx` (caso "sets a specific document title...") e `app/tests/unit/hooks/usePageMetadata.test.tsx`. |
| RF-02 (description por rota) | realizado | Mesmo hook, mesma chamada por página; testado junto com RF-01 nos mesmos arquivos. |
| RF-03 (Open Graph/Twitter em `/`) | realizado | `app/index.html:27-58` — `og:title/description/url/image/type/site_name/locale` e `twitter:card/title/description/image`, URLs absolutas. Imagem `app/public/og-image.png` (1200×630, gerada de `app/scripts/og-image-source.svg`). Testado em `app/tests/unit/utils/indexHtml.test.ts`. |
| RF-04 (robots.txt/sitemap.xml) | realizado | `app/public/robots.txt` (permite tudo, referencia sitemap), `app/public/sitemap.xml` (10 rotas, URLs absolutas). Testado em `app/tests/unit/utils/robotsTxt.test.ts` e `sitemap.test.ts` (trava a lista exata das 10 rotas de `App.tsx`). |
| RF-05 (builder rolável em smartphone) | realizado | `BudgetPage.tsx` — corrigidas classes `lg:`-condicionais em **dois** níveis (wrapper externo `h-screen`/`overflow-hidden` + grid/`aside`/`main`; o segundo nível só apareceu rodando o Cypress de verdade, não estava no plano original). Verificado com `app/cypress/e2e/budget-builder-mobile.cy.js`, caso mobile (viewport 390×844): rolagem chega ao fim do formulário e ao fim do preview. |
| RF-06 (desktop não regride) | realizado | Mesmo spec Cypress, caso desktop (1280×800): formulário e preview visíveis simultaneamente, sem rolagem, como antes da mudança. |
| RF-07 (mover no pipeline por toque) | realizado (pré-existente) | `PipelinePage.tsx:278-299` já tinha um `<select>` "Mover para" por card, 100% operável por toque, já testado em `app/tests/unit/pages/PipelinePage.test.tsx:98-127`. Nenhuma tarefa desta feature o alterou, além de adicionar a chamada de `usePageMetadata`. |
| RF-08 (instalável como PWA) | realizado | `app/public/manifest.json` (`start_url: "."`, ícones relativos 192/512), `app/public/apple-touch-icon.png` (180×180), `<link rel="manifest">` e `<link rel="apple-touch-icon">` em `index.html` via `%BASE_URL%` (confirmado resolvendo para `/orcamento_rapido/...` em build de produção). Testado em `app/tests/unit/utils/manifest.test.ts` e `indexHtml.test.ts`. Sem service worker/offline, por escopo. |
| RNF-01 (Lighthouse SEO ≥ 90) | realizado | Medido de verdade nesta rodada (build de produção servido localmente via `vite preview`, auditado com Lighthouse 13.4.1 usando o Chromium do Playwright como `CHROME_PATH`, categoria SEO isolada): **100/100** — todos os 10 audits aplicáveis com nota máxima (title, meta description, canonical válido, robots.txt válido, crawlable, HTTP 200, links com texto descritivo, alt em imagens). |
| RNF-02 (cobertura ≥ 90% nos arquivos alterados) | realizado | `make validate` desta rodada: Statements 98.19%, Branches 90.70%, Functions 97.03%, Lines 98.73% — todas acima da meta de 90%. |
| RNF-03 (`make validate` verde) | realizado | `make validate` — Status final: **APROVADO**. 42/42 suítes, 284/284 testes, build gerado (22 arquivos, 694.86 KB). |

**Fora de escopo — confirmado que nada foi tocado**: `app/src/utils/printBudget.ts`, `app/src/index.css` (regras `@media print`), domínio próprio (`CNAME`), service worker/offline, sincronização remota, multi-moeda/idioma, redesenho visual geral. `git status` confirma que nenhum desses arquivos aparece como alterado.

**Excesso de escopo encontrado**: nenhum. Todo arquivo criado/alterado (`git status`) corresponde a uma linha da tabela "Arquivos a criar ou alterar" de `plan.md`, incluindo os dois arquivos de tooling (`tsconfig.jest.json`, `eslint.config.js`) e a migração dos testes de página para `app/tests/unit/`, ambos justificados no plano como correção forçada pelo hook `guard_structure.py` do próprio plugin, descoberta em `/bu:implement`.

**Cenários de aceite**: os 8 cenários Gherkin de `spec.md` correspondem 1:1 à tabela "Cenários de aceite → verificação automatizada" de `tasks.md`; todos os testes ali listados passam (evidência acima).

Veredito: **convergido**
Tarefas acrescentadas: nenhuma
