import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoImage from "../assets/logo.svg";
import { useBudget } from "../hooks/useBudget";
import { useProfiles } from "../hooks/useProfiles";
import { usePageMetadata } from "../hooks/usePageMetadata";

const steps = [
  {
    title: "Cadastre sua empresa",
    description: "Nome, contato, documento, chave PIX e logo.",
  },
  {
    title: "Monte o orçamento",
    description: "Cliente, itens, desconto, validade e observações.",
  },
  {
    title: "Imprima ou salve em PDF",
    description: "Usando a impressão nativa do navegador, sem plugins.",
  },
];

export function LandingPage() {
  usePageMetadata({
    title: "Orça Rápido — Orçamentos profissionais para MEIs e autônomos",
    description:
      "Crie, imprima e acompanhe orçamentos profissionais em minutos. Grátis, sem cadastro complicado e com seus dados guardados só no seu navegador.",
  });

  const navigate = useNavigate();
  const { budgets, loading: budgetsLoading } = useBudget();
  const { profiles, loading: profilesLoading } = useProfiles();

  const ctaTarget = useMemo(() => {
    if (budgets.length > 0 || profiles.length > 0) {
      return "/dashboard";
    }

    return "/profile";
  }, [budgets.length, profiles.length]);

  const isLoading = budgetsLoading || profilesLoading;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_32%),linear-gradient(180deg,#030712_0%,#0f172a_45%,#020617_100%)] text-slate-100">
      <div className="mx-auto max-w-3xl px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/92 p-2">
            <img
              src={logoImage}
              alt="Logo Orça Rápido"
              className="h-full w-full object-contain"
            />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Orça Rápido</p>
            <p className="text-xs text-slate-400">
              Uso local no navegador · sem mensalidade para começar
            </p>
          </div>
        </header>

        <section className="py-14 sm:py-20">
          <h1
            className="text-3xl font-bold leading-tight text-white sm:text-4xl"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Feche mais rápido com um orçamento que já nasce com cara de
            empresa grande.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Cadastre a empresa uma vez, monte o orçamento e imprima ou salve
            em PDF direto do navegador. Tudo fica guardado no próprio
            aparelho, pronto pra quando o cliente pedir de novo.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              data-testid="landing-cta"
              disabled={isLoading}
              onClick={() => {
                void navigate(ctaTarget);
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Carregando..." : "Começar a usar"}
            </button>
            <p className="text-sm text-slate-400">
              Primeiro acesso: cadastro da empresa. Quem já usa entra direto
              no painel.
            </p>
          </div>
        </section>

        <section className="border-t border-white/10 py-12">
          <h2
            className="text-xl font-bold text-white"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Como funciona
          </h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10 text-sm font-semibold text-blue-200">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-semibold text-white">
                  {step.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-white/10 py-12">
          <h2
            className="text-xl font-bold text-white"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Segurança e LGPD
          </h2>
          <div className="mt-4 max-w-2xl space-y-3 text-sm leading-7 text-slate-300">
            <p>
              Clientes, orçamentos e dados da empresa ficam guardados só
              neste navegador, neste dispositivo — não existe conta na
              nuvem nem servidor nosso armazenando o que você cadastra.
            </p>
            <p>
              Por isso mesmo, vale proteger o computador ou celular onde
              você usa o sistema, como faria com qualquer arquivo
              importante do negócio.
            </p>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/10 py-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Orça Rápido — dados salvos localmente neste navegador.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              to="/privacy"
              className="underline-offset-4 hover:text-slate-200 hover:underline"
            >
              Política de privacidade
            </Link>
            <Link
              to="/terms"
              className="underline-offset-4 hover:text-slate-200 hover:underline"
            >
              Termos de uso
            </Link>
            <Link
              to="/storage-notice"
              className="underline-offset-4 hover:text-slate-200 hover:underline"
            >
              Aviso de armazenamento local
            </Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
