// @cinatra-ai/chart-artifact — the extension-owned `chart` chat renderable-view.
//
// This is the S9-b (epic #1620 "artifact extensions own their UI", M4) migration
// of the host chart embed out of the monorepo: it ships the recharts-based chart
// renderer as a `cinatra.views` PROVIDER — the chat renderable-view declaration
// surface merged in S9-a (`packages/sdk-extensions/src/chat-views-contract.ts`).
// The extension binds ONE component to the wire `chart` viewType; the host owns
// the payload schema + detector permanently and never imports the extension.
//
// It is an ARTIFACT-KIND CARRIER (the M1 "no new extension kind" ruling): the
// artifact kind is the initial carrier for the migrating chat views, so the
// manifest declares `cinatra.kind: "artifact"` with a minimal `cinatra.artifact`
// descriptor (mandatory for the kind) alongside the top-level `cinatra.views`
// block. It ships NO `cinatra.artifact.ui` renderer in this slice — its surface
// is the chat view, not a stored-artifact MIME renderer.
//
// HOST CUTOVER IS A SEPARATE, LATER, OWNER-REVIEWED HOST PR (serialized behind
// the M1 Slice B host integration — both mutate the required-extensions lock):
// the `chart` viewType schema + the markdown-detector reroute, the
// `cinatra-required-extensions.lock.json` entry, and the recharts removal from
// `packages/chat` are NOT in this repo and are not done here. This repo only
// creates + builds + validates the extension; until that host PR lands the host
// keeps rendering charts via its in-tree `[chart:{…}]` → `ChartEmbed` path.

// The renderable-view component the host `cinatra.views` dispatch mounts.
export { default as ChartArtifactView, ChartEmbed, ChartError } from "./views/chart";

// The ported, tolerant chart-spec schema + validator (the same payload the host
// chart detector emits).
export { chartSchema, chartSeriesSchema, normalizeChartInput, validateChart } from "./chart-schema";
export type { ChartSpec } from "./chart-schema";

// Pure model helpers behind the renderer (shared with the tests).
export { PALETTE, colorAt, formatValue, buildChartData, showLegend, extractChartSpec } from "./chart-model";
export type { ChartRow } from "./chart-model";

// The host-supplied renderable-view props contract this component binds to.
export { CHART_VIEW_PROPS_API_VERSION } from "./renderable-view-props";
export type { ChartView, RenderableViewBase, RenderableViewProps } from "./renderable-view-props";

/** The typed mirror of the authoritative `cinatra` block declared in
 * package.json — an artifact-kind carrier that provides the `chart` chat
 * renderable-view. Kept in lock-step with package.json (the manifest test pins
 * the two byte-equal). */
export interface ChartArtifactManifest {
  accepts: { file: { mimeTypes: string[] } };
  views: {
    abiVersion: 1;
    entries: Array<{ viewType: string; entry: string; propsApiVersion: number }>;
  };
}

export const chartArtifactManifest: ChartArtifactManifest = {
  accepts: { file: { mimeTypes: ["application/vnd.cinatra.chart+json"] } },
  views: {
    abiVersion: 1,
    entries: [{ viewType: "chart", entry: "./src/views/chart.tsx", propsApiVersion: 1 }],
  },
};
