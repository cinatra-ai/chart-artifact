// The props snapshot a `cinatra.views` chat renderable-view component receives.
//
// The host chat surface dispatches a wire `DATA_PART` renderable-view payload
// (discriminated by a namespaced `viewType`) to the registered component for
// that viewType, handing it `{ view }` — the parsed, host-owned payload for the
// discriminator (the same shape the host `RenderableViewCard` dispatcher passes
// its cards). The host owns the PAYLOAD schema for each `viewType`
// (@cinatra-ai/agent-ui-protocol/renderable-views); an extension binds a
// COMPONENT to the discriminator via `cinatra.views`.
//
// The type is declared LOCALLY (not imported) so this extension stays a
// self-contained source mirror with no first-party host dependency: the
// component binds structurally to whatever payload the host serializes for the
// `chart` viewType. `propsApiVersion` 1 is the contract version the manifest
// entry declares.

/** The props-contract version the `chart` renderable-view component is built against. */
export const CHART_VIEW_PROPS_API_VERSION = 1;

/** The common shape of every renderable-view payload: a namespaced discriminator. */
export interface RenderableViewBase {
  /** Namespaced view discriminator, e.g. `"chart"`. */
  viewType: string;
}

/**
 * The `chart` renderable-view payload. The host chart detector emits the chart
 * spec fields; this extension tolerates BOTH the flat carrier form
 * (`{ viewType: "chart", ...chartSpec }`) and a nested `{ viewType, spec }` form
 * so it renders faithfully regardless of how the host packages the payload at
 * cutover (the spec fields themselves are validated by `validateChart`).
 */
export type ChartView = RenderableViewBase & {
  viewType: "chart";
} & Record<string, unknown>;

/** The props a registered renderable-view component receives from the host. */
export interface RenderableViewProps<V extends RenderableViewBase = RenderableViewBase> {
  view: V;
}
