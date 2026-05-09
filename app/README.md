# Orça Rápido

Aplicação frontend para criar, salvar, editar, duplicar e imprimir orçamentos profissionais para MEIs e autônomos.

## Escopo Atual

- App 100% client-side, sem backend, autenticação ou contas.
- Persistência local no navegador com IndexedDB.
- Migração automática de dados antigos salvos em `localStorage`.
- Geração de PDF pelo fluxo nativo de impressão/salvar como PDF do navegador.

## Comandos

```bash
npm install
npm run lint
npm test -- --coverage --runInBand
npm run build
npm run cy:run
```

Na raiz do projeto também existem atalhos via `make`:

```bash
make validate
make e2e
make clean
```

## Arquitetura

- `src/pages`: telas principais de landing, dashboard, perfil e builder.
- `src/hooks`: hooks de perfil e orçamento com estado de carregamento/erro.
- `src/storage`: adaptador assíncrono de IndexedDB e migração legada.
- `src/utils`: schemas Zod, cálculo, formatação, arquivos e máscaras.
- `src/components`: componentes reutilizáveis e preview imprimível do orçamento.

## Testes

Cada funcionalidade nova deve vir com teste automatizado. A suíte cobre:

- schemas e cálculos;
- storage local e migração;
- hooks assíncronos;
- formulário de perfil;
- builder com validação;
- histórico com busca, edição, duplicação e confirmação acessível;
- fluxo E2E principal no Cypress.

O Jest possui thresholds globais de cobertura para evitar regressões.

## Limitações Conhecidas

- Os dados ficam apenas no navegador do usuário.
- Não há sincronização entre dispositivos.
- Não há backup automático remoto.
- A impressão depende do motor de impressão do navegador, embora o CSS tenha sido ajustado para documentos longos.
