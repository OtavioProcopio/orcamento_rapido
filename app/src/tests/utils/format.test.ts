import { formatCurrency, formatDate, todayIsoDate } from "../../utils/format";

describe("format", () => {
  describe("formatCurrency", () => {
    it("formats BRL by default", () => {
      expect(formatCurrency(100)).toContain("100,00");
      expect(formatCurrency(100)).toContain("R$");
    });

    it("formats USD", () => {
      expect(formatCurrency(100, "USD")).toContain("100,00");
    });

    it("formats EUR", () => {
      expect(formatCurrency(100, "EUR")).toContain("100,00");
    });

    it("formats zero and negative values", () => {
      expect(formatCurrency(0)).toContain("0,00");
      expect(formatCurrency(-50)).toContain("50,00");
    });

    it("formats decimal values with rounding", () => {
      expect(formatCurrency(19.999)).toContain("20,00");
    });
  });

  describe("formatDate", () => {
    it("formats a date-only string (no time) without timezone shift", () => {
      // Este é o caso que quebrava antes da correção: em fusos atrás de UTC
      // (todo o Brasil), "2024-01-01" não pode exibir 31/12/2023.
      expect(formatDate("2024-01-01")).toBe("01/01/2024");
      expect(formatDate("2024-12-31")).toBe("31/12/2024");
    });

    it("formats a full ISO instant honoring the local timezone", () => {
      // Testes rodam fixados em America/Sao_Paulo (UTC-3). 15h UTC = 12h local,
      // mesmo dia calendário.
      expect(formatDate("2024-01-01T15:00:00.000Z")).toBe("01/01/2024");
    });

    it("converts an instant that crosses the day boundary to the correct local date", () => {
      // 01:00 UTC em 1º de janeiro é 22:00 de 31/12 em America/Sao_Paulo (UTC-3).
      // Esse comportamento é intencional: a data exibida reflete o instante real.
      expect(formatDate("2024-01-01T01:00:00.000Z")).toBe("31/12/2023");
    });

    it("returns a defined value for the current date", () => {
      expect(formatDate(new Date().toISOString())).toBeDefined();
    });

    it("returns the raw string for invalid dates", () => {
      expect(formatDate("invalid-date")).toBe("invalid-date");
      expect(formatDate("")).toBe("");
    });
  });

  describe("todayIsoDate", () => {
    it("returns a date in YYYY-MM-DD format", () => {
      expect(todayIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("round-trips through formatDate without shifting the day", () => {
      const today = todayIsoDate();
      const [year, month, day] = today.split("-");
      expect(formatDate(today)).toBe(`${day}/${month}/${year}`);
    });
  });
});
