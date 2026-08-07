# Relatório do Sistema Orça Rápido

Data da revisão: 2026-08-06

## Resumo executivo

O Orça Rápido é uma ferramenta 100% frontend para MEIs e autônomos criarem orçamentos profissionais. Roda puramente local (IndexedDB, com fallback e migração automática de `localStorage`), não exige mensalidade nem login.

Esta rodada foi uma auditoria completa seguida de uma passada de hardening: mapeamento de falhas, correção dos bugs críticos e funcionais encontrados, atualização de dependências vulneráveis, remoção de código morto, alinhamento a boas práticas de LGPD e elevação da cobertura de testes automatizados para acima de 90% (statements, branches, functions e lines), incluindo expansão da suíte E2E (Cypress) de 1 para 4 specs.

Minha avaliação atual é: **Pronto para piloto escalável para MEIs.** O pipeline de qualidade (`make validate` + `make e2e`) está 100% verde.

## O que foi encontrado e corrigido nesta rodada

1. **Suíte E2E estava quebrada.** O teste procurava um texto de CTA (`"Entrar no painel"`) que não existia mais na Landing após uma reescrita de copy anterior — e como `make validate` (o gate do CI) não roda E2E, isso não era detectado automaticamente. Corrigido com um `data-testid` estável no CTA, resiliente a mudanças futuras de copywriting.
2. **Bug de fuso horário em `formatDate`.** Datas no formato `YYYY-MM-DD` sofriam deslocamento de um dia em qualquer fuso atrás de UTC — ou seja, todo o público-alvo brasileiro. O bug ficava mascarado porque CI e devcontainer rodam em UTC por padrão. Corrigido tratando strings "date-only" sem conversão de fuso, e os testes agora rodam fixados em `America/Sao_Paulo` para não depender do fuso da máquina que executa.
3. **Bug crítico de digitação em campos numéricos**, descoberto rodando o E2E de ponta a ponta (não em revisão estática): limpar e redigitar quantidade/valor unitário/desconto/dias de validade embaralhava os dígitos (`2` e `50` viravam `20` e `500`), porque o campo controlado colapsava `""` para `0` a cada tecla e o React perdia a posição do cursor. Corrigido mantendo um estado intermediário válido enquanto o campo está vazio.
4. **Subtotal/total inconsistentes com moeda mista.** O tipo `BudgetItem` tinha um campo `moeda` (BRL/USD/EUR) nunca exposto na UI — ou seja, uma inconsistência latente sem seletor para acioná-la. Removido: o app é BRL-only, coerente com o restante do produto (PIX, CPF/CNPJ, `pt-BR` fixo).
5. **Importação de backup sem confirmação.** Selecionar um arquivo `.json` em `/data` substituía todo o histórico local imediatamente. Agora exige confirmação explícita, reaproveitando o mesmo modal acessível já usado para excluir/resetar.
6. **Dependências vulneráveis.** `npm audit fix` resolveu 8 de 14 vulnerabilidades (incluindo as que afetavam o bundle de produção). As 3 restantes são de dependências apenas de teste (Cypress) ou uma CVE de modo RSC do React Router que este app não usa.
7. **CSV injection na exportação.** Células que começam com `=`, `+`, `-` ou `@` (ex.: um nome de cliente `=cmd|calc!A1`) agora são neutralizadas antes de ir para o CSV exportado.
8. **Código morto removido**: `InputField`, `TextAreaField`, `Card` e `MonetizationBanner` nunca eram importados em nenhuma página, mas tinham testes — inflando a métrica de cobertura sem entregar valor real.
9. **LGPD**: a Landing não linkava política de privacidade/termos antes do cadastro (só aparecia depois, no Dashboard) — corrigido com um rodapé. As fontes (Manrope/Sora) vinham do CDN do Google a cada carregamento de página, contradizendo o discurso de "seus dados ficam só no seu navegador" — agora são auto-hospedadas (`public/fonts/`).

## Estado atual confirmado

- `make validate` (lint + testes + cobertura + build): **aprovado**.
- `make e2e` (4 specs, 12 verificações): **aprovado**.
- Cobertura: 98,1% statements / 90,29% branches / 95,73% functions / 99,15% lines — piso de 90% travado em `jest.config.cjs` e no `Makefile`.

## Como o sistema funciona hoje

- **`/`**: Landing page com CTA que leva a `/profile` (primeiro acesso) ou `/dashboard` (quem já tem perfil/orçamentos), com rodapé linkando as páginas legais.
- **`/dashboard`**: Histórico local com busca, filtragem, impressão, edição, duplicação e exclusão (com confirmação).
- **`/builder`**: Construtor com preview ao vivo, aplicando regras de descontos, validades, formas de pagamento.
- **`/data`**: Exportar Backup JSON, exportar CSV, importar backup (com confirmação antes de substituir o histórico).
- **`/profile`**: Dados de contato, PIX, logotipo.
- **`/privacy`, `/terms`, `/storage-notice`**: páginas legais, linkadas tanto na Landing quanto no Dashboard.
- Persistência via IndexedDB (`storageAdapter`), com fallback e migração automática de `localStorage` legado.
- Impressão via `window.print()`.

## Pendências / oportunidades para produto de massa

1. ~~Compartilhamento direto via WhatsApp~~ — **implementado**: botão "Compartilhar via WhatsApp" em cada orçamento do Dashboard, abre o `wa.me` com mensagem pronta (número do orçamento, empresa, total, validade e forma de pagamento) mirando o telefone do cliente quando cadastrado. Como o app não tem backend pra hospedar link nem anexar o PDF programaticamente, o envio do PDF em si continua pelo fluxo de impressão já existente. **Compartilhamento por Email** ainda não foi feito.
2. **Status como pipeline de vendas**: transformar os status passivos (rascunho/enviado/aprovado/...) em um Kanban simples.
3. **Infraestrutura de monetização**: hoje não existe backend, auth ou gateway de pagamento — nenhuma pré-condição técnica para vender um plano "Pro" com mensalidade. Antes de lançar cobrança, decidir entre (a) licença local simples desbloqueando features client-side, ou (b) backend mínimo com autenticação leve + gateway de pagamento, o que também muda a promessa de privacidade "tudo fica no seu navegador" para quem virar assinante.
4. **`docs/relatorio-sistema.md`** (este arquivo) deve ser atualizado a cada rodada relevante de mudanças para não ficar defasado em relação ao código — nesta auditoria encontramos pendências aqui registradas como abertas que já estavam implementadas no código havia tempo.
