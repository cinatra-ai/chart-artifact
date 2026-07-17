// Chart spec schema + tolerant validator.
//
// A FAITHFUL PORT of the host `packages/chat/src/chart-schema.ts` (the same
// payload the migrating `[chart:{…}]` embed renders today). It moves here
// UNCHANGED so the extension-owned `chart` renderable-view validates the exact
// same wire payload the host detector emits — no schema redesign. When the host
// `chart` viewType cutover lands (a later, owner-reviewed host PR), the host
// detector keeps producing this shape and this extension keeps rendering it.
//
// Security: a chart spec is untrusted input from the LLM. The strict Zod bounds
// (≤ 12 series, ≤ 366 x-points, finite numbers) cap DoS from a hostile input,
// and every string field is rendered as a React text node by the view (never
// innerHTML), so an LLM-controlled title/label cannot inject markup.

import { z } from "zod";

export const chartSeriesSchema = z.object({
  name: z.string().min(1).max(120),
  data: z.array(z.number().finite()),
});

export const chartSchema = z
  .object({
    version: z.literal(1),
    type: z.enum(["bar", "line", "area"]),
    title: z.string().min(1).max(200),
    subtitle: z.string().max(300).optional(),
    x: z.array(z.string().max(120)).min(1).max(366),
    series: z.array(chartSeriesSchema).min(1).max(12),
    stacked: z.boolean().optional(),
    legend: z.boolean().optional(),
    yFormat: z.enum(["currency_usd", "number", "percent"]).optional(),
  })
  .refine((c) => c.series.every((s) => s.data.length === c.x.length), {
    message: "Each series.data length must equal x length",
  });

export type ChartSpec = z.infer<typeof chartSchema>;

/**
 * Normalizes LLM-generated chart specs that may use ECharts-style structure
 * (xAxis.data, per-series type) to the internal Cinatra format (x, series
 * without type). Also injects `version: 1` when omitted.
 */
export function normalizeChartInput(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return raw;
  const obj = raw as Record<string, unknown>;

  // Already in our format — has the `x` field directly.
  if ("x" in obj) {
    if (!("version" in obj)) return { version: 1, ...obj };
    return raw;
  }

  const out: Record<string, unknown> = { version: 1 };
  if ("type" in obj) out.type = obj.type;
  if ("title" in obj) out.title = obj.title;
  if ("subtitle" in obj) out.subtitle = obj.subtitle;
  if ("stacked" in obj) out.stacked = obj.stacked;
  if ("legend" in obj) out.legend = obj.legend;
  if ("yFormat" in obj) out.yFormat = obj.yFormat;

  // ECharts xAxis.data → x
  if (typeof obj.xAxis === "object" && obj.xAxis !== null) {
    const xAxis = obj.xAxis as Record<string, unknown>;
    if (Array.isArray(xAxis.data)) out.x = xAxis.data;
  }

  // ECharts series — strip the per-series `type` field, which is not in our schema.
  if (Array.isArray(obj.series)) {
    out.series = obj.series.map((s: unknown) => {
      if (typeof s !== "object" || s === null) return s;
      const { type: _t, ...rest } = s as Record<string, unknown>;
      return rest;
    });
  }

  return out;
}

/**
 * Returns a valid ChartSpec or null on any failure. Never throws.
 */
export function validateChart(raw: unknown): ChartSpec | null {
  const parsed = chartSchema.safeParse(normalizeChartInput(raw));
  return parsed.success ? parsed.data : null;
}
