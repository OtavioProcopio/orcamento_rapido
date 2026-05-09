# Gerador de Orçamento

Sistema fullstack moderno para emissão e gestão de orçamentos profissionais. O foco é simples: dar ao MEI uma ferramenta direta, confiável e rápida para transformar operação manual em processo digital.

## Objetivo

- Atender microempreendedores e autônomos que precisam gerar orçamentos com agilidade.
- Reduzir retrabalho operacional com uma base técnica previsível.
- Sustentar evolução de produto com disciplina de engenharia.

## Stack Tecnológica

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18+ |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Build | Vite |
| Testes | Jest |
| Backend/Data | Supabase |

Nota: o repositório atual concentra o frontend e a esteira de qualidade. A camada Supabase faz parte da stack prevista do sistema.

## Arquitetura e Qualidade

- Estrutura guiada por princípios de Clean Architecture e SOLID.
- Validação automatizada via `Makefile`.
- Cobertura de testes acima de `85%`.
- Pipeline local consolidado com lint, testes, cobertura e build.
- Ambiente padronizado com Dev Container.

## Estrutura do Repositório

| Caminho | Responsabilidade |
| --- | --- |
| `/app` | Código-fonte do frontend, dependências, testes e configurações de build |
| `/.devcontainer` | Ambiente isolado de desenvolvimento com Docker/Dev Container |
| `/docs` | Documentação técnica e relatórios do sistema |

## Como Executar

### Ambiente

1. Abra o projeto em um ambiente compatível com Dev Containers.
2. Suba o container a partir de `/.devcontainer`.
3. No terminal do workspace, execute os comandos do `Makefile`.

### Comandos Principais

| Comando | Função |
| --- | --- |
| `make install` | Instala as dependências do app |
| `make lint` | Executa o ESLint |
| `make test` | Executa os testes unitários |
| `make coverage` | Gera e valida a cobertura |
| `make build` | Gera o build de produção |
| `make validate` | Orquestra lint, testes, cobertura e build |
| `make e2e` | Executa o fluxo E2E |
| `make release VERSION=v0.1.0` | Cria tag semântica anotada |

## Fluxo de Trabalho

| Branch | Papel |
| --- | --- |
| `develop` | Integra novas features, ajustes e validações contínuas |
| `main` | Recebe código estabilizado, releases e tags de versão |

Regras práticas:

- Novas features entram por `develop`.
- Merge em `main` deve ocorrer apenas com validação aprovada.
- Releases usam versionamento semântico com tags `vX.Y.Z`.
