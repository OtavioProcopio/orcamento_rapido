# Gerador de Orçamento

Sistema para emissão e gestão de orçamentos profissionais com foco em MEIs e autônomos. O objetivo é reduzir operação manual, padronizar o processo e manter previsibilidade técnica na evolução do produto.

## Objetivo

- Atender microempreendedores e autônomos que precisam gerar orçamentos com agilidade.
- Reduzir retrabalho operacional com uma base técnica previsível.
- Sustentar evolução de produto com disciplina de engenharia.

## Stack Tecnológica

| Camada | Tecnologia |
| --- | --- |
| Frontend | React |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Build | Vite |
| Testes | Jest |

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
| `develop` | Branch de integração validada por CI |
| `main` | Branch de release atualizada somente após CI verde em `develop` |

Regras práticas:

- Novas features entram por `develop`.
- Todo `push` em `develop` executa `make validate`.
- Se o CI de `develop` passar, a automação promove o mesmo commit para `main`.
- Cada promoção cria uma nova tag semântica `vX.Y.Z` com incremento automático de `patch`.
