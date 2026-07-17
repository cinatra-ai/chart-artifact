"use client";

// The `chart` chat renderable-view — the extension-owned migration of the host
// `ChartEmbed` (`packages/chat/src/chart-embed.tsx`). It is a FAITHFUL PORT of
// that recharts renderer (same chart types, palette, axes, formatting, and DOM
// classes), not a redesign: mounted through the host `cinatra.views` dispatch it
// must render the SAME chart payload identically in /chat and the CMS embed
// (the cross-surface identical-render invariant of the unified-stream program).
//
// The default export is the renderable-view component the host mounts: it takes
// the host `{ view }` payload for the `chart` viewType, extracts + validates the
// chart spec (`validateChart` — the ported host schema), and renders the ported
// `ChartEmbed`, degrading to a non-crashing `ChartError` floor on any malformed
// payload (the host renderer's own safety contract).

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { buildChartData, colorAt, formatValue, showLegend, extractChartSpec } from "../chart-model";
import { validateChart, type ChartSpec } from "../chart-schema";
import type { ChartView, RenderableViewProps } from "../renderable-view-props";

// ---------------------------------------------------------------------------
// ChartEmbed — renders a validated ChartSpec as a recharts chart. Ported from
// the host renderer. `validateChart()` MUST be called before passing `spec`.
//
// Security: every string field from the spec is rendered as a React text node
// by recharts (never innerHTML), so XSS from an LLM-controlled title/label is
// not possible.
// ---------------------------------------------------------------------------

export function ChartEmbed({ spec }: { spec: ChartSpec }) {
  const data = buildChartData(spec);
  const yFormatter = (v: number) => formatValue(v, spec.yFormat);
  const legend = showLegend(spec);

  const commonAxes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
      <XAxis
        dataKey="x"
        stroke="var(--muted-foreground, #64748b)"
        fontSize={11}
        tick={{ fill: "var(--muted-foreground, #64748b)" }}
      />
      <YAxis
        stroke="var(--muted-foreground, #64748b)"
        fontSize={11}
        tickFormatter={yFormatter}
        tick={{ fill: "var(--muted-foreground, #64748b)" }}
      />
      <Tooltip
        formatter={(v: unknown) => formatValue(v as number, spec.yFormat)}
        contentStyle={{
          background: "var(--surface, #ffffff)",
          border: "1px solid var(--border, #e2e8f0)",
          borderRadius: 6,
          fontSize: 12,
        }}
      />
      {legend && <Legend wrapperStyle={{ fontSize: 12 }} />}
    </>
  );

  return (
    <div className="my-3 rounded-lg border border-line bg-surface p-4">
      <div className="mb-1 text-sm font-semibold text-foreground">{spec.title}</div>
      {spec.subtitle && (
        <div className="mb-3 text-xs text-muted-foreground">{spec.subtitle}</div>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === "bar" ? (
            <BarChart data={data}>
              {commonAxes}
              {spec.series.map((s, i) => (
                <Bar
                  key={s.name}
                  dataKey={s.name}
                  fill={colorAt(i)}
                  stackId={spec.stacked ? "stack" : undefined}
                />
              ))}
            </BarChart>
          ) : spec.type === "line" ? (
            <LineChart data={data}>
              {commonAxes}
              {spec.series.map((s, i) => (
                <Line
                  key={s.name}
                  dataKey={s.name}
                  type="monotone"
                  stroke={colorAt(i)}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={data}>
              {commonAxes}
              {spec.series.map((s, i) => (
                <Area
                  key={s.name}
                  dataKey={s.name}
                  type="monotone"
                  stroke={colorAt(i)}
                  fill={colorAt(i)}
                  fillOpacity={0.3}
                  stackId={spec.stacked ? "stack" : undefined}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChartError — the non-crashing floor rendered when the payload is not a valid
// chart spec, so the chat surface never blanks on a malformed `chart` view.
// ---------------------------------------------------------------------------

export function ChartError({ reason }: { reason: string }) {
  return (
    <div className="my-3 rounded-lg border border-line bg-surface-muted p-3 text-xs text-muted-foreground">
      Chart could not be rendered: {reason}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChartArtifactView — the DEFAULT-EXPORTED renderable-view component the host
// `cinatra.views` dispatch mounts for the `chart` viewType.
// ---------------------------------------------------------------------------

export default function ChartArtifactView({ view }: RenderableViewProps<ChartView>) {
  const spec = validateChart(extractChartSpec(view));
  if (spec === null) {
    return <ChartError reason="the chart data was missing or malformed" />;
  }
  return <ChartEmbed spec={spec} />;
}
