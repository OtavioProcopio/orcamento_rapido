import { Link } from "react-router-dom";

const sections = {
  privacy: {
    title: "Política de Privacidade",
    body: [
      "O Orça Rápido funciona localmente no seu navegador nesta fase. Não criamos conta, não recebemos seus orçamentos e não sincronizamos dados com servidores.",
      "Os dados de perfil, clientes e orçamentos ficam salvos no IndexedDB do navegador usado no dispositivo. Quem tiver acesso ao mesmo navegador poderá visualizar essas informações.",
      "Você pode remover os dados pelo reset do histórico, limpando os dados do navegador ou usando uma importação de backup para substituir o histórico local.",
    ],
  },
  terms: {
    title: "Termos de Uso",
    body: [
      "A ferramenta ajuda a criar orçamentos comerciais, mas o usuário é responsável por revisar valores, dados do cliente, condições de pagamento e informações legais antes do envio.",
      "O app é fornecido sem garantia de disponibilidade contínua, sincronização automática ou recuperação remota de dados nesta fase sem backend.",
      "Antes de usar em produção pública, valide o documento gerado no seu fluxo de trabalho e mantenha backups dos dados importantes.",
    ],
  },
  storage: {
    title: "Aviso de Armazenamento Local",
    body: [
      "Perfil e orçamentos são salvos apenas neste navegador, usando IndexedDB.",
      "Se o navegador for limpo, se o dispositivo for perdido ou se outra pessoa acessar a mesma sessão, os dados podem ser perdidos ou visualizados.",
      "Use exportação JSON regularmente para manter uma cópia de segurança manual dos seus orçamentos.",
    ],
  },
};

export function LegalPage({ type }: { type: keyof typeof sections }) {
  const content = sections[type];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        to="/dashboard"
        className="inline-flex rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/8"
      >
        Voltar
      </Link>
      <article className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="text-3xl font-bold text-white">{content.title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
          {content.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
