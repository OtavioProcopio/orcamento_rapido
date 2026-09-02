# Especificação — SEO, títulos por rota e builder utilizável em celular

> Descreve **o quê** e **por quê**. Não descreve como implementar: sem nome de biblioteca,
> sem esquema de banco, sem assinatura de função.

## Problema

O Orça Rápido já funciona tecnicamente (deploy estável no GitHub Pages, PDF funcional em PC e
celular, CI verde, cobertura de testes acima de 90%), mas carece da camada que transforma um
projeto técnico em um produto usado por pessoas de verdade:

1. **Ninguém encontra o app por busca ou compartilhamento.** O `index.html` tem um único
   `<title>` estático ("Orca Rapido", sem acento) igual em todas as rotas, sem meta
   description, Open Graph, Twitter Card, `robots.txt` ou `sitemap.xml`. Compartilhar qualquer
   página do app (ex.: pelo WhatsApp) não gera prévia útil, e buscadores não têm o que indexar.
2. **A tela mais usada do app fica ruim no celular.** A tela de construção de orçamento
   (builder) usa um layout de duas colunas com altura fixa pensado para desktop; em celular, o
   formulário e o preview do orçamento disputam a mesma altura fixa e ficam cortados, com
   rolagem interna confusa em vez de uma rolagem de página única.
3. **O funil de vendas (pipeline) não funciona por toque.** A movimentação de orçamentos entre
   etapas depende de arrastar com mouse, o que não existe em celular/tablet.

O público-alvo (MEIs e autônomos) majoritariamente acessa e opera esse tipo de ferramenta pelo
celular — esses três pontos juntos comprometem diretamente a percepção de profissionalismo e o
uso real do produto.

## Objetivo

Quando esta feature estiver pronta:

- cada rota principal do app tem título e descrição próprios, corretos e específicos daquela
  tela, tanto para o navegador quanto para prévias de compartilhamento;
- o site é indexável por buscadores (robots.txt + sitemap.xml refletindo as rotas reais);
- a tela de construção de orçamento é totalmente utilizável em smartphone — o usuário consegue
  ver e rolar até o fim do formulário e até o fim do preview, sem nenhum trecho cortado ou
  inacessível, sem piorar a experiência atual em desktop;
- é possível mover um orçamento entre etapas do pipeline por toque, sem depender só de arrastar
  com mouse.

## Fora de escopo

- Compra ou configuração de domínio próprio (`CNAME` customizado) — decisão de custo e infra
  que cabe ao usuário fora desta feature; o app continua servido em `*.github.io`.
- Qualquer mudança na geração ou no layout de impressão do orçamento (`window.print()`,
  `printBudget.ts`, regras `@media print`) — já funciona bem em PC e celular segundo o próprio
  usuário; não deve ser tocado por esta feature.
- PWA completo com funcionamento offline (service worker com cache de app) — esta feature cobre
  apenas instalabilidade (ícone na tela inicial via `manifest.json` + `apple-touch-icon`, ver
  RF-08); suporte offline completo é uma feature futura, não esta.
- Qualquer forma de sincronização remota de dados, backend, login ou API própria — proibido
  pelo Princípio 8 da constituição (site estático, sem servidor).
- Suporte a múltiplas moedas ou múltiplos idiomas — proibido pelo Princípio 9 da constituição
  (BRL e pt-BR únicos).
- Redesenho visual completo das páginas (rebranding, nova paleta, novo design system) — o
  escopo aqui é SEO + utilizabilidade mobile do builder + interação por toque no pipeline, não
  uma reforma estética geral.

## Personas e cenários de uso

- **MEI/autônomo buscando a ferramenta pela primeira vez**, via busca no Google ou link
  compartilhado por outro MEI no WhatsApp/grupo de trabalho — hoje não encontra nada útil na
  busca nem numa prévia de link.
- **MEI usando o app pelo celular no dia a dia**, montando um orçamento em campo (na casa do
  cliente, num evento) — hoje o builder no celular corta conteúdo e atrapalha o fluxo de
  preencher e conferir o orçamento antes de enviar.
- **MEI gerenciando vários orçamentos em andamento pelo celular**, tentando mover um orçamento
  de "enviado" para "aprovado" no pipeline — hoje não consegue, porque a interação depende de
  arrastar com mouse.

## Requisitos funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| RF-01 | O sistema deve exibir um `document.title` específico e correto (com a grafia "Orça Rápido") para cada rota principal (`/`, `/dashboard`, `/builder`, `/profile`, `/clients`, `/pipeline`, `/data`, `/privacy`, `/terms`, `/storage-notice`), atualizado ao navegar entre elas sem recarregar a página. | obrigatório |
| RF-02 | O sistema deve expor meta description específica por rota principal, coerente com o conteúdo daquela tela. | obrigatório |
| RF-03 | O sistema deve expor metadados Open Graph e Twitter Card (título, descrição, imagem) para a rota `/`, de forma que compartilhar o link do app gere uma prévia útil. A imagem de prévia (1200×630) é gerada como parte desta feature — uma arte simples com o nome do produto sobre fundo sólido, sem depender de logo externa. | obrigatório |
| RF-04 | O sistema deve expor `robots.txt` permitindo indexação e `sitemap.xml` listando as rotas públicas navegáveis do app. | obrigatório |
| RF-05 | A tela de construção de orçamento deve permitir, em largura de tela de smartphone, rolar até o fim do formulário e até o fim do preview do orçamento, sem que nenhuma parte de nenhum dos dois fique inacessível ou cortada. | obrigatório |
| RF-06 | A experiência atual da tela de construção de orçamento em telas de desktop (layout de duas colunas lado a lado) não pode regredir como consequência da correção do RF-05. | obrigatório |
| RF-07 | O sistema deve oferecer, em cada card do pipeline, um menu "mover para..." que lista as etapas possíveis e move o orçamento para a etapa escolhida ao toque — sem exigir arrastar. O arrastar com mouse em desktop continua funcionando como hoje. | obrigatório |
| RF-08 | O sistema deve ser instalável na tela inicial de um smartphone (ícone e nome próprios), via manifesto de aplicação web e ícone dedicado para iOS, sem exigir funcionamento offline. | obrigatório |

