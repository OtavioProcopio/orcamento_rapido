import { clientSchema } from "../../utils/clientSchema";

describe("clientSchema", () => {
  it("accepts a client with just a name", () => {
    const result = clientSchema.safeParse({ name: "Cliente" });

    expect(result.success).toBe(true);
  });

  it("accepts a fully filled client", () => {
    const result = clientSchema.safeParse({
      name: "Cliente Completo",
      document: "529.982.247-25",
      address: "Rua A, 123",
      email: "cliente@teste.com",
      phone: "(11) 99999-9999",
      notes: "Prefere contato por WhatsApp.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = clientSchema.safeParse({ name: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Nome do cliente é obrigatório.",
      );
    }
  });

  it("rejects an invalid document", () => {
    const result = clientSchema.safeParse({ name: "Cliente", document: "123" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Informe um CPF/CNPJ válido.",
      );
    }
  });

  it("rejects phones without enough digits", () => {
    const result = clientSchema.safeParse({ name: "Cliente", phone: "123" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Informe um telefone com DDD.",
      );
    }
  });

  it("rejects an invalid email", () => {
    const result = clientSchema.safeParse({ name: "Cliente", email: "nope" });

    expect(result.success).toBe(false);
  });
});
