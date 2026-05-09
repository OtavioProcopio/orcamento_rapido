# Proteção de Branches

Para manter a `main` protegida e permitir release apenas de código validado:

1. No GitHub, abra `Settings > Branches`.
2. Crie uma regra de proteção para a branch `main`.
3. Habilite `Require a pull request before merging`.
4. Habilite `Require status checks to pass before merging`.
5. Selecione o check `validate` do workflow `CI`.
6. Permita que o GitHub Actions bypass a proteção da `main`, ou use um token/PAT dedicado com permissão de escrita para a automação de promoção.
7. Opcionalmente, habilite `Require branches to be up to date before merging`.

Fluxo sugerido:

- `develop`: branch de integração usada pelo workflow `.github/workflows/ci.yml`.
- `main`: recebe apenas o commit aprovado em `develop` pela automação `.github/workflows/promote-main.yml`.
- releases: a automação gera tags `vX.Y.Z` com incremento automático de `patch`.
- contingência local: `make release VERSION=v0.1.0`.
