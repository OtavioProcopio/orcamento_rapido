# Diagramas do Projeto

## Arquitetura Funcional

```mermaid
flowchart LR
    U[MEI / Usuario] --> L[Landing Page]
    U --> D[Dashboard]
    U --> B[Builder]
    U --> P[Profile]
    U --> M[Data Management]

    B --> C[Componentes React]
    D --> C
    P --> C
    M --> C

    C --> H[Hooks de dominio]
    H --> V[Validacao e calculos]
    H --> S[Storage Adapter]
    S --> I[(IndexedDB)]

    B --> PR[Preview do Orcamento]
    PR --> PDF[window.print / PDF]
```

## Fluxo de Validacao e Release

```mermaid
flowchart TD
    F[Feature branch] --> PR[Pull Request para develop]
    PR --> DV[develop]
    DV --> CI[GitHub Actions CI]
    CI --> MV[make validate]
    MV -->|Falha| BL[Promocao bloqueada]
    MV -->|Sucesso em push| PM[Workflow Promote Main]
    PM --> FF[Atualiza main]
    FF --> TG[Cria nova tag vX.Y.Z]
```

## Pipeline do Makefile

```mermaid
flowchart LR
    V[make validate] --> L[make lint]
    V --> T[make test]
    V --> C[make coverage]
    V --> B[make build]
```

## Regra Operacional

- `develop` e a branch de integracao.
- `make validate` e a porta de qualidade local e remota.
- `main` deve refletir apenas commit aprovado em `develop`.
- Cada promocao automatica deve gerar `tag +1` no padrao `patch`.
