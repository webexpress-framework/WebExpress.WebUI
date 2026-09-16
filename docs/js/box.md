![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# BoxCtrl

The `BoxCtrl` component turns a host element into a box: an enclosing frame around content that belongs together, used to set that content apart from the page, to organize it, or to draw the eye to it. A [Card](card.md) is a surface with a filled header bar and a footer, a callout is a colored note, a [Section](section.md) draws no frame at all — the box sits between them. It draws exactly one frame, chosen through the layout, around content it otherwise leaves alone.

Which frame is the whole statement: a hairline groups, a dashed line marks something provisional, a raised surface lifts content out of the flow, a bar on the leading edge points at it without enclosing it. The frame is therefore the one choice the control asks for.

```
   ┌──────────────────────────────────────┐
   │ [Icon] LABEL                         │   // Optional label row
   │                                      │
   │   [Body]                             │   // The adopted content
   └──────────────────────────────────────┘
```

Initialization is declarative: the content is placed directly inside the host element and the behavior is driven by `data-` attributes. The C# counterpart is `WebExpress.WebUI.WebControl.ControlBox`, which emits exactly this host element. The same controller adopts the reading view of the editor's box add-on (see [Editor](editor.md#addons)), so a box authored in rich text and a box declared in C# are one and the same thing on the page.

### Configuration

| Attribute                | Description
|--------------------------|-----------------------------------------------------------------------------------------------------
| `data-layout`            | The frame. One of `solid` (default), `dashed`, `dotted`, `double`, `accent`, `raised`, `inset`, `none` — see below. A value the stylesheet does not know falls back to `solid` rather than leaving the box without a frame.
| `data-header`            | The label of the box, shown in a small upper-case row above the body. Without a label (and without an icon) the row is not shown at all.
| `data-header-icon-css`   | CSS classes of a glyph icon placed before the label.
| `data-header-icon-image` | URL of an image icon placed before the label. Takes precedence over `data-header-icon-css`.
| `data-color-class`       | The CSS class of a system accent color (`text-primary`, …).
| `data-color-style`       | The inline style of a user-defined accent color (`color:gold;`).

The generic WebExpress utility classes still apply to the host: a `border-*` class recolors the line of every drawn frame, a `bg-*` class fills the box, and the spacing utilities place it.

### Layout

The layout travels as a data attribute rather than as a class, because the editor's box add-on persists it the same way — one attribute lets the controller serve both the control and the reading view of the add-on. The controller maps it to the class named below.

| Layout   | Class            | Reads as
|----------|------------------|--------------------------------------------------------------------------
| `solid`  | `wx-box-solid`   | A hairline around the content. The default: it groups without claiming attention.
| `dashed` | `wx-box-dashed`  | A dashed hairline. Provisional — a draft, a placeholder, an area where something can be dropped.
| `dotted` | `wx-box-dotted`  | A dotted hairline. The quietest of the drawn frames, for a grouping that should be felt rather than seen.
| `double` | `wx-box-double`  | A double line. The most formal of the drawn frames, for content quoted or cited from elsewhere.
| `accent` | `wx-box-accent`  | A bar on the leading edge and no other line. Points at the content without enclosing it, like a margin note.
| `raised` | `wx-box-raised`  | No line, but a shadow that lifts the content off the page.
| `inset`  | `wx-box-inset`   | No line, but a subtle fill that sinks the content into the page.
| `none`   | `wx-box-none`    | No frame at all. The box keeps its padding and its label, so it still organizes and lines up with framed boxes beside it, but draws nothing.

Every frame is expressed through the same handful of custom properties (see *Styling*), so a layout is a set of values rather than a set of rules, and an accent or a host stylesheet can re-declare one value without knowing which frame is drawn. The frames that draw no line keep the line in the layout at zero opacity, so a raised, an inset and a solid box beside each other keep their content on one grid.

### Accent

The accent color is applied to the host, so the frame takes it through `currentColor` and the label inherits it, while the body is reset to the body color — the content is not what was accented. The accent colors whatever the layout draws: the hairline, the bar of `accent`, the tint of `inset`. A box keeps one color property across every layout instead of one per kind of line.

### Building a box from JavaScript

A control that composes its own UI can construct a box directly and hang its affordances off three public accessors, instead of reaching into the private structure:

| Accessor        | What it is
|-----------------|--------------------------------------------------------------------------
| `headerElement` | The label row. Append a menu button, a badge, anything that belongs beside the label.
| `titleElement`  | The label element, for restyling or renaming it in place.
| `bodyElement`   | The body, where the adopted content lives.

```javascript
const host = document.createElement("div");
host.dataset.layout = "dashed";
host.dataset.header = "Drop files here";
host.appendChild(dropZone);

const box = new webexpress.webui.BoxCtrl(host);
box.headerElement.appendChild(buildClearButton());
```

### Features

- **Declarative body**: Any HTML placed within the host element becomes the body. The component takes ownership of these child elements upon initialization.
- **One frame**: The stylesheet draws exactly the frame the layout names, and nothing else — no header bar, no footer, no shadow unless the layout is `raised`.
- **Label only when there is one**: The label row is built once so a label set later has a place to go, but it is hidden while neither a label nor an icon is declared, so a plain frame does not carry an empty line above its body.
- **The editor's box is this box**: The editor keeps a box add-on in its generic card frame, and that frame carries the layout as a data attribute. The stylesheet names both the rendered box and the body of such a frame in every frame rule, so the author sees the frame the reader will get; the reading view then hands the block to this controller.
- **Theme-safe**: All colours come from the WebExpress CSS variables shipped with `WebExpress.WebUI`, so a box follows the light / dark switch without extra rules.

### Programmatic Control

#### 1. Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('upload-box');

// retrieve the controller instance associated with the element
const box = webexpress.webui.Controller.getInstanceByElement(element);

if (box) {
    // a drop zone turns solid once something was dropped into it
    box.layout = 'solid';

    // and says what it holds
    box.header = '3 files';
}
```

#### 2. Manual Instantiation

```javascript
// find the container element for the dynamic box
const container = document.getElementById('dynamic-box');

// create a new instance manually
const box = new webexpress.webui.BoxCtrl(container);

// the frame and the label can be set after construction
box.layout = 'raised';
box.header = 'Summary';
```

### Styling

All colours come from the WebExpress CSS variables shipped with `WebExpress.WebUI`. The frame is exposed as custom properties on `.wx-box` and can be re-declared per zone or per box:

| Property                   | Purpose
|----------------------------|-----------------------------------------------------------------------------
| `--wx-box-padding-y`       | The vertical padding between the frame and the content.
| `--wx-box-padding-x`       | The horizontal padding between the frame and the content.
| `--wx-box-line-width`      | The width of the line. The `double` layout triples it.
| `--wx-box-line-style`      | The style of the line — what the `dashed` and `dotted` layouts change.
| `--wx-box-line-color`      | The color of the line. The accent sets it to `currentColor`; the frames without a line set it to `transparent`.
| `--wx-box-accent-width`    | The width of the bar in the `accent` layout.
| `--wx-box-radius`          | The corner radius of the frame.
| `--wx-box-fill`            | The background of the box — what the `inset` layout sets.
| `--wx-box-elevation`       | The shadow of the box — what the `raised` layout sets, from the framework's `--wx-box-shadow`.
| `--wx-box-label-size`      | The type size of the label.
| `--wx-box-label-spacing`   | The letter spacing of the upper-case label.

The name `--wx-box-shadow` is deliberately not used by the box: it is the framework-wide elevation, and a box that redefined it would take the shadow off every dropdown inside it.

```css
/* a drop zone wants a heavier dashed line and more room than a note */
.wx-upload .wx-box {
    --wx-box-line-width: 2px;
    --wx-box-padding-y: 2rem;
}
```

### Use Case Example

```html
<!--
    A dashed box labelled as a drop zone. The body is any markup placed inside the host element.
-->
<div id="upload-box"
     class="wx-webui-box"
     data-layout="dashed"
     data-header="Attachments"
     data-header-icon-css="wx-icon-light wx-icon-light-paperclip">

    <!-- This content becomes the body. -->
    <p>Drop files here or pick them from the library.</p>
</div>
```

### Choosing Between a Box, a Card and a Section

Use a [Card](card.md) when the content is a thing of its own with a name and, often, actions — the header bar and the footer are where those go. Use a [Section](section.md) when the page shows one subject and the parts are facets of it: any frame would then draw a boundary where the content has none. Use a box for everything between: content that belongs together and should read as one group, set apart from the page by exactly as much as the frame you choose.
