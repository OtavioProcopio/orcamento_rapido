# Plano de implementação — SEO, títulos por rota e builder utilizável em celular

> Descreve **como**. Deriva da spec e da constituição; não introduz requisito novo.

## Decisões técnicas

| Decisão | Escolha | Alternativas descartadas | Por quê |
|---|---|---|---|
| Título/descrição por rota | Hook próprio `usePageMetadata({ title, description })` que seta `document.title` e faz upsert de `<meta name="description">` no mount de cada página | `react-helmet-async` | App tem 10 rotas fixas, conhecidas em build-time, sem SSR/streaming. `react-helmet-async` resolve problemas (dedup assíncrono, SSR) que este app não tem — nova dependência sem necessidade viola Princípio 4 (simplicidade/YAGNI). Hook de ~20 linhas é trivial de testar em jsdom (`document.title`, `querySelector`). |
| Canonical por rota | O **mesmo** `usePageMetadata` também faz upsert de `<link rel="canonical">`, calculando a URL a partir de `useLocation().pathname` (react-router-dom) + `__APP_BASENAME__` + o domínio de produção — atualizado a cada navegação, junto com título/descrição | Canonical estático em `index.html` igual em todas as rotas | **Achado no `/bu:analyze`**: canonical é lido pelo Google após renderizar JS (ao contrário de `og:*`), então um valor estático apontando sempre para `/` diria ao Google que a versão "oficial" de `/dashboard`, `/builder` etc. é a home — o oposto do que RF-01/RF-02 querem (cada rota indexável por si). Calcular a partir de `useLocation()` evita duplicar a lista de rotas numa segunda tabela. |
| Open Graph / Twitter Card | Tags estáticas em `app/index.html`, só para `/` (escopo do RF-03) — **inclui um `<link rel="canonical">` estático apontando para `/`, mas só como valor de pré-render**; a partir do primeiro render de qualquer página, `usePageMetadata` sobrescreve esse valor pelo canonical real da rota atual | Meta tags dinâmicas via JS por rota | Crawlers de prévia de link (WhatsApp, Twitter, Facebook, LinkedIn) majoritariamente **não executam JavaScript** — precisam do conteúdo já presente no HTML servido. Só a rota `/` tem OG por exigência da spec; como `/` é também o canonical estático de pré-render, não há inconsistência entre os dois. |
| URLs absolutas em tags que crawlers leem sem JS (`og:*`, `twitter:*`) e no canonical dinâmico | Hardcoded com o domínio real de produção, confirmado via `gh api repos/OtavioProcopio/orcamento_rapido/pages` → `https://otavioprocopio.github.io/orcamento_rapido/`. Vive em **dois lugares** por necessidade (HTML estático vs. hook JS): literal em `app/index.html` e como constante em `app/src/hooks/usePageMetadata.ts` (ex.: `SITE_ORIGIN = "https://otavioprocopio.github.io"`) | Placeholder relativo (`/og-image.png`); ou variável de ambiente `VITE_SITE_ORIGIN` interpolada via `%VITE_SITE_ORIGIN%` no HTML | O `base` do Vite é dinâmico e o transform de HTML **não reescreve** `content` de `<meta>` — URL relativa quebraria a prévia; `og:image`/`og:url` exigem absoluto por especificação de qualquer forma. A variável de ambiente resolveria a duplicação, mas exigiria alterar `.github/workflows/deploy-pages.yml` (fora da tabela de arquivos desta feature) só para eliminar a duplicação de uma string que muda raramente. Duplicação aceita conscientemente: `indexHtml.test.ts` e o teste do hook travam o mesmo literal nos dois lugares, então uma mudança de domínio quebra os dois testes visivelmente em vez de divergir silenciosamente. |
| Assets locais referenciados em `<link>` (favicon, apple-touch-icon, manifest) | Placeholder `%BASE_URL%` do Vite (`href="%BASE_URL%apple-touch-icon.png"`) | Caminho root-absoluto fixo (`/apple-touch-icon.png`) | `%BASE_URL%` é o mecanismo documentado do Vite para isso — funciona em dev (`/`) e build (`/orcamento_rapido/`) sem depender de quais tags o transform de HTML reescreve. |
| Robots.txt/sitemap.xml | Arquivos estáticos versionados em `app/public/`, lista de rotas escrita à mão (não gerada em build) | Script que gera o sitemap a partir das rotas do `App.tsx` em build-time | App tem 10 rotas públicas fixas, que mudam raramente. Um gerador é complexidade sem problema presente (Princípio 4/YAGNI). Mitigado por teste que trava a lista esperada de URLs — se a lista de rotas do teste ficar obsoleta, é o teste que quebra, não silenciosamente o sitemap. |
| Ícones (192/512/apple-touch-icon) e imagem OG (1200×630) | Gerados **uma vez**, durante a implementação, rasterizando SVG com `npx --yes sharp-cli` (sem instalar `sharp` como dependência do projeto); PNGs resultantes ficam versionados em `app/public/` | Adicionar `sharp`/`vite-plugin-pwa` como devDependency permanente | É geração de asset estático, feita uma vez. Dependência nativa (binário) permanente para algo que roda uma vez só é custo sem benefício contínuo — via `npx` o binário nem entra no `package.json`. |
| Fonte da imagem OG | Novo SVG de 1200×630 autoral (nome do produto + tagline sobre fundo com as cores da marca já usadas no `favicon.svg`: `#0D2366` azul, `#05AE47` verde), guardado em `app/scripts/og-image-source.svg` (fora de `public/`, não é deployado como está) | Reaproveitar o `favicon.svg` (1024×1024, proporção quadrada) redimensionado | `favicon.svg` é quadrado; uma imagem OG 1200×630 esticada ficaria distorcida. Mais simples desenhar uma arte na proporção certa do que recortar/compor a partir do ícone. |
| Correção do builder em mobile | Trocar classes Tailwind incondicionais por variantes `lg:` em **dois** níveis: o wrapper mais externo do componente (`h-screen ... overflow-hidden` incondicional, achado só rodando o Cypress real — o plano original citava apenas o contêiner do grid) e o contêiner do grid + os dois painéis (`aside`/`main`), deixando tudo fluir em altura natural abaixo de `lg` | Reescrever o layout com abas "Formulário / Preview" em mobile | Causa raiz é puramente CSS (altura fixa + `overflow-hidden` aplicados também abaixo do breakpoint `lg`, em dois wrappers aninhados — o `jsdom` dos testes Jest não pega isso porque não calcula layout de verdade; só apareceu ao rodar `cy.scrollTo("bottom")` contra um navegador real, ver Riscos). Corrigir a causa exata é mudança pequena e local; abas exigiriam novo estado, nova UI e mudaria a experiência que o usuário não pediu para mudar — mais risco pelo mesmo resultado. |
| Verificação do RF-05/06 (rolagem completa sem corte em mobile) | Novo spec Cypress com `cy.viewport(...)` em `app/cypress/e2e/` | Playwright | `app/playwright.config.ts:1-8` documenta explicitamente que a suíte Playwright deste projeto existe **só** para cenários de `window.open` que o Cypress não suporta (comentário do próprio arquivo). Teste de viewport responsivo é o caso de uso padrão do Cypress aqui — usar Playwell para isso quebraria a separação de responsabilidade já estabelecida entre as duas suítes. |
| Interação por toque no pipeline (RF-07) | Nenhuma implementação nova — já existe (`app/src/pages/PipelinePage.tsx:278-299`, `<select>` "Mover para" por card, testado em `app/src/tests/pages/PipelinePage.test.tsx:98-127`, caminho pré-migração — ver linha abaixo) | — | Verificado lendo o código atual: o `<select>` nativo já é 100% operável por toque (abre o seletor nativo do SO) e já tem cobertura de teste. A spec foi escrita a partir de um retrato (`as-is.md`) que, neste ponto específico, estava incompleto — o subagente explorador não tinha visto esse trecho do arquivo. Implementar de novo duplicaria o que já existe, violando DRY. |
| Localização dos testes novos/tocados | `app/tests/unit/<mesmo subcaminho>` em vez de `app/src/tests/<mesmo subcaminho>` (convenção real, mas não mecanicamente exigida, do resto do projeto) | Manter `app/src/tests/` por coerência com os ~30 arquivos de teste que esta feature não toca | **Achado só na implementação, não previsto ao planejar**: o hook `guard_structure.py` do próprio plugin bloqueia `Write`/`Edit` de qualquer arquivo de teste fora de `app/tests/`, sem exceção por projeto legado. Não é uma escolha — é a única forma de escrever esses arquivos com as ferramentas disponíveis. Escopo contido: só os arquivos de teste que esta feature já ia criar ou alterar migram; os demais ~30 arquivos de teste do projeto ficam onde estão, intocados. `tsconfig.jest.json` e `eslint.config.js` precisam reconhecer o novo caminho (ver tabela de arquivos). |

