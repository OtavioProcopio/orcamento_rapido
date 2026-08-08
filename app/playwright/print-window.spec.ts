import { test, expect } from "@playwright/test";

// Regressão: window.open(url, target, "noopener") sempre retorna null por
// especificação do navegador — isso quebrou a impressão de verdade em
// produção (a aba abria em about:blank e ficava travada lá, sem conteúdo
// nem chamada de print()), mas passou despercebido porque os testes
// anteriores mockavam o próprio window.open, verificando a simulação em
// vez do comportamento real. O Cypress não consegue testar isso: ele roda
// o app dentro de um iframe da própria interface e sempre anula
// window.open, com ou sem noopener. Este teste usa Playwright
// especificamente porque ele suporta abrir e inspecionar uma janela/aba
// real gerada por window.open.
test("opens a real, printable popup window with the budget content when clicking print", async ({
  page,
  context,
}) => {
  await page.goto("/dashboard");

  await page.evaluate(() => {
    window.localStorage.setItem(
      "@OrcaRapido:mei_profile",
      JSON.stringify({
        companyName: "Empresa Playwright",
        userName: "Responsavel",
        phone: "11999999999",
        pixKey: "pix@teste.com",
      }),
    );
  });
  await page.reload();

  await page.getByRole("button", { name: "Novo Orçamento" }).click();
  await page
    .getByRole("textbox", { name: /Nome do Cliente/i })
    .fill("Cliente Playwright Real");
  await page.getByRole("button", { name: /2\. Itens e Valores/i }).click();
  await page
    .getByPlaceholder("Ex: Desenvolvimento de Site")
    .fill("Servico real");
  await page.locator("input[name='items.0.valorUnitario']").fill("321");
  await page.getByRole("button", { name: "Salvar Orçamento" }).click();
  await expect(page.getByText("Meu Painel")).toBeVisible({ timeout: 15000 });

  const [popup] = await Promise.all([
    context.waitForEvent("page", { timeout: 5000 }),
    page.getByRole("button", { name: "Imprimir / Salvar PDF" }).click(),
  ]);

  await popup.waitForLoadState("load");
  const bodyText = await popup.evaluate(() => document.body.innerText);

  expect(bodyText).toContain("Cliente Playwright Real");
  expect(bodyText).toContain("321,00");
  expect(bodyText).toContain("Orçamento digital gratuito criado por");

  // Sem erro de pop-up bloqueado na página original — se window.open
  // tivesse voltado null (o bug do "noopener"), é essa mensagem que
  // apareceria em vez do popup de verdade.
  await expect(
    page.getByText("Não foi possível abrir a janela de impressão"),
  ).not.toBeVisible();

  // Regressão: a classe utilitária aspect-[1/1.4142] do Tailwind força a
  // altura da página a partir da largura (210mm), empurrando o conteúdo
  // pra uma altura de A4 inteira mesmo com pouco conteúdo — isso estourava
  // pra uma segunda página em branco em pipelines de impressão mobile que
  // usam Letter (mais curto que A4) por padrão. Com um único item, o
  // conteúdo real é bem mais baixo que uma A4 inteira (~1122px a 96dpi);
  // este teto garante que a altura acompanha o conteúdo, não o papel.
  const client = await popup.context().newCDPSession(popup);
  await client.send("Emulation.setEmulatedMedia", { media: "print" });
  const bodyHeight = await popup.evaluate(() => document.body.scrollHeight);
  expect(bodyHeight).toBeLessThan(900);
});
