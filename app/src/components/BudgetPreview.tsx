import { forwardRef } from "react";
import type { BudgetClient, BudgetItem, MeiProfile } from "../types";

const formatCurrency = (value: number, currency: string = "BRL") => {
  return value.toLocaleString("pt-BR", { style: "currency", currency });
};

type BudgetPreviewProps = {
  profile: MeiProfile;
  proposalNumber: string | number;
  createdAt: Date | string;
  validityDays?: number;
  client: BudgetClient;
  items: BudgetItem[];
  subtotal: number;
  discount: number;
  total: number;
  showLogo: boolean;
  showSignature: boolean;
  showBanner: boolean;
  paymentTerms?: string;
  terms?: string;
};

export const BudgetPreview = forwardRef<HTMLDivElement, BudgetPreviewProps>(
  (
    {
      profile,
      proposalNumber,
      createdAt,
      validityDays,
      client,
      items,
      subtotal,
      discount,
      total,
      showLogo,
      showSignature,
      showBanner,
      paymentTerms,
      terms,
    },
    ref,
  ) => {
    const issueDate =
      createdAt instanceof Date ? createdAt : new Date(createdAt);

    return (
      <div
        ref={ref}
        className="budget-preview-page relative flex aspect-[1/1.4142] w-full max-w-198.5 shrink-0 flex-col rounded-sm border border-slate-200 bg-white p-10 font-sans text-xs text-slate-900 shadow-2xl sm:text-sm md:p-12"
      >
        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-200 pb-6">
          <div className="flex-1 pr-4 flex gap-4">
            {showLogo && profile.logo && (
              <img
                src={profile.logo}
                alt="Logo da Empresa"
                className="w-16 h-16 object-contain"
              />
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tighter wrap-break-word leading-tight">
                {profile.companyName || "Nome da empresa"}
              </h1>
              <p className="mt-1 font-medium text-slate-500">
                Documento: {profile.document || "-"}
              </p>
              <p className="font-medium text-slate-500">
                Contato: {profile.phone || "-"}
              </p>
            </div>
          </div>
          <div className="flex-1 text-right pl-4">
            <h2 className="text-xl sm:text-2xl font-black text-blue-600 tracking-widest uppercase mb-2">
              Orçamento
            </h2>
            <p className="text-slate-600">
              <b>Nº:</b> {proposalNumber || "-"}
            </p>
            <p className="text-slate-600">
              <b>Data:</b> {issueDate.toLocaleDateString()}
            </p>
            {validityDays ? (
              <p className="text-slate-600">
                <b>Validade:</b> {validityDays} dias
              </p>
            ) : null}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 sm:p-5 mb-8 border border-slate-100">
          <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">
            Cliente
          </h3>
          <p className="font-bold text-base sm:text-lg text-slate-800">
            {client.name || "Sem nome"}
          </p>
          {client.document && (
            <p className="text-slate-600 mt-1">
              <b>CPF/CNPJ:</b> {client.document}
            </p>
          )}
          {client.email && (
            <p className="text-slate-600 mt-1">
              <b>Email:</b> {client.email}
            </p>
          )}
          {client.address && (
            <p className="text-slate-600 mt-1">
              <b>Endereço:</b> {client.address}
            </p>
          )}
        </div>

        <div className="mb-8 flex-1 min-h-37.5 budget-preview-items">
          <table className="w-full text-left border-collapse">
            <thead className="budget-preview-table-head">
              <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 rounded-tl-lg w-[45%] font-semibold">
                  Descrição
                </th>
                <th className="py-3 px-2 text-center font-semibold">QTD</th>
                <th className="py-3 px-2 text-center font-semibold">UN</th>
                <th className="py-3 px-4 text-right font-semibold">
                  Unitário
                </th>
                <th className="py-3 px-4 rounded-tr-lg text-right font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-slate-400 italic bg-slate-50/50"
                  >
                    Nenhum item adicionado ao orçamento.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="budget-preview-item-row border-b border-slate-200 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-800 font-medium wrap-break-word">
                    {item.descricao || "Item sem descrição"}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-600">
                    {item.quantidade}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-500 text-[11px] font-medium">
                    {item.unidade}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 font-medium">
                    {formatCurrency(item.valorUnitario)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">
                    {formatCurrency(item.quantidade * item.valorUnitario)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-8 bg-white">
          <div className="w-full sm:w-[50%]">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Subtotal:</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(subtotal)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-200 text-red-500">
                <span className="font-medium">Desconto:</span>
                <span className="font-semibold">- {formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 sm:py-4 bg-slate-50 px-4 rounded-xl mt-3 border border-slate-200 shadow-sm">
              <span className="font-black text-slate-800 tracking-wide text-xs sm:text-sm">
                TOTAL GERAL
              </span>
              <span className="font-black text-blue-700 text-lg sm:text-xl">
                {formatCurrency(total > 0 ? total : 0)}
              </span>
            </div>
          </div>
        </div>

        {paymentTerms && (
          <div className="mb-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Condições de Pagamento
            </h4>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {paymentTerms}
              </p>
            </div>
          </div>
        )}

        <div className="shrink-0 mt-auto pt-6 border-t border-slate-200 space-y-6">
          {terms && (
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Observações e Termos de Garantia
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed text-justify whitespace-pre-wrap">
                {terms}
              </p>
            </div>
          )}

          {showSignature && (
            <div className="flex flex-col items-center justify-end pt-10">
              <div className="w-[60%] sm:w-[50%] border-t border-slate-400 mb-2"></div>
              <p className="text-[10px] text-slate-600 text-center font-semibold">
                Assinatura do Cliente
              </p>
            </div>
          )}

          {showBanner && (
            <div className="mt-4 bg-blue-50/50 border border-blue-100 py-3 px-4 rounded-lg text-center flex items-center justify-center gap-3">
              <p className="text-slate-600 font-medium text-[10px] sm:text-xs">
                Orçamento digital gratuito criado por{" "}
                <a
                  href="https://otavioprocopio.github.io/orcamento_rapido/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600"
                >
                  otavioprocopio.github.io/orcamento_rapido
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
);

BudgetPreview.displayName = "BudgetPreview";
