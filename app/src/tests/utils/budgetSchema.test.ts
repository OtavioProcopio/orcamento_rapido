import { budgetSchema } from "../../utils/budgetSchema";

const validBudgetInput = {
  client: { name: "Cliente" },
  items: [
    {
      id: "item-1",
      descricao: "Serviço",
      quantidade: 2,
      unidade: "UN",
      valorUnitario: 50,
      moeda: "BRL" as const,
    },
  ],
  validityDays: 7,
  discount: 10,
};

describe("budgetSchema", () => {
  it("accepts a complete valid budget", () => {
    expect(budgetSchema.safeParse(validBudgetInput).success).toBe(true);
  });

  it("rejects empty clients and invalid items", () => {
    const result = budgetSchema.safeParse({
      ...validBudgetInput,
      client: { name: "" },
      items: [{ ...validBudgetInput.items[0], descricao: "", quantidade: 0 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining([
          "Nome do cliente é obrigatório.",
          "Descrição obrigatória.",
          "Quantidade deve ser maior que 0.",
        ]),
      );
    }
  });

  it("rejects discounts above subtotal", () => {
    const result = budgetSchema.safeParse({
      ...validBudgetInput,
      discount: 500,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Desconto não pode ser maior que o subtotal.",
      );
    }
  });
});
