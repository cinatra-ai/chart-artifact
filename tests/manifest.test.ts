import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { chartArtifactManifest } from "../src/index";

const pkgUrl = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(readFileSync(pkgUrl, "utf8")) as {
  name: string;
  files: string[];
  exports: Record<string, unknown>;
  cinatra: {
    apiVersion: string;
    kind: string;
    displayName: string;
    vendor: { key: string; name: string };
    dependencies: unknown[];
    artifact: { accepts: { file: { mimeTypes: string[] } } };
    views: {
      abiVersion: number;
      entries: Array<{ viewType: string; entry: string; propsApiVersion: number }>;
    };
  };
};

describe("package.json cinatra manifest", () => {
  it("is a first-party artifact-kind carrier with the expected identity", () => {
    expect(pkg.name).toBe("@cinatra-ai/chart-artifact");
    expect(pkg.cinatra.kind).toBe("artifact");
    expect(pkg.cinatra.apiVersion).toBe("cinatra.ai/v1");
    expect(pkg.cinatra.displayName).toBe("Chart");
    expect(pkg.cinatra.vendor).toEqual({ key: "cinatra-ai", name: "Cinatra" });
    expect(pkg.cinatra.dependencies).toEqual([]);
  });

  it("declares the mandatory cinatra.artifact descriptor (no ui renderer in this slice)", () => {
    expect(pkg.cinatra.artifact.accepts).toEqual({
      file: { mimeTypes: ["application/vnd.cinatra.chart+json"] },
    });
    // A views-only carrier ships no artifact.ui renderer block.
    expect("ui" in pkg.cinatra.artifact).toBe(false);
  });

  it("declares a v1 cinatra.views provider for exactly the `chart` viewType", () => {
    const views = pkg.cinatra.views;
    expect(views.abiVersion).toBe(1);
    expect(views.entries).toHaveLength(1);
    const seen = new Set<string>();
    for (const entry of views.entries) {
      // One effective provider per viewType.
      expect(seen.has(entry.viewType)).toBe(false);
      seen.add(entry.viewType);
      // Strict lowercase snake_case discriminator.
      expect(entry.viewType).toMatch(/^[a-z0-9]+(?:_[a-z0-9]+)*$/);
      expect(entry.propsApiVersion).toBe(1);
      // The entry is a package-relative, path-contained subpath that exists...
      expect(entry.entry.startsWith("./")).toBe(true);
      expect(entry.entry.includes("..")).toBe(false);
      const rel = entry.entry.slice(2);
      const abs = fileURLToPath(new URL(`../${rel}`, import.meta.url));
      expect(existsSync(abs), `${entry.entry} exists`).toBe(true);
      // ...and ships inside the published `files` allowlist.
      expect(pkg.files.some((f) => rel === f || rel.startsWith(`${f}/`))).toBe(true);
      // ...and is import-resolvable by the host manifest generator: it requires a
      // package.json exports key `./<entry-without-extension>` (or a host tsconfig
      // alias) or the generated literal import fails at runtime.
      const exportsKey = `./${rel.replace(/\.(ts|tsx)$/, "")}`;
      expect(Object.keys(pkg.exports)).toContain(exportsKey);
    }
    expect([...seen]).toEqual(["chart"]);
  });

  it("keeps the exported typed manifest in lock-step with package.json (no drift)", () => {
    expect(chartArtifactManifest.accepts).toEqual(pkg.cinatra.artifact.accepts);
    expect(chartArtifactManifest.views).toEqual(pkg.cinatra.views);
  });
});
