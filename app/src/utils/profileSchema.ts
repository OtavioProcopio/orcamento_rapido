import { z } from "zod";
import { isValidCpfCnpj } from "./document";
import { unmaskPhone } from "./maskPhone";

export const profileSchema = z.object({
  companyName: z.string().trim().min(1, "Nome da empresa é obrigatório."),
  document: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidCpfCnpj(value), "Informe um CPF/CNPJ válido."),
  userName: z.string().trim().min(1, "Nome do profissional é obrigatório."),
  phone: z
    .string()
    .min(1, "WhatsApp/Telefone é obrigatório.")
    .refine(
      (value) => unmaskPhone(value).length >= 10,
      "Informe um telefone com DDD.",
    ),
  pixKey: z.string().optional(),
  logo: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
