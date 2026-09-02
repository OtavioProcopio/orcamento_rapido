import { readFileSync } from "node:fs";
import path from "node:path";

const sitemapPath = path.resolve(__dirname, "../../../public/sitemap.xml");

const SITE_BASE = "https://otavioprocopio.github.io/orcamento_rapido/";

// As 10 rotas públicas navegáveis de app/src/App.tsx (RF-01), sem a rota
// catch-all "*" (não é uma página de conteúdo real).
const EXPECTED_PATHS = [
  "",
  "dashboard",
  "profile",
  "builder",
  "data",
  "clients",
  "pipeline",
  "privacy",
  "terms",
  "storage-notice",
];

describe("sitemap.xml", () => {
  const xml = readFileSync(sitemapPath, "utf-8");
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  it("does not fail to parse as XML", () => {
    // Assert
    expect(doc.querySelector("parsererror")).toBeNull();
  });

  it("lists exactly the 10 public routes of the app, each once", () => {
    // Arrange
    const locs = Array.from(doc.querySelectorAll("url > loc")).map(
      (node) => node.textContent,
    );
    const expectedUrls = EXPECTED_PATHS.map((suffix) => `${SITE_BASE}${suffix}`);

    // Assert
    expect(locs).toHaveLength(EXPECTED_PATHS.length);
    expect(new Set(locs)).toEqual(new Set(expectedUrls));
  });

  it("uses only absolute URLs under the production origin", () => {
    // Arrange
    const locs = Array.from(doc.querySelectorAll("url > loc")).map(
      (node) => node.textContent ?? "",
    );

    // Assert
    locs.forEach((loc) => {
      expect(loc.startsWith(SITE_BASE)).toBe(true);
    });
  });
});
