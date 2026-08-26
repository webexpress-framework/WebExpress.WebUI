![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# GroupCtrl

The `GroupCtrl` turns a host element carrying arbitrary items into one bounded surface whose fields are divided by hairlines. Styling lives in `webexpress.webui.group.css`; the C# side (`ControlGroup`) emits the host and its `data-` attributes, and the controller wraps each item in a field and decides where the dividers go.

```
   ┌──────────────┬──────────────┬──────────────┬──────────────┐
   │ [item]       │ [item]       │ [item]       │ [item]       │  // one row, three dividers
   └──────────────┴──────────────┴──────────────┴──────────────┘

   ┌──────────────┬──────────────┐
   │ [item]       │ [item]       │  // wrapped: the first field of each row
   ├──────────────┼──────────────┤  // carries no left divider, and the rows
   │ [item]       │ [item]       │  // separate horizontally instead
   └──────────────┴──────────────┘
```

Things placed side by side are read as one statement about one subject, and the reader compares them. Left as separate boxes they read as separate claims: each carries its own frame, the gaps between them say nothing, and nothing indicates that they share a scope. Four metrics describing one installation, four entry paths into one body of work, three columns of one help area — each is a group.

The content is not the group's business. Any control can be a field: a stat, a card, a list, a paragraph, a section of its own. A divider drawn on every field except the first is correct only while the row does not wrap. Once it does, the first field of every later row carries a line into empty space and the rows have nothing between them. Which field starts a row is a question about the laid-out geometry, not about the position in the markup, so it is answered after layout and re-answered whenever the width changes (`ResizeObserver`).

## Configuration

The component is initialised declaratively from `data-` attributes on the host element. The C# side sets these automatically; manual HTML usage is possible too. The children of the host are preserved: each is wrapped in a `.wx-group-field`, so an item keeps whatever produced it.

| Attribute       | Description
|-----------------|-------------
| `data-columns`  | Number of fields per row. Written to the `--wx-group-columns` custom property. Omitted or `0` lets the fields divide the available width between them, whatever their number.
| `data-framed`   | `"false"` drops the surface and the border, for a group placed inside something that already frames it. Any other value (or the absence of the attribute) keeps the bounded look.
| `data-spacing`  | `"none"`, `"narrow"` or `"wide"` — the room a field gives its content. Absent means the default: none, which is what a field holding a control needs, since the control brings its own padding.

All three are removed from the host after they are read, so the rendered element carries only what describes its state.

## Structure

```html
<!-- as emitted by the server -->
<div id="figures" class="wx-webui-group" data-columns="4">
    <div class="wx-stat">…</div>
    <div class="wx-stat">…</div>
</div>

<!-- after the controller has run -->
<div id="figures" class="wx-group">
    <div class="wx-group-field wx-group-row-start"><div class="wx-stat">…</div></div>
    <div class="wx-group-field"><div class="wx-stat">…</div></div>
</div>
```

| Class                   | Description
|-------------------------|-------------
| `wx-group`              | The surface. Grid, border, radius and the background of the current theme.
| `wx-group-bare`         | Added for `data-framed="false"`: no background, no border, no radius.
| `wx-group-narrow` / `-wide` / `-none` | Added for `data-spacing`: moves the padding token of the fields.
| `wx-group-field`        | One item. Carries the divider on its left edge, and one above it unless it is in the first row.
| `wx-group-row-start`    | Set by the controller on every field that begins a row: drops the left divider, which would otherwise run into empty space.
| `wx-group-first-row`    | Set by the controller on the fields of the first row. Everything without it is separated from the row above - marking the row rather than its first field is what makes the rule run the full width.
| `wx-group-filler`       | An empty field added by the controller to complete a short last row, so the dividers reach the edge instead of stopping at the hole. Only in a group that actually wraps: in a single row it would fence off space that is simply unused.

## Custom properties

| Property             | Description
|----------------------|-------------
| `--wx-group-columns` | Fields per row. Set from `data-columns`; defaults to `4` in the stylesheet, narrowed to `2` below 62rem and `1` below 34rem.
| `--wx-group-bg`      | The surface colour. Follows `--wx-body-bg`, and `--wx-dark` under `[data-bs-theme="dark"]`.
| `--wx-group-border`  | The colour of the border and the dividers. Follows `--wx-border-color`.
| `--wx-group-padding` | The padding of a field. Moved by the spacing variants rather than overridden per rule.

## Lifecycle

`destroy()` disconnects the `ResizeObserver`. The fields themselves are left in place — they are the rendered state of the control, not a temporary overlay.

The observer is optional: in a runtime without `ResizeObserver` the marks are set once, on construction, which is what a headless test reads.

## Events

The control raises none. It reacts to width, not to input.
