import { formatCurrency, formatDate, todayIsoDate } from "../../utils/format";

describe("format", () => {
  it("formats BRL", () => {
    expect(formatCurrency(100)).toContain("100,00");
  });

  it("formats USD", () => {
    expect(formatCurrency(100, "USD")).toContain("100,00");
  });

  it("formats date", () => {
    expect(formatDate(new Date().toISOString())).toBeDefined();
    expect(formatDate("2024-01-01T00:00:00.000Z")).toContain("01/01/2024");
    expect(formatDate("invalid-date")).toBe("invalid-date");
  });

  it("todayIsoDate", () => {
    expect(todayIsoDate()).toContain("-");
  });
});
