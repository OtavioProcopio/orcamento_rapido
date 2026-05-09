import { z } from "zod";
import { calculateBudgetSubtotal } from "./calculate";
import { isValidCpfCnpj } from "./document";
import { unmaskPhone } from "./maskPhone";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().optional(),
);

const finiteNumber = (message: string) =>
  z.coerce
    .number({ error: message })
    .refine((value) => Number.isFinite(value), message);

export const budgetItemSchema = z.object({
  id: z.string().min(1).optional(),
  descricao: z.string().trim().min(1, "Descrição obrigatória."),
  quantidade: finiteNumber("Quantidade inválida.").min(
    1,
    "Quantidade deve ser maior que 0.",
  ),
  unidade: z.string().min(1, "Unidade obrigatoria."),
  valorUnitario: finiteNumber("Valor inválido.").min(
    0,
    "Valor não pode ser negativo.",
  ),
  moeda: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
});

export const budgetSchema = z.object({
  client: z.object({
    name: z.string().trim().min(1, "Nome do cliente é obrigatório."),
    document: optionalText.refine(
      (value) => !value || isValidCpfCnpj(value),
      "Informe um CPF/CNPJ válido.",
    ),
    address: optionalText,
    email: z
      .union([z.string().email("Informe um email válido."), z.literal("")])
      .optional(),
    phone: optionalText.refine(
      (value) => !value || unmaskPhone(value).length >= 10,
      "Informe um telefone com DDD.",
    ),
  }),
  items: z.array(budgetItemSchema).min(1, "Adicione pelo menos um item."),
  proposalNumber: z.string().optional(),
  validityDays: finiteNumber("Validade inválida.")
    .min(1, "Validade deve ser de pelo menos 1 dia.")
    .optional(),
  discount: finiteNumber("Desconto inválido.")
    .min(0, "Desconto não pode ser negativo.")
    .default(0),
  paymentTerms: optionalText,
  terms: optionalText,
}).superRefine((values, context) => {
  const subtotal = calculateBudgetSubtotal(
    values.items.map((item) => ({
      id: item.id ?? "item",
      descricao: item.descricao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valorUnitario: item.valorUnitario,
      moeda: item.moeda,
    })),
  );

  if (values.discount > subtotal) {
    context.addIssue({
      code: "custom",
      path: ["discount"],
      message: "Desconto não pode ser maior que o subtotal.",
    });
  }
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;
