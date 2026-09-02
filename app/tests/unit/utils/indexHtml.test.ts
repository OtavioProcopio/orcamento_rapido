import { readFileSync } from "node:fs";
import path from "node:path";

const indexHtmlPath = path.resolve(__dirname, "../../../index.html");

const SITE_ROOT = "https://otavioprocopio.github.io/orcamento_rapido/";

describe("index.html", () => {
  const html = readFileSync(indexHtmlPath, "utf-8");
  const doc = new DOMParser().parseFromString(html, "text/html");

  it("has the correctly spelled product name as the document title", () => {
    // Assert
    expect(doc.title).toBe(
      "Orça Rápido — Orçamentos profissionais para MEIs e autônomos",
    );
  });

  it("has a non-empty meta description", () => {
    // Assert
    const description = doc
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");
    expect(description).toBeTruthy();
  });

  it("has a canonical link pointing to the site root as the pre-render default", () => {
    // Assert
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      SITE_ROOT,
    );
  });

  it("has complete Open Graph tags with absolute URLs", () => {
    // Arrange
    const og = (property: string) =>
      doc
        .querySelector(`meta[property="${property}"]`)
        ?.getAttribute("content");

    // Assert
    expect(og("og:title")).toBeTruthy();
    expect(og("og:description")).toBeTruthy();
    expect(og("og:url")).toBe(SITE_ROOT);
    expect(og("og:image")).toBe(`${SITE_ROOT}og-image.png`);
  });

  it("has complete Twitter Card tags with an absolute image URL", () => {
    // Arrange
    const twitter = (name: string) =>
      doc.querySelector(`meta[name="${name}"]`)?.getAttribute("content");

    // Assert
    expect(twitter("twitter:card")).toBe("summary_large_image");
    expect(twitter("twitter:title")).toBeTruthy();
    expect(twitter("twitter:description")).toBeTruthy();
    expect(twitter("twitter:image")).toBe(`${SITE_ROOT}og-image.png`);
  });

  it("references the web manifest and the apple touch icon via %BASE_URL%", () => {
    // Assert
    expect(
      doc.querySelector('link[rel="manifest"]')?.getAttribute("href"),
    ).toBe("%BASE_URL%manifest.json");
    expect(
      doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href"),
    ).toBe("%BASE_URL%apple-touch-icon.png");
  });

  it("has a theme-color meta tag", () => {
    // Assert
    expect(
      doc.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
    ).toBeTruthy();
  });
});
