# Checklist — SEO, títulos por rota e builder utilizável em celular / Requisitos

> Avalia a **qualidade da especificação**, não do código. `[x]` significa "requisito
> aprovado por revisor humano". O agente não se autoaprova.

## Completude

- [ ] Todo requisito funcional (RF-01 a RF-08) tem ao menos um critério de aceite em DADO/QUANDO/ENTÃO
- [ ] Todo requisito não funcional (RNF-01 a RNF-03) tem critério mensurável, com número e unidade
- [ ] O que está fora de escopo está escrito (domínio próprio, PDF/impressão, PWA offline, sync remoto, multi-moeda/idioma, redesenho visual)
- [ ] A lista de 10 rotas do RF-01 é a mesma lista de rotas que existe hoje em produção (nenhuma rota real foi esquecida, nenhuma rota inexistente foi incluída)

## Clareza

- [ ] Nenhuma marca `[NECESSITA ESCLARECIMENTO]` restante no `spec.md`
- [ ] Nenhum requisito admite duas leituras conflitantes
- [ ] Nenhum requisito descreve implementação em vez de comportamento (RF-05/RF-06 falam de "rolar sem corte", não de qual classe CSS mudar)
- [ ] RF-06 deixa claro que é uma restrição sobre RF-05 (não regredir desktop), não um requisito novo independente

## Consistência

- [ ] Nenhum requisito contradiz outro (em especial: RF-08 exige instalabilidade sem prometer o que RF-08 explicitamente exclui — funcionamento offline)
- [ ] Nenhum requisito contradiz a constituição (Princípio 7 privacidade local-first, Princípio 8 site estático sem servidor, Princípio 9 BRL/pt-BR único) — nenhuma tela nova envia dado de negócio para fora do navegador, nenhuma exige backend
- [ ] Vocabulário do domínio é o mesmo em todo o documento (ex.: "builder"/"construtor de orçamento", "pipeline"/"funil de vendas" usados de forma consistente)
- [ ] A tabela `Esclarecimentos` reflete fielmente o que foi respondido pelo usuário, sem reinterpretação

## Testabilidade

- [ ] Todo critério de aceite pode virar cenário executável sem reinterpretação
- [ ] O critério de RF-05/RF-06 (rolagem completa sem corte) é verificável de forma objetiva (não depende de julgamento subjetivo de "ficou bonito")
- [ ] O critério de RF-03 (prévia de compartilhamento) é verificável sem depender de uma rede social específica continuar existindo/funcionando do jeito que funciona hoje
- [ ] Todo caminho de erro relevante tem cenário próprio (ex.: sitemap.xml com URL que não existe mais, deveria ser detectável)
