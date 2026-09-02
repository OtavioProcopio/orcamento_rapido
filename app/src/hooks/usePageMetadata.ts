import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_ORIGIN = "https://otavioprocopio.github.io";

type PageMetadata = {
  title: string;
  description: string;
};

const upsertHeadTag = <T extends HTMLMetaElement | HTMLLinkElement>(
  selector: string,
  create: () => T,
  apply: (tag: T) => void,
) => {
  const existing = document.querySelector<T>(selector);
  const tag = existing ?? create();
  apply(tag);
  if (!existing) {
    document.head.appendChild(tag);
  }
};

const buildCanonicalUrl = (pathname: string) => {
  const basename = __APP_BASENAME__.endsWith("/")
    ? __APP_BASENAME__
    : `${__APP_BASENAME__}/`;
  const path = pathname.replace(/^\//, "");
  return `${SITE_ORIGIN}${basename}${path}`;
};

// Título, description e canonical por rota. É JS-only de propósito (ver
// plan.md § Decisões técnicas): og:*/twitter:* ficam estáticos em
// index.html porque crawlers de prévia de link não rodam JS, mas o Google
// renderiza a página antes de ler o canonical — por isso ele precisa mudar
// por rota aqui, e não pode ficar fixo em "/" como os OG tags.
export const usePageMetadata = ({ title, description }: PageMetadata) => {
  const location = useLocation();

  useEffect(() => {
    document.title = title;

    upsertHeadTag<HTMLMetaElement>(
      'meta[name="description"]',
      () => {
        const meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        return meta;
      },
      (meta) => meta.setAttribute("content", description),
    );

    upsertHeadTag<HTMLLinkElement>(
      'link[rel="canonical"]',
      () => {
        const link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        return link;
      },
      (link) => link.setAttribute("href", buildCanonicalUrl(location.pathname)),
    );
  }, [title, description, location.pathname]);
};