## Padrões de projeto aplicados

| Padrão | Onde | Problema que resolve | Custo aceito |
|---|---|---|---|
| Hook customizado (extração de efeito colateral reutilizável) | `usePageMetadata` | 10 páginas precisam do mesmo efeito (setar título + description) com valores diferentes | Nenhum — é o padrão já usado no projeto para lógica compartilhada (`useBudget`, `useClients`, `useProfiles`) |

> Nenhum padrão GoF foi considerado — nenhuma das mudanças desta feature tem variação de
> comportamento, família de objetos ou estado complexo que justifique um.

## Arquivos a criar ou alterar

Este projeto é anterior à convenção de camadas `app/adapters|core|infra|interfaces` da
constituição (documentado em `.specify/memory/as-is.md`, seção 5 — gap de adoção reconhecido,
não desta feature). Migrar a arquitetura é fora de escopo da spec (produto/SEO/mobile, não
refatoração estrutural) — decisão amparada pelo Princípio 4 (simplicidade defensável). Código de
produção segue a convenção real e única já usada em todo o projeto:
`app/src/{pages,hooks,components,utils}`. Teste espelhado vai em `app/tests/unit/<mesma pasta,
sem o segmento `src`>` — não por escolha de coerência (a convenção real do projeto seria
`app/src/tests/`), mas porque o hook `guard_structure.py` do plugin bloqueia mecanicamente
`Write`/`Edit` de teste fora de `app/tests/`, ver linha "Localização dos testes" em Decisões
técnicas.

