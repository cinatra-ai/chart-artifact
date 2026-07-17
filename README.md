# Chart

Renders data charts in the Cinatra chat surface. Agents describe a chart as a small data spec — a type (bar, line, or area), x-axis labels, and one or more named numeric series — and this extension draws it as a clean, themed recharts visualization with formatted axes, an optional legend, and currency, percent, or plain-number value formatting. Malformed data degrades to a short inline notice instead of a blank space, so the chat is never broken by a bad chart.

This extension owns the `chart` renderable-view: it provides the component that the host mounts for the `chart` view type. The host still detects and emits the chart payload — that stays host-side permanently — and the switchover that routes the host through this extension (the view-type schema, the detector reroute, the required-extension lock entry, and removing recharts from the host) is a separate, later, owner-reviewed host change and is intentionally not part of this repository.

## Works with

- Cinatra chat — assistant and tool responses that emit a chart view

## Capabilities

- Draw bar, line, and area charts from a compact, validated data spec
- Show multiple named series with a themed color palette and an optional legend
- Format values as currency, percent, or plain numbers on the axis and tooltip
- Render identically across the chat and the CMS embed surface
- Fall back to a short inline notice when the chart data is missing or malformed
