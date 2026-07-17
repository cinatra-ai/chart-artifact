import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ChartArtifactView, { ChartEmbed, ChartError } from "../src/views/chart";
import type { ChartSpec } from "../src/chart-schema";

function markup(node: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(node);
}

const spec: ChartSpec = {
  version: 1,
  type: "bar",
  title: "Quarterly Revenue",
  subtitle: "FY26",
  x: ["Q1", "Q2", "Q3"],
  series: [
    { name: "Product", data: [10, 20, 30] },
    { name: "Services", data: [5, 15, 25] },
  ],
};

describe("ChartEmbed (ported host renderer)", () => {
  it("renders the title and subtitle as text nodes", () => {
    const html = markup(<ChartEmbed spec={spec} />);
    expect(html).toContain("Quarterly Revenue");
    expect(html).toContain("FY26");
    expect(html.length).toBeGreaterThan(0);
  });

  it("renders line and area chart types without throwing", () => {
    expect(markup(<ChartEmbed spec={{ ...spec, type: "line" }} />)).toContain("Quarterly Revenue");
    expect(markup(<ChartEmbed spec={{ ...spec, type: "area" }} />)).toContain("Quarterly Revenue");
  });
});

describe("ChartError (never-blank floor)", () => {
  it("shows the reason inline", () => {
    const html = markup(<ChartError reason="the chart data was missing or malformed" />);
    expect(html).toContain("Chart could not be rendered");
    expect(html).toContain("missing or malformed");
  });
});

describe("ChartArtifactView (default export — host renderable-view)", () => {
  it("renders the chart for a flat carrier payload", () => {
    const view = { viewType: "chart" as const, ...spec };
    const html = markup(<ChartArtifactView view={view} />);
    expect(html).toContain("Quarterly Revenue");
  });

  it("renders the chart for a nested { viewType, spec } payload", () => {
    const view = { viewType: "chart" as const, spec };
    const html = markup(<ChartArtifactView view={view} />);
    expect(html).toContain("Quarterly Revenue");
  });

  it("degrades to the error floor for a malformed payload — not blank", () => {
    const view = { viewType: "chart" as const, type: "pie", x: [], series: [] };
    const html = markup(<ChartArtifactView view={view} />);
    expect(html).toContain("Chart could not be rendered");
    expect(html.length).toBeGreaterThan(0);
  });

  it("is a mountable React component (function)", () => {
    expect(typeof ChartArtifactView).toBe("function");
  });
});
