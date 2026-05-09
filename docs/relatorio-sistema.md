# Relatório do Sistema Orça Rápido

Data da revisão: 2026-05-07

## Resumo executivo

O Orça Rápido evoluiu de MVP local/demo para um sistema focado em MEIs, consolidando-se como uma ferramenta 100% frontend. Ele roda puramente local (IndexedDB) e não exige mensalidade nem login, priorizando agilidade na criação de propostas com aparência profissional.

Esta rodada de atualizações resolveu um dos maiores riscos locais: o backup de dados. Criamos uma nova rota dedicada para gestão (`/data`) a fim de desafogar o Dashboard (HomePage), garantindo assim um layout mais limpo no histórico de propostas e oferecendo ao microempreendedor uma maneira explícita de guardar seu trabalho na nuvem ou pen drive, mitigando a perda de um histórico armazenado estritamente no browser.

Minha avaliação atual é: **Pronto para piloto escalável para MEIs (com aviso de uso de cache).** O foco da aplicação é entregar orçamentos sem ruído ou cadastro forçado.

## Estado atual confirmado

Comandos executados nesta revisão:

- Testes globais e cobertura continuam dentro dos limites esperados (acima de 70% globais).
- Artefatos mortos (`app/coverage/`, `docs/referencia.md`, código in-line na `HomePage`) devidamente removidos.

## Como o sistema funciona hoje

- **`/`**: Landing page otimizada com novo foco de vendas para o MEI (criar, exportar e vender rápido sem mensalidades).
- **`/dashboard`**: Histórico local agora livre da poluição de botões inline limitados, focando em busca, filtragem e geração de PDF.
- **`/builder`**: Construtor e gerador com preview, aplicando regras de descontos, validades, formas de pagamento via formulários controlados.
- **`/data`**: **Nova página** centralizando ações críticas de controle: Exportar Backup JSON, exportar CSV para planilhas e importar backup no browser.
- **`/profile`**: Configuração dos dados de contato, PIX, logotipo para estampar a proposta.
- Persistência Principal garante estabilidade com IndexedDB por meio do `storageAdapter`.
- Impressão segue usando `window.print()`.

## O que foi melhorado (Gargalos resolvidos)

1. **Gestão de Dados Local Refinada**: A HomePage contava com exportações inline não escaláveis (estado poluído com inputs escondidos/refs e métodos espalhados na main screen). Movido para a página `/data`.
2. **Nova Rota de Exportação/Importação (`DataManagementPage`)**: Com a nova tela limpa e de fácil uso, o MEI não perde o seu histórico ao limpar cache – ele tem uma responsabilidade ativa de baixar o arquivo JSON.
3. **Limpeza Arquitetural**: Deleção massiva de ruídos: pasta `/app/coverage` e `docs/referencia.md` antiga.
4. **Otimização do Onboarding do MEI**: A tela de chegada (`LandingPage`) ganhou copy-writing mais voltado a negócios e vendas rápidas, para engajar perfis sem muito conhecimento técnico.

## Pendências atuais / Faltantes para Produto de Massa

1. **Compartilhamento Direto:** WhatsApp/Email para enviar os detalhes básicos enquanto manda o PDF por anexo.
2. **Validação Completa (CPF/CNPJ):** Máscaras e logs de negócio rígidos não implementados em algumas frentes do App (somente string vazia bloqueada).
3. **Prevenção de Perdas de Dados (Unsaved changes):** Prompt local de _"Tem certeza que deseja sair?"_ durante uma navegação dentro do `/builder` ainda falta.
4. **Status Real de Conversão:** Transformar status passivos em Kanban geraria um ótimo produto de pipeline de vendas no futuro.
5. **Integração E2E**: Testes limitados ao sandboxing atual de ports.

## Prioridade recomendada

### P0 - Antes do GTM / Open Launch

1. Adicionar o "BeforeUnload" ou validação `Leave Route` para o Builder, garantindo que o usuário seja alertado ao fechar navegador com rascunho de orçamento longo não salvo.
2. Criar política de privacidade, termo de uso e consentimento explícito.
