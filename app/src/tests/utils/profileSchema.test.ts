import { profileSchema } from "../../utils/profileSchema";

describe("profileSchema", () => {
  it("accepts profile data with document and phone", () => {
    const result = profileSchema.safeParse({
      companyName: "Empresa",
      document: "529.982.247-25",
      userName: "Pessoa",
      phone: "(11) 99999-9999",
      pixKey: "pix@empresa.com",
      logo: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects phones without enough digits", () => {
    const result = profileSchema.safeParse({
      companyName: "Empresa",
      userName: "Pessoa",
      phone: "123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Informe um telefone com DDD.");
    }
  });
});
