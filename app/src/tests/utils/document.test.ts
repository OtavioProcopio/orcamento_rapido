import { isValidCpfCnpj, maskCpfCnpj, unmaskDocument } from "../../utils/document";

describe("document utils", () => {
  it("masks CPF and CNPJ values", () => {
    expect(maskCpfCnpj("52998224725")).toBe("529.982.247-25");
    expect(maskCpfCnpj("19131243000197")).toBe("19.131.243/0001-97");
  });

  it("ignores non-digits and partial values while masking", () => {
    expect(maskCpfCnpj("abc52998")).toBe("529.98");
    expect(maskCpfCnpj("12345678901234567890")).toBe("12.345.678/9012-34");
  });

  it("unmasks formatted values", () => {
    expect(unmaskDocument("529.982.247-25")).toBe("52998224725");
  });

  it("validates CPF and CNPJ values", () => {
    expect(isValidCpfCnpj("529.982.247-25")).toBe(true);
    expect(isValidCpfCnpj("19.131.243/0001-97")).toBe(true);
  });

  it("rejects empty, repeated and invalid values", () => {
    expect(isValidCpfCnpj("")).toBe(false);
    expect(isValidCpfCnpj("111.111.111-11")).toBe(false);
    expect(isValidCpfCnpj("12.345.678/0001-00")).toBe(false);
  });
});
