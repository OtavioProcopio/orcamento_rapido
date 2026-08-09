import {
  buildBudgetPrintHtml,
  printBudget,
} from "../../utils/printBudget";
import type { Budget, MeiProfile } from "../../types";

const baseBudget: Budget = {
  id: "budget-1",
  number: 42,
  status: "sent",
  createdAt: "2026-08-01T12:00:00.000Z",
  client: { name: "Cliente Impressão" },
  items: [
    {
      id: "item-1",
      descricao: "Servico",
      quantidade: 2,
      unidade: "UN",
      valorUnitario: 50,
    },
  ],
  modules: { showTerms: true, showSignature: true },
  totals: { subtotal: 100, discount: 0, total: 100 },
};

const profile: MeiProfile = {
  id: "profile-1",
  companyName: "Empresa Teste",
  userName: "Responsavel",
  phone: "11999999999",
  pixKey: "pix@teste.com",
  createdAt: "2026-08-01T12:00:00.000Z",
};

class FakePrintWindow {
  document: {
    open: jest.Mock;
    write: jest.Mock;
    close: jest.Mock;
    fonts?: { ready: Promise<unknown> };
  } = {
    open: jest.fn(),
    write: jest.fn(),
    close: jest.fn(),
  };
  focus = jest.fn();
  print = jest.fn();
  closed = false;
  close = jest.fn(() => {
    this.closed = true;
  });
  private listeners: Record<string, Array<() => void>> = {};
  addEventListener = jest.fn((event: string, handler: () => void) => {
    this.listeners[event] = [...(this.listeners[event] ?? []), handler];
  });
  dispatch(event: string) {
    this.listeners[event]?.forEach((handler) => handler());
  }
}

