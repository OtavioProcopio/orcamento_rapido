# Orça Rápido

> Identidade e princípios **deste** projeto. Este arquivo **é versionado** — é o que o time
> compartilha. Os princípios da organização ficam em `.specify/memory/constitution.md`, que o
> `/bu:constitution` gera a cada clone e o `.gitignore` mantém fora do git.

## Identidade

- **Projeto**: Orça Rápido
- **Tipo**: frontend (SPA estática)
- **Stack**: React 19 + TypeScript + Vite + Tailwind CSS 4, react-router-dom, react-hook-form + zod
- **Domínio**: geração e gestão de orçamentos profissionais para MEIs e autônomos brasileiros — 100% client-side, sem backend, sem login, sem mensalidade
- **Cobertura mínima acordada**: 90%

## Princípios específicos deste projeto

> Entram aqui, e só aqui, as regras que valem para **este** repositório e que não estão nos
> princípios da organização: restrição regulatória, SLA, compatibilidade obrigatória, limite de
> dependência, janela de manutenção. Cada princípio declara o que **proíbe** — princípio que não
> proíbe nada não é portão.

### Princípio 1 — Privacidade local-first (LGPD)

Dados de orçamento, cliente e perfil (empresa/MEI) nunca saem do navegador do usuário. Proíbe
qualquer chamada de rede — analytics incluído — que transmita conteúdo de negócio (nome de
cliente, valor, CNPJ/CPF, PIX etc.), não apenas evento anônimo de navegação. Qualquer
funcionalidade que exija enviar esses dados a um serviço externo (sync remoto, IA, exportação
para terceiro) exige opt-in explícito e visível do usuário antes do primeiro envio, não
ativação silenciosa por padrão.

### Princípio 2 — Site estático, sem servidor

O alvo de deploy é GitHub Pages (hospedagem puramente estática). Proíbe introduzir qualquer
funcionalidade que dependa de runtime de servidor, API route própria, ou SSR — se uma feature
precisar de backend, a decisão de adicionar infraestrutura de servidor é do usuário, feita
explicitamente antes da implementação, nunca assumida durante uma tarefa.

### Princípio 3 — BRL e pt-BR únicos

O produto opera exclusivamente em Real (BRL) e português brasileiro. Proíbe reintroduzir campo,
seletor ou lógica de multi-moeda ou multi-idioma sem decisão de produto explícita registrada —
o suporte a moeda múltipla já existiu no domínio (`BudgetItem.moeda`) e foi removido
deliberadamente por não ter uso real na UI, gerando inconsistência de cálculo.

## Emendas

| Versão | Data | O que mudou |
|---|---|---|
| 1.0.0 | 2026-09-01 | ratificação inicial |
