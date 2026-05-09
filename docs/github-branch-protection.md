# Proteção de Branches

Para manter a `main` protegida e permitir merge apenas de código validado:

1. No GitHub, abra `Settings > Branches`.
2. Crie uma regra de proteção para a branch `main`.
3. Habilite `Require a pull request before merging`.
4. Habilite `Require status checks to pass before merging`.
5. Selecione o check `validate` do workflow `CI`.
6. Opcionalmente, habilite `Require branches to be up to date before merging`.

Fluxo sugerido:

- `main`: recebe apenas merges aprovados e com CI verde.
- `develop`: branch de integração usada pelo workflow `.github/workflows/ci.yml`.
- releases: crie tags semânticas com `make release VERSION=v0.1.0`.
