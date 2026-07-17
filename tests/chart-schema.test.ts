import { describe, expect, it } from "vitest";

import { normalizeChartInput, validateChart } from "../src/chart-schema";

const bar = {
  version: 1 as const,
  type: "bar" as const,
  title: "Revenue",
  x: ["Jan", "Feb", "Mar"],
  series: [{ name: "USD", data: [1, 2, 3] }],
};

describe("validateChart", () => {
  it("accepts a valid bar / line / area spec", () => {
    expect(validateChart(bar)?.type).toBe("bar");
    expect(validateChart({ ...bar, type: "line" })?.type).toBe("line");
    expect(validateChart({ ...bar, type: "area" })?.type).toBe("area");
  });

  it("injects version: 1 when omitted (host detector emits our format without it)", () => {
    const { version: _v, ...noVersion } = bar;
    expect(validateChart(noVersion)?.version).toBe(1);
  });

  it("accepts an optional subtitle, stacked, legend, and yFormat", () => {
    const spec = validateChart({
      ...bar,
      subtitle: "FY26",
      stacked: true,
      legend: false,
      yFormat: "currency_usd" as const,
      series: [
        { name: "A", data: [1, 2, 3] },
        { name: "B", data: [4, 5, 6] },
      ],
    });
    expect(spec?.subtitle).toBe("FY26");
    expect(spec?.stacked).toBe(true);
    expect(spec?.yFormat).toBe("currency_usd");
  });

  it("rejects a series whose data length does not match x", () => {
    expect(validateChart({ ...bar, series: [{ name: "USD", data: [1, 2] }] })).toBeNull();
  });

  it("rejects out-of-bounds inputs (too many series, too many x-points, non-finite)", () => {
    const series = Array.from({ length: 13 }, (_, i) => ({ name: `s${i}`, data: [1, 2, 3] }));
    expect(validateChart({ ...bar, series })).toBeNull();
    const x = Array.from({ length: 367 }, (_, i) => String(i));
    expect(validateChart({ ...bar, x, series: [{ name: "USD", data: x.map(() => 1) }] })).toBeNull();
    expect(validateChart({ ...bar, series: [{ name: "USD", data: [1, Infinity, 3] }] })).toBeNull();
  });

  it("never throws — returns null for non-object / empty / garbage input", () => {
    expect(validateChart(null)).toBeNull();
    expect(validateChart("not a chart")).toBeNull();
    expect(validateChart([])).toBeNull();
    expect(validateChart({})).toBeNull();
    expect(validateChart({ type: "pie", x: ["a"], series: [] })).toBeNull();
  });
});

describe("normalizeChartInput (ECharts tolerance)", () => {
  it("maps xAxis.data → x and strips per-series type, then validates", () => {
    const echarts = {
      type: "line",
      title: "ECharts shape",
      xAxis: { data: ["Q1", "Q2"] },
      series: [{ type: "line", name: "Growth", data: [10, 20] }],
    };
    const normalized = normalizeChartInput(echarts) as Record<string, unknown>;
    expect(normalized.x).toEqual(["Q1", "Q2"]);
    expect((normalized.series as Array<Record<string, unknown>>)[0]).not.toHaveProperty("type");
    const spec = validateChart(echarts);
    expect(spec?.x).toEqual(["Q1", "Q2"]);
    expect(spec?.series[0].name).toBe("Growth");
  });

  it("passes an already-formatted object (has x) through, injecting version when absent", () => {
    const { version: _v, ...noVersion } = bar;
    const out = normalizeChartInput(noVersion) as Record<string, unknown>;
    expect(out.version).toBe(1);
    expect(out.x).toEqual(["Jan", "Feb", "Mar"]);
    // An object already carrying version is returned unchanged (same reference).
    expect(normalizeChartInput(bar)).toBe(bar);
  });

  it("returns non-object input unchanged", () => {
    expect(normalizeChartInput(42)).toBe(42);
    expect(normalizeChartInput(null)).toBeNull();
  });
});
