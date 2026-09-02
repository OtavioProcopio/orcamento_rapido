# Checklist — SEO, títulos por rota e builder utilizável em celular / Acessibilidade e mobile

> Avalia a **qualidade da especificação**, não do código. `[x]` significa "requisito
> aprovado por revisor humano". O agente não se autoaprova.

## Completude

- [ ] A spec define o que conta como "smartphone" de forma verificável (largura de tela, breakpoint), não só a palavra "celular"
- [ ] A spec cobre tanto o formulário quanto o preview do builder (RF-05), não só um dos dois
- [ ] A spec exige explicitamente que a experiência de desktop não regrida (RF-06), não deixa isso implícito
- [ ] A spec cobre a interação por toque no pipeline (RF-07) sem depender de arrastar

## Clareza

- [ ] "Sem que nenhuma parte fique inacessível ou cortada" (RF-05) é um critério que duas pessoas diferentes leriam da mesma forma
- [ ] Fica claro que RF-07 não remove a interação de arrastar já existente para quem usa mouse

## Consistência

- [ ] RF-05/RF-06/RF-07 não entram em conflito com o Princípio 8 da constituição (site estático, sem servidor) — nenhuma correção de mobile depende de backend
- [ ] A meta de instalabilidade (RF-08) está consistente com o restante do produto ser 100% local (nenhuma promessa de sincronização entre dispositivos via instalação do app)

## Testabilidade

- [ ] RF-05/RF-06 podem ser verificados com uma ferramenta real de emulação de viewport (não dependem de "parecer bom" a olho)
- [ ] RF-07 pode ser verificado em um dispositivo ou emulação sem mouse, sem ambiguidade sobre o que conta como sucesso
- [ ] RF-08 tem um critério objetivo de sucesso (app aparece como instalável, ícone e nome corretos), não só "parece um app"