describe("printBudget utils", () => {
  describe("buildBudgetPrintHtml", () => {
    it("includes budget number, client, total and the banner", () => {
      const html = buildBudgetPrintHtml(baseBudget, profile);

      expect(html).toContain("Cliente Impressão");
      expect(html).toContain("100,00");
      expect(html).toContain("orcamento-42");
      expect(html).toContain("Orçamento digital gratuito criado por");
    });

    it("shows the default banner when the budget has no custom footerText", () => {
      const html = buildBudgetPrintHtml(
        { ...baseBudget, modules: { ...baseBudget.modules, footerText: undefined } },
        profile,
      );

      expect(html).toContain("Orçamento digital gratuito criado por");
    });

    it("shows the custom footerText instead of the default banner when set", () => {
      const html = buildBudgetPrintHtml(
        {
          ...baseBudget,
          modules: { ...baseBudget.modules, footerText: "Rodapé customizado" },
        },
        profile,
      );

      expect(html).toContain("Rodapé customizado");
      expect(html).not.toContain("Orçamento digital gratuito criado por");
    });

    it("includes the validity window when validUntil is set", () => {
      const html = buildBudgetPrintHtml(
        { ...baseBudget, validUntil: "2026-08-08T12:00:00.000Z" },
        profile,
      );

      expect(html).toContain("Validade");
      expect(html).toContain("7 dias");
    });

    it("omits the validity window when validUntil is not after createdAt", () => {
      const html = buildBudgetPrintHtml(
        { ...baseBudget, validUntil: baseBudget.createdAt },
        profile,
      );

      expect(html).not.toContain("Validade");
    });

    it("overrides body min-height so the app's full-viewport gradient rule doesn't force a phantom blank page", () => {
      // index.css define `body { min-height: 100vh }` pra manter o
      // gradiente de fundo do app cobrindo a tela toda — essa regra é
      // clonada pra dentro da janela de impressão junto com o resto da
      // folha de estilo, e sem essa sobrescrita ela força o body a ficar
      // tão alto quanto o viewport (bem maior que o conteúdo do
      // orçamento), estourando pra uma segunda página em branco.
      const html = buildBudgetPrintHtml(baseBudget, profile);

      expect(html).toMatch(/html,\s*body\s*{[^}]*min-height:\s*0/);
    });

    it("includes payment terms and observations when present", () => {
      const html = buildBudgetPrintHtml(
        {
          ...baseBudget,
          paymentTerms: "PIX à vista",
          terms: "Garantia de 30 dias",
        },
        profile,
      );

      expect(html).toContain("PIX à vista");
      expect(html).toContain("Garantia de 30 dias");
    });
  });

  describe("printBudget", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns false and does nothing else when the popup is blocked", () => {
      const openWindow = jest.fn(() => null);

      const result = printBudget(baseBudget, profile, openWindow);

      expect(result).toBe(false);
      expect(openWindow).toHaveBeenCalledWith("", "_blank");
    });

    it("writes the budget HTML into the opened window and triggers print", () => {
      const fakeWindow = new FakePrintWindow();
      const openWindow = jest.fn(() => fakeWindow as unknown as Window);

      const result = printBudget(baseBudget, profile, openWindow);

      expect(result).toBe(true);
      expect(fakeWindow.document.open).toHaveBeenCalled();
      expect(fakeWindow.document.write).toHaveBeenCalledWith(
        expect.stringContaining("Cliente Impressão"),
      );
      expect(fakeWindow.document.close).toHaveBeenCalled();

      // print() só deve disparar depois do atraso de segurança, não na hora.
      expect(fakeWindow.print).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(fakeWindow.focus).toHaveBeenCalled();
      expect(fakeWindow.print).toHaveBeenCalled();
    });

    it("does not auto-close the print window on afterprint", () => {
      // Fechar sozinho em "afterprint" foi tentado e removido: em mobile a
      // geração do PDF é assíncrona e pode continuar rodando depois do
      // evento disparar, então fechar ali arrisca cortar a impressão no
      // meio. O usuário fecha a aba manualmente.
      const fakeWindow = new FakePrintWindow();
      const openWindow = jest.fn(() => fakeWindow as unknown as Window);

      printBudget(baseBudget, profile, openWindow);
      fakeWindow.dispatch("afterprint");

      expect(fakeWindow.close).not.toHaveBeenCalled();
      expect(fakeWindow.addEventListener).not.toHaveBeenCalledWith(
        "afterprint",
        expect.anything(),
      );
    });

    it("waits for document.fonts.ready before printing when available", async () => {
      const fakeWindow = new FakePrintWindow();
      let resolveFonts: () => void = () => {};
      fakeWindow.document.fonts = {
        ready: new Promise((resolve) => {
          resolveFonts = () => resolve(undefined);
        }),
      };
      const openWindow = jest.fn(() => fakeWindow as unknown as Window);

      printBudget(baseBudget, profile, openWindow);

      await jest.advanceTimersByTimeAsync(150);
      expect(fakeWindow.print).not.toHaveBeenCalled();

      resolveFonts();
      await jest.advanceTimersByTimeAsync(0);
      expect(fakeWindow.print).toHaveBeenCalled();
    });

    it("prints anyway if fonts.ready never resolves, after the safety timeout", async () => {
      const fakeWindow = new FakePrintWindow();
      fakeWindow.document.fonts = {
        ready: new Promise(() => {}), // nunca resolve
      };
      const openWindow = jest.fn(() => fakeWindow as unknown as Window);

      printBudget(baseBudget, profile, openWindow);

      await jest.advanceTimersByTimeAsync(150 + 2000);
      expect(fakeWindow.print).toHaveBeenCalled();
    });

    it("does not throw when the window's print() call fails", () => {
      const fakeWindow = new FakePrintWindow();
      fakeWindow.print.mockImplementation(() => {
        throw new Error("print blocked");
      });
      const openWindow = jest.fn(() => fakeWindow as unknown as Window);

      printBudget(baseBudget, profile, openWindow);

      expect(() => jest.runAllTimers()).not.toThrow();
    });

    it("defaults to window.open when no custom opener is provided", () => {
      const fakeWindow = new FakePrintWindow();
      const openSpy = jest
        .spyOn(window, "open")
        .mockReturnValue(fakeWindow as unknown as Window);

      const result = printBudget(baseBudget, profile);

      expect(result).toBe(true);
      expect(openSpy).toHaveBeenCalledWith("", "_blank");
      openSpy.mockRestore();
    });
  });
});
