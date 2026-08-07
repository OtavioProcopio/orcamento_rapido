import {
  buildBudgetShareMessage,
  buildBudgetWhatsAppShareUrl,
  buildWhatsAppUrl,
} from "../../utils/whatsapp";
import type { Budget } from "../../types";

const baseBudget: Budget = {
  id: "budget-1",
  number: 42,
  status: "sent",
  createdAt: "2026-08-01T12:00:00.000Z",
  client: { name: "Cliente Teste", phone: "(11) 98888-7777" },
  items: [],
  modules: { showTerms: true, showSignature: true, removeAds: false },
  totals: { subtotal: 100, discount: 0, total: 100 },
};

describe("whatsapp utils", () => {
  describe("buildWhatsAppUrl", () => {
    it("builds a wa.me url targeting the given phone with country code 55", () => {
      const url = buildWhatsAppUrl("(11) 98888-7777", "Olá");
      expect(url).toBe("https://wa.me/5511988887777?text=Ol%C3%A1");
    });

    it("builds a wa.me url without a target number when phone is missing", () => {
      const url = buildWhatsAppUrl(undefined, "Olá");
      expect(url).toBe("https://wa.me/?text=Ol%C3%A1");
    });

    it("builds a wa.me url without a target number when phone is empty", () => {
      const url = buildWhatsAppUrl("", "Olá");
      expect(url).toBe("https://wa.me/?text=Ol%C3%A1");
    });
  });

  describe("buildBudgetShareMessage", () => {
    it("includes client name, proposal number, company and total", () => {
      const message = buildBudgetShareMessage(baseBudget, "Empresa Teste");

      expect(message).toContain("Olá, Cliente Teste!");
      expect(message).toContain("orçamento nº 42");
      expect(message).toContain("de Empresa Teste");
      expect(message).toContain("R$");
      expect(message).toContain("100,00");
    });

    it("falls back to a generic greeting when the client has no name", () => {
      const message = buildBudgetShareMessage(
        { ...baseBudget, client: { name: "" } },
        "Empresa Teste",
      );

      expect(message.startsWith("Olá! Segue")).toBe(true);
    });

    it("omits the company name segment when the profile has none", () => {
      const message = buildBudgetShareMessage(baseBudget, "");

      expect(message).toContain(`orçamento nº ${baseBudget.number}.`);
    });

    it("includes validity date when present", () => {
      const message = buildBudgetShareMessage(
        { ...baseBudget, validUntil: "2026-08-10T12:00:00.000Z" },
        "Empresa Teste",
      );

      expect(message).toContain("Válido até:");
    });

    it("omits validity date when absent", () => {
      const message = buildBudgetShareMessage(baseBudget, "Empresa Teste");
      expect(message).not.toContain("Válido até:");
    });

    it("includes payment terms when present", () => {
      const message = buildBudgetShareMessage(
        { ...baseBudget, paymentTerms: "PIX à vista" },
        "Empresa Teste",
      );

      expect(message).toContain("Forma de pagamento: PIX à vista");
    });

    it("omits payment terms when absent", () => {
      const message = buildBudgetShareMessage(baseBudget, "Empresa Teste");
      expect(message).not.toContain("Forma de pagamento");
    });
  });

  describe("buildBudgetWhatsAppShareUrl", () => {
    it("targets the client's phone number with the share message", () => {
      const url = buildBudgetWhatsAppShareUrl(baseBudget, "Empresa Teste");

      expect(url).toContain("https://wa.me/5511988887777?text=");
      expect(decodeURIComponent(url.split("text=")[1])).toContain(
        "orçamento nº 42",
      );
    });

    it("has no target number when the client has no phone", () => {
      const url = buildBudgetWhatsAppShareUrl(
        { ...baseBudget, client: { name: "Cliente Teste" } },
        "Empresa Teste",
      );

      expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    });
  });
});
