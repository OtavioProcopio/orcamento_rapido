import { readFileSync } from "node:fs";
import path from "node:path";

const robotsPath = path.resolve(__dirname, "../../../public/robots.txt");

describe("robots.txt", () => {
  const content = readFileSync(robotsPath, "utf-8");

  it("allows crawling for every user agent", () => {
    // Assert
    expect(content).toMatch(/User-agent:\s*\*/i);
    expect(content).toMatch(/Allow:\s*\//i);
    expect(content).not.toMatch(/Disallow:\s*\/\s*$/im);
  });

  it("references the sitemap", () => {
    // Assert
    expect(content).toMatch(
      /Sitemap:\s*https:\/\/otavioprocopio\.github\.io\/orcamento_rapido\/sitemap\.xml/i,
    );
  });
});
