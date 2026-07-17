// Pure, framework-free helpers behind the chart renderable-view.
//
// The rendering itself is a faithful port of the host `ChartEmbed`
// (`packages/chat/src/chart-embed.tsx`); the pure logic it drives — the series
// row-mapping, the value formatter, the legend rule, the color palette, and the
// spec extraction from the host's renderable-view payload — lives here so it is
// unit-testable without a DOM and shared by the component and the tests.

import type { ChartSpec } from "./chart-schema";

// Color palette — CSS custom properties where the host theme provides them, then
// hardcoded hex fallbacks that read in both light and dark themes. Ported
// verbatim from the host ChartEmbed so /chat and the CMS embed render identically.
export const PALETTE: readonly string[] = [
  "var(--chart-1, #6366f1)",
  "var(--chart-2, #22c55e)",
  "var(--chart-3, #f59e0b)",
  "var(--chart-4, #ef4444)",
  "var(--chart-5, #8b5cf6)",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#f472b6",
  "#fb923c",
];

/** Pick the series color for index `i`, wrapping the palette. */
export function colorAt(i: number): string {
  return PALETTE[i % PALETTE.length];
}

/** Format a numeric value for an axis tick / tooltip, honoring `yFormat`. */
export function formatValue(value: number, format?: ChartSpec["yFormat"]): string {
  if (format === "currency_usd") {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  }
  if (format === "percent") {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toLocaleString("en-US");
}

/** A recharts data row: `{ x, [seriesName]: value }`. */
export type ChartRow = Record<string, number | string>;

/**
 * Pivot a ChartSpec (x labels + named series) into recharts' row-per-x-point
 * shape. A missing datum coerces to 0 (matching the host ChartEmbed).
 */
export function buildChartData(spec: ChartSpec): ChartRow[] {
  return spec.x.map((label, i) => {
    const row: ChartRow = { x: label };
    for (const s of spec.series) row[s.name] = s.data[i] ?? 0;
    return row;
  });
}

/** The legend shows only when not explicitly disabled AND there is > 1 series. */
export function showLegend(spec: ChartSpec): boolean {
  return spec.legend !== false && spec.series.length > 1;
}

/**
 * Extract the chart-spec candidate from a host renderable-view payload. Tolerates
 * both the flat carrier form (`{ viewType: "chart", ...chartSpec }`) and a nested
 * `{ viewType, spec }` form; the returned candidate is handed to `validateChart`,
 * which is the sole authority on validity. Returns the raw input unchanged when
 * it is not an object (validation then rejects it to the error floor).
 */
export function extractChartSpec(view: unknown): unknown {
  if (typeof view !== "object" || view === null || Array.isArray(view)) return view;
  const obj = view as Record<string, unknown>;
  if (typeof obj.spec === "object" && obj.spec !== null) return obj.spec;
  // Flat form: everything except the wire discriminator is the spec.
  const { viewType: _viewType, ...rest } = obj;
  return rest;
}