| Camada (deste projeto) | Arquivo | Ação | Teste espelhado |
|---|---|---|---|
| tooling | `app/tsconfig.jest.json` | alterar (`include` ganha `"tests/unit"`) | — (config, mesmo precedente de não-testado que outros arquivos de build) |
| tooling | `app/eslint.config.js` | alterar (glob de relaxamento de regras de teste passa a cobrir também `**/tests/unit/**`) | — (config) |
| hooks | `app/src/hooks/usePageMetadata.ts` | criar (título, description **e** canonical dinâmico via `useLocation()`) | `app/tests/unit/hooks/usePageMetadata.test.tsx` (criar) |
| pages | `app/src/pages/LandingPage.tsx` | alterar (chamar `usePageMetadata`) | `app/tests/unit/pages/LandingPage.test.tsx` (alterar) |
| pages | `app/src/pages/HomePage.tsx` | alterar (chamar `usePageMetadata`) | `app/tests/unit/pages/HomePage.test.tsx` (alterar) |
| pages | `app/src/pages/ProfilePage.tsx` | alterar (chamar `usePageMetadata`) | `app/tests/unit/pages/ProfilePage.test.tsx` (alterar) |
| pages | `app/src/pages/BudgetPage.tsx` | alterar (chamar `usePageMetadata` **e** corrigir classes para `lg:` no wrapper mais externo do componente e no grid/`aside`/`main`) | `app/tests/unit/pages/BudgetPage.test.tsx` (alterar, caso de metadata); `app/cypress/e2e/budget-builder-mobile.cy.js` (criar, caso de rolagem em viewport mobile) |
| pages | `app/src/pages/DataManagementPage.tsx` | alterar (chamar `usePageMetadata`) | `app/tests/unit/pages/DataManagementPage.test.tsx` (alterar) |
| pages | `app/src/pages/ClientsPage.tsx` | alterar (chamar `usePageMetadata`) | `app/tests/unit/pages/ClientsPage.test.tsx` (alterar) |
| pages | `app/src/pages/PipelinePage.tsx` | alterar (chamar `usePageMetadata` — **só isso**; RF-07 já satisfeito, ver Decisões técnicas) | `app/tests/unit/pages/PipelinePage.test.tsx` (alterar, caso de metadata) |
| pages | `app/src/pages/LegalPage.tsx` | alterar (chamar `usePageMetadata` com título/descrição por `type`) | `app/tests/unit/pages/LegalPage.test.tsx` (**criar** — não existe hoje; gap pré-existente, feature toca o arquivo então cobre) |
| build/HTML | `app/index.html` | alterar (title corrigido, meta description, canonical **estático de pré-render apontando para `/`** — sobrescrito em runtime por `usePageMetadata` —, Open Graph, Twitter Card, `apple-touch-icon`, `manifest`, `theme-color`, todos com `%BASE_URL%` ou URL absoluta conforme a tabela de Decisões técnicas) | `app/tests/unit/utils/indexHtml.test.ts` (criar — lê `app/index.html` do disco e garante presença/forma de cada tag) |
| assets estáticos | `app/public/robots.txt` | criar | `app/tests/unit/utils/robotsTxt.test.ts` (criar) |
| assets estáticos | `app/public/sitemap.xml` | criar | `app/tests/unit/utils/sitemap.test.ts` (criar — trava a lista das 10 rotas de RF-01) |
| assets estáticos | `app/public/manifest.json` | criar | `app/tests/unit/utils/manifest.test.ts` (criar — `JSON.parse` + campos obrigatórios) |
| assets estáticos (binário, sem teste) | `app/public/icons/icon-192.png`, `app/public/icons/icon-512.png`, `app/public/apple-touch-icon.png`, `app/public/og-image.png` | criar (gerados uma vez via `npx sharp-cli`, ver Decisões técnicas) | — (arquivo binário sem lógica; mesmo precedente de `app/public/favicon.svg`/`icons.svg`, não testados hoje) |
| ferramental de geração (não deployado) | `app/scripts/og-image-source.svg` | criar | — (insumo de design, não é código) |

