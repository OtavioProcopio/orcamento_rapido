declare global {
  interface Window {
    goatcounter?: {
      count: (options: { path: string; title?: string; event?: boolean }) => void;
    };
  }
}

// window.goatcounter só existe depois do script externo carregar (async), e
// pode nunca existir de fato (bloqueador de anúncio/rastreio, script falhou
// em carregar). Toda chamada é opcional/best-effort — nunca deve quebrar o
// app nem esperar por rede.
export const trackPageview = (path: string, title?: string): void => {
  window.goatcounter?.count({ path, title });
};

// GoatCounter distingue pageview de evento por convenção de path: eventos
// prefixados com "event:" aparecem separados dos hits de página no painel.
export const trackEvent = (name: string): void => {
  window.goatcounter?.count({ path: `event:${name}`, event: true, title: name });
};
