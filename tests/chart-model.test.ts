import { describe, expect, it } from "vitest";

import {
  PALETTE,
  buildChartData,
  colorAt,
  extractChartSpec,
  formatValue,
  showLegend,
} from "../src/chart-model";
import type { ChartSpec } from "../src/chart-schema";

const spec: ChartSpec = {
  version: 1,
  type: "bar",
  title: "T",
  x: ["a", "b", "c"],
  series: [
    { name: "S1", data: [1, 2, 3] },
    { name: "S2", data: [4, 5] }, // deliberately short — missing datum → 0
  ],
};

describe("buildChartData", () => {
  it("pivots x + named series into one row per x-point", () => {
    const rows = buildChartData(spec);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ x: "a", S1: 1, S2: 4 });
    expect(rows[1]).toEqual({ x: "b", S1: 2, S2: 5 });
  });

  it("coerces a missing datum to 0", () => {
    expect(buildChartData(spec)[2]).toEqual({ x: "c", S1: 3, S2: 0 });
  });
});

describe("formatValue", () => {
  it("formats currency_usd, percent, and plain numbers", () => {
    expect(formatValue(1234.5, "currency_usd")).toContain("$");
    expect(formatValue(0.1234, "percent")).toBe("12.3%");
    expect(formatValue(1000)).toBe("1,000");
    expect(formatValue(1000, "number")).toBe("1,000");
  });
});

describe("showLegend", () => {
  it("shows only when not disabled and there is more than one series", () => {
    expect(showLegend(spec)).toBe(true);
    expect(showLegend({ ...spec, legend: false })).toBe(false);
    expect(showLegend({ ...spec, series: [spec.series[0]] })).toBe(false);
  });
});

describe("colorAt / PALETTE", () => {
  it("wraps the palette by index", () => {
    expect(PALETTE.length).toBeGreaterThan(0);
    expect(colorAt(0)).toBe(PALETTE[0]);
    expect(colorAt(PALETTE.length)).toBe(PALETTE[0]);
  });
});

describe("extractChartSpec (host payload tolerance)", () => {
  it("strips the wire discriminator from a flat carrier payload", () => {
    const view = { viewType: "chart", version: 1, type: "bar", title: "T", x: ["a"], series: [] };
    expect(extractChartSpec(view)).toEqual({
      version: 1,
      type: "bar",
      title: "T",
      x: ["a"],
      series: [],
    });
  });

  it("unwraps a nested { viewType, spec } payload", () => {
    const inner = { version: 1, type: "line", title: "N", x: ["a"], series: [] };
    expect(extractChartSpec({ viewType: "chart", spec: inner })).toBe(inner);
  });

  it("returns non-object input unchanged (validation then rejects it)", () => {
    expect(extractChartSpec(null)).toBeNull();
    expect(extractChartSpec("x")).toBe("x");
  });
});