## Contrato entre camadas

`usePageMetadata` é um hook sem dependência de `storageAdapter` nem de rede — só manipula o
DOM (`document.title`, `document.head`) via efeito, e é chamado uma vez no topo de cada
componente de página, no mesmo padrão em que essas páginas já chamam `useBudget`/`useClients`/
`useProfiles`. A única dependência nova do hook é `useLocation()` de `react-router-dom`
(já presente no projeto), usada só para montar a URL canônica da rota atual — o hook não
precisa saber a lista de rotas, só a rota em que está montado. Nenhuma outra camada muda:
hooks de domínio, storage e componentes de apresentação (`components/`) ficam intocados — a
mudança é aditiva nas páginas e nos arquivos estáticos de `app/index.html`/`app/public/`.

Para a correção de `BudgetPage.tsx`, o contrato entre `aside` (formulário) e `main` (preview)
não muda — ambos continuam consumindo os mesmos dados via os mesmos hooks; só a árvore de
classes CSS do contêiner pai e dos dois painéis muda de incondicional para `lg:`-condicional.

## Dependências externas

| Dependência | Versão | Justificativa | Simulada nos testes por |
|---|---|---|---|
| `sharp-cli` (via `npx`, não persistida em `package.json`) | última estável no momento da implementação | Rasterizar SVG → PNG para ícones e imagem OG, uma única vez | N/A — não é código de produção nem roda em teste; gera arquivos binários versionados |

Nenhuma dependência nova entra em `package.json` (`dependencies` ou `devDependencies`).

## Impacto no contrato de operação

