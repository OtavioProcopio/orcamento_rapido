import { z } from "zod";
import { isValidCpfCnpj } from "./document";
import { unmaskPhone } from "./maskPhone";

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Nome do cliente é obrigatório."),
  document: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidCpfCnpj(value), "Informe um CPF/CNPJ válido."),
  address: z.string().trim().optional(),
  email: z
    .union([z.string().email("Informe um email válido."), z.literal("")])
    .optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || unmaskPhone(value).length >= 10,
      "Informe um telefone com DDD.",
    ),
  notes: z.string().trim().optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
