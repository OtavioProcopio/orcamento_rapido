import { readFileSync } from "node:fs";
import path from "node:path";

const manifestPath = path.resolve(__dirname, "../../../public/manifest.json");

describe("manifest.json", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as {
    name?: string;
    short_name?: string;
    start_url?: string;
    display?: string;
    background_color?: string;
    theme_color?: string;
    icons?: Array<{ src?: string; sizes?: string; type?: string }>;
  };

  it("has a name and a short_name", () => {
    // Assert
    expect(manifest.name).toBe("Orça Rápido");
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.short_name!.length).toBeLessThanOrEqual(12);
  });

  it("is configured to open standalone, without depending on a root-absolute start_url", () => {
    // Assert
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe(".");
  });

  it("lists a 192x192 and a 512x512 icon with relative paths", () => {
    // Assert
    expect(manifest.icons).toBeDefined();
    const sizes = manifest.icons!.map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    manifest.icons!.forEach((icon) => {
      expect(icon.src).toBeTruthy();
      expect(icon.src?.startsWith("/")).toBe(false);
    });
  });
});