Nenhum alvo novo no `Makefile`. `make e2e` já roda Cypress (`npm run cy:run`) e Playwright
(`npm run pw:run`) em sequência (`Makefile:121-126`) — o novo spec Cypress
(`budget-builder-mobile.cy.js`) é coletado automaticamente por já estar em `app/cypress/e2e/`,
sem mudança de configuração. `make validate` (lint + test + coverage + build) continua sendo o
portão de `/bu:implement`; o novo spec Cypress só roda em `make e2e`, que **não** é parte de
`make validate` — mesma situação de todos os specs Cypress/Playwright já existentes no projeto.

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| `robots.txt` em `app/public/` fica servido em `https://otavioprocopio.github.io/orcamento_rapido/robots.txt`, não na raiz real do host (`https://otavioprocopio.github.io/robots.txt`) — por especificação (RFC 9309), diretivas de `robots.txt` só valem no root do host, então crawlers rígidos podem ignorá-lo | Média | Aceito conscientemente: é a prática padrão (ainda que não estritamente correta) para sites de projeto no GitHub Pages, e não piora nada — hoje não existe nenhum `robots.txt`, então o comportamento padrão dos crawlers já é permitir tudo. O ganho real de indexação vem do `sitemap.xml` + meta tags corretas, não do `robots.txt` em si. Registrado aqui para não ser reaberto como "bug" depois. |
| RNF-01 (Lighthouse SEO ≥ 90) não tem gate automatizado neste projeto | Alta (não é medido em CI) | Verificação manual, uma vez, contra o site publicado após o merge — documentado como passo de verificação em `tasks.md`, não como parte de `make validate`. Criar um gate de Lighthouse CI é desproporcional para uma métrica que decorre diretamente dos outros requisitos já testados (title, description, robots, sitemap, viewport, lang, https). |
| Ícones/imagem OG gerados via `npx sharp-cli` dependem de rede disponível no ambiente de implementação para baixar o pacote na hora | Baixa | Se falhar, gerar os PNGs por qualquer outra ferramenta de rasterização SVG→PNG disponível no ambiente (mesmo resultado, arquivo binário final é o que importa, não a ferramenta) |
| Corrigir as classes de `BudgetPage.tsx:624` pode ter efeito colateral não previsto no layout desktop | Baixa | `budget-builder-mobile.cy.js` roda com dois viewports (mobile e desktop) no mesmo spec, então uma regressão de desktop quebra o teste antes de chegar a `main`/produção |

## Conformidade com a constituição

| Princípio | Como este plano o respeita |
|---|---|
| Contrato de operação | Nenhum alvo novo necessário — `make validate` e `make e2e` já cobrem tudo que este plano precisa rodar; nenhuma ferramenta de linguagem é invocada fora do Makefile. |
| Arquitetura limpa | Desviado conscientemente e documentado (ver "Arquivos a criar ou alterar"): este projeto legado ainda não adotou `app/adapters|core|infra`; esta feature estende a única convenção de pastas que o projeto de fato usa hoje, em vez de introduzir uma segunda convenção conflitante no meio de uma feature de produto. Migração de arquitetura fica para uma feature dedicada (onda 2 de `as-is.md`), decisão amparada pelo Princípio 4. |
| Testes provam a entrega | Todo arquivo de produção alterado ou criado tem teste espelhado na tabela acima, incluindo os arquivos estáticos que têm conteúdo verificável (`index.html`, `robots.txt`, `sitemap.xml`, `manifest.json`); só os binários de imagem ficam sem teste, no mesmo precedente já aceito no projeto para `favicon.svg`/`icons.svg`. RF-05/06 (rolagem sem corte) é verificado por Cypress com viewport real, porque jsdom não calcula layout de verdade — Jest sozinho não provaria esse requisito. O teste de `usePageMetadata` cobre também o canonical dinâmico (achado do `/bu:analyze`): navegar para uma rota diferente muda o `href` de `<link rel="canonical">` para a URL absoluta daquela rota, não fica preso em `/`. |
| Simplicidade defensável | Zero dependências novas em `package.json`; RF-07 não é reimplementado por já existir; sitemap/robots ficam estáticos em vez de um gerador, porque o problema (10 rotas fixas) não justifica a complexidade de um gerador. |
