import { defineConfig } from "@playwright/test";

// Suíte dedicada e separada do Cypress: existe só para os poucos cenários
// que exigem uma janela/aba de verdade (window.open), algo que o Cypress
// não suporta porque roda o app dentro de um iframe da própria interface
// dele. Ver playwright/print-window.spec.ts para o porquê disso importa.
export default defineConfig({
  testDir: "./playwright",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
  },
});
