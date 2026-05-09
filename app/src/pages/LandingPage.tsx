import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "../assets/logo.svg";
import { useBudget } from "../hooks/useBudget";
import { useProfile } from "../hooks/useProfile";

const sectionCardClassName =
  "rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.22)] backdrop-blur-xl";

export function LandingPage() {
  const navigate = useNavigate();
  const { budgets, loading: budgetsLoading } = useBudget();
  const { profile, loading: profileLoading } = useProfile();

  const ctaTarget = useMemo(() => {
    if (budgets.length > 0 || profile) {
      return "/dashboard";
    }

    return "/profile";
  }, [budgets.length, profile]);

  const ctaLabel = budgets.length > 0 || profile ? "Começar a usar" : "Começar a usar";
  const isLoading = budgetsLoading || profileLoading;

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.22),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(249,115,22,0.18),transparent_22%),linear-gradient(180deg,#030712_0%,#0f172a_45%,#020617_100%)] text-slate-100">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-black/20 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/92 p-2 shadow-[0_18px_40px_rgba(37,99,235,0.18)]">
              <img
                src={logoImage}
                alt="Logo Orça Rápido"
                className="h-full w-full object-contain"
              />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-cyan-200/80">
                Orça Rápido
              </p>
              <p
                className="mt-1 text-base font-semibold text-white sm:text-lg"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                Orçamentos com presença, velocidade e controle local.
              </p>
            </div>
          </div>
          <div className="hidden text-right text-xs text-slate-400 md:block">
            <p>Uso local no navegador</p>
            <p>Sem mensalidade para começar</p>
          </div>
        </header>

        <section className="grid gap-10 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-16">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Ferramenta para autônomos e MEIs que precisam passar segurança
            </p>
            <h1
              className="mt-6 text-4xl font-black leading-[1.02] text-white sm:text-5xl lg:text-7xl"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Feche mais rápido com um orçamento que já nasce profissional.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              O Orça Rápido foi feito para quem precisa responder clientes sem
              improviso. Você cadastra a empresa, monta o orçamento, imprime ou
              salva em PDF pelo navegador e mantém o histórico no próprio
              dispositivo.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  void navigate(ctaTarget);
                }}
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-orange-500 px-7 py-4 text-base font-extrabold text-slate-950 shadow-[0_20px_50px_rgba(249,115,22,0.38)] transition hover:translate-y-[-1px] hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Carregando..." : ctaLabel}
              </button>
              <p className="text-sm text-slate-400">
                Primeiro acesso: cadastro da empresa. Quem já usa entra direto
                no painel.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <article className={sectionCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-200/80">
                  Resposta rápida
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Monte e entregue um orçamento com visual forte em poucos
                  minutos.
                </p>
              </article>
              <article className={sectionCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                  Autoridade
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Documento com estrutura comercial séria para passar confiança
                  desde o primeiro contato.
                </p>
              </article>
              <article className={sectionCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
                  Controle local
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Seus dados ficam no navegador, sem depender de operação remota
                  para o uso diário.
                </p>
              </article>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-10 top-6 h-44 rounded-full bg-orange-500/18 blur-3xl" />
            <div className="absolute bottom-6 right-6 h-36 w-36 rounded-full bg-cyan-400/18 blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/6 shadow-[0_40px_120px_rgba(2,6,23,0.5)] backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Fluxo de uso
                </span>
              </div>
              <div className="grid gap-4 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.16),transparent_28%)] p-5 sm:p-6">
                <div className="rounded-[26px] border border-white/10 bg-slate-950/75 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Como funciona
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                      <p className="text-sm font-bold text-white">1. Cadastre sua empresa</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Nome, contato, documento, chave PIX e logo.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                      <p className="text-sm font-bold text-white">2. Monte o orçamento</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Cliente, itens, desconto, validade e observações.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                      <p className="text-sm font-bold text-white">3. Imprima ou salve em PDF</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Usando a impressão nativa do navegador, sem plugins.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[0.55fr_0.45fr]">
                  <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Para que serve
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      Organizar propostas, manter histórico, padronizar o visual
                      comercial e reduzir o tempo entre atendimento e fechamento.
                    </p>
                  </div>
                  <div className="relative flex min-h-52 items-center justify-center overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(191,219,254,0.92))] p-8">
                    <div className="absolute inset-x-10 bottom-5 h-8 rounded-full bg-slate-950/20 blur-2xl" />
                    <img
                      src={logoImage}
                      alt="Marca Orça Rápido"
                      className="relative h-32 w-32 object-contain drop-shadow-[0_22px_34px_rgba(15,23,42,0.22)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 py-4 lg:grid-cols-[0.88fr_1.12fr]">
          <article className={sectionCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              Segurança e LGPD
            </p>
            <h2
              className="mt-4 text-2xl font-bold text-white sm:text-3xl"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Dados sob controle e transparência no uso local.
            </h2>
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
              <p>Os dados operacionais ficam armazenados localmente no navegador do usuário.</p>
              <p>O sistema não depende de conta online para criar, consultar ou imprimir orçamentos.</p>
              <p>O uso de dados deve respeitar finalidade comercial legítima, necessidade e cuidado com acesso ao dispositivo.</p>
              <p>Para rotinas internas, o ideal é proteger o equipamento, limitar compartilhamento e revisar periodicamente o histórico salvo.</p>
            </div>
          </article>

          <article className={sectionCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-200/80">
              Uso objetivo
            </p>
            <h2
              className="mt-4 text-2xl font-bold text-white sm:text-3xl"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              O fluxo é simples porque a operação precisa ser simples.
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <p className="text-sm font-bold text-white">Cadastro</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Configure a identidade da empresa uma única vez.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <p className="text-sm font-bold text-white">Operação</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Gere orçamentos com cliente, itens, totais e observações.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <p className="text-sm font-bold text-white">Entrega</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Abra a impressão nativa e salve em PDF quando precisar.
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