## Requisitos não funcionais

| ID | Requisito | Critério mensurável |
|---|---|---|
| RNF-01 | Qualidade de SEO técnico da rota `/` mensurável por auditoria automatizada | pontuação da categoria SEO do Lighthouse ≥ 90 de 100 |
| RNF-02 | Cobertura de testes automatizados dos arquivos alterados por esta feature | ≥ 90% em statements, branches, functions e lines (Princípio 3/RNF da constituição) |
| RNF-03 | `make validate` (lint + test + coverage + build) permanece verde após a mudança | 0 falhas |

## Critérios de aceite

```gherkin
# language: pt
Funcionalidade: SEO, títulos por rota e builder utilizável em celular

  Cenário: Título correto por rota (RF-01)
    Dado que o usuário está em qualquer rota do app
    Quando a página termina de carregar
    Então document.title contém um texto específico daquela rota, com "Orça Rápido" grafado corretamente
    Mas o título não permanece o texto genérico igual ao de outra rota

  Cenário: Meta description por rota (RF-02)
    Dado que o usuário navega para uma rota principal do app
    Quando o HTML da página é inspecionado
    Então existe uma tag meta description com um texto específico daquela rota
    Mas a meta description não fica vazia nem idêntica em duas rotas de conteúdo diferente

  Cenário: Prévia de compartilhamento (RF-03)
    Dado que alguém cola o link da rota "/" em uma rede social ou aplicativo de mensagem
    Quando a prévia do link é gerada
    Então aparecem título, descrição e imagem coerentes com o produto
    Mas a prévia não aparece vazia ou com dados genéricos do GitHub Pages

  Cenário: Indexação por buscadores (RF-04)
    Dado um crawler de busca
    Quando ele acessa "/robots.txt" e "/sitemap.xml" do site publicado
    Então recebe uma diretiva de permissão de indexação e uma lista de URLs válidas do site
    Mas nenhuma URL listada no sitemap retorna erro ao ser acessada

  Cenário: Builder rolável em smartphone (RF-05, RF-06)
    Dado um usuário em uma tela com largura de smartphone (menor que o breakpoint "lg" do app) na tela de construção de orçamento
    Quando ele preenche o formulário e quer conferir o preview completo
    Então consegue rolar a página até o fim do formulário e até o fim do preview, sem nenhum trecho inacessível
    Mas em largura de desktop o layout de duas colunas lado a lado continua se comportando como hoje

  Cenário: Mover orçamento no pipeline por toque (RF-07)
    Dado um usuário em um dispositivo sem mouse (touch) na tela de pipeline
    Quando ele toca no menu "mover para..." de um card e escolhe uma etapa de destino
    Então o orçamento passa a aparecer na coluna da etapa escolhida
    Mas o arrastar com mouse em desktop continua funcionando como hoje

  Cenário: Instalar o app na tela inicial (RF-08)
    Dado um usuário acessando o site pelo navegador do celular
    Quando ele usa a opção "adicionar à tela inicial" do navegador
    Então o app é instalado com ícone e nome próprios, abrindo em tela cheia como um app
    Mas a instalação não exige nem promete funcionamento offline
```

## Ambiguidades

Nenhuma pendente — ver tabela `Esclarecimentos` abaixo.

## Esclarecimentos

| Pergunta | Resposta | Data |
|---|---|---|
| Não existe imagem de marca pronta para Open Graph (1200×630). O usuário fornece uma logo, ou o app gera uma imagem simples? | Gerar uma imagem simples (nome do produto sobre fundo sólido), sem depender de arte externa. | 2026-09-01 |
| Como deve funcionar a movimentação por toque no pipeline (RF-07)? | Menu "mover para..." no card, listando as etapas possíveis. | 2026-09-01 |
| Instalabilidade como PWA (manifest.json + apple-touch-icon) entra nesta feature? | Sim — incluída como RF-08, limitada a instalabilidade, sem exigir funcionamento offline. | 2026-09-01 |

## Métricas de sucesso

- Pontuação SEO do Lighthouse na rota `/` publicada ≥ 90/100 (hoje, sem meta tags, tende a ficar bem abaixo disso).
- Compartilhar o link do app em uma rede social ou WhatsApp gera prévia com título, descrição e imagem (hoje gera prévia vazia/genérica).
- Em teste manual ou automatizado com viewport de smartphone, 100% do formulário e do preview do builder ficam acessíveis por rolagem, sem corte (hoje não ficam).
- Um orçamento pode ser movido entre todas as etapas do pipeline em um dispositivo touch sem usar mouse (hoje não é possível).
