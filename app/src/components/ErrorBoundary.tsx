import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro inesperado no app", error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
        <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-200">
            Erro
          </p>
          <h1 className="mt-3 text-2xl font-bold text-white">
            Não foi possível carregar esta tela
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Seus dados locais não foram apagados. Recarregue a página e tente
            novamente.
          </p>
          <div className="mt-6">
            <Button onClick={() => window.location.reload()}>Recarregar</Button>
          </div>
        </section>
      </div>
    );
  }
}
