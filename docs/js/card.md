![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# CardCtrl

The `CardCtrl` renders a card panel with an optional header, headline, footer and matching header / footer icons. Styling lives in `webexpress.webui.panel.card.css`; the card markup intentionally stays in the `wx-*` namespace so it does not pull in Bootstrap's `.card` rules.

```
   ┌──────────────────────────────────┐
   │ [icon] [Header]                  │  // Header row (icon + text)
   ├──────────────────────────────────┤
   │ [Headline]                       │  // Optional headline inside body
   │                                  │
   │         [Body Content]           │  // Original child controls
   │                                  │
   ├──────────────────────────────────┤
   │ [icon] [Footer]                  │  // Footer row (icon + text)
   └──────────────────────────────────┘
```

### Configuration

The component is initialised declaratively from `data-` attributes on the host element. The C# side (`ControlPanelCard`) sets these attributes automatically; manual HTML usage is possible too. The original children of the host element are preserved and moved into the `card-text` wrapper during the first render.

| Attribute                    | Description
|------------------------------|-------------
| `data-header`                | Header label text (i18n-translated server-side).
| `data-header-icon-css`       | CSS class for the header icon (e.g. `"fas fa-user"`). Rendered as `<i>`.
| `data-header-icon-image`     | Image URL for the header icon. Rendered as `<img class="wx-icon">`. Mutually exclusive with `data-header-icon-css`; if both are set, the image variant wins.
| `data-header-bg-class`       | CSS class for the header background (e.g. `"bg-primary"`). Applied to `.wx-card-header`.
| `data-header-bg-style`       | Inline style for a user-defined header background (e.g. `"background:gold;"`).
| `data-header-color-class`    | CSS class for the header text colour (e.g. `"text-light"`).
| `data-header-color-style`    | Inline style for a user-defined header text colour.
| `data-headline`              | Optional headline rendered as `<h4 class="wx-card-title">` inside the body.
| `data-footer`                | Footer label text (i18n-translated server-side).
| `data-footer-icon-css`       | CSS class for the footer icon.
| `data-footer-icon-image`     | Image URL for the footer icon.
| `data-footer-bg-class`       | CSS class for the footer background.
| `data-footer-bg-style`       | Inline style for a user-defined footer background.
| `data-footer-color-class`    | CSS class for the footer text colour.
| `data-footer-color-style`    | Inline style for a user-defined footer text colour.

### Features

- **Image or CSS icons**: `HeaderIcon` / `FooterIcon` accept any `IIcon`. `ImageIcon` is serialised into `data-*-icon-image`; CSS-based icons (e.g. `IconHome`) are serialised into `data-*-icon-css`. The controller renders the corresponding `<i>` or `<img>` element.
- **Independent header / footer colours**: `HeaderBackgroundColor`, `HeaderTextColor`, `FooterBackgroundColor`, `FooterTextColor` style each row separately from the card body. System colours (e.g. `TypeColorBackground.Primary`) translate to CSS classes like `bg-primary` / `text-light`; free-form values (e.g. `"gold"`, `"#abcdef"`) translate to inline styles. The two ends can use entirely different palettes.
- **JS-driven structure**: The `wx-card-header`, `wx-card-body`, `wx-card-title`, `wx-card-text` and `wx-card-footer` elements are constructed by the controller and styled by `webexpress.webui.panel.card.css`. The C# host stays minimal and Bootstrap-free.
- **Lifecycle-safe updates**: Every public setter triggers `render()`, which rebuilds the card from the current configuration. Header / footer rows are omitted entirely when neither an icon nor a label is set.
- **Child preservation**: The original child nodes of the host are lifted out before the first render and re-attached inside `wx-card-text`, so server-side controls embedded inside the card stay alive across re-renders.
- **Themable**: All paddings, radii, background and border colours are driven by CSS custom properties on `.wx-card` (`--wx-card-spacer-y`, `--wx-card-cap-bg`, `--wx-card-border-color`, …) and resolve against the active Bootstrap variables, so light/dark theming and `.border` / text-colour utilities work out of the box.

### Programmatic Control

The controller is registered against the `wx-webui-panel-card` class. After initialisation, the instance can be retrieved through `webexpress.webui.Controller.getInstanceByElement(...)`:

```javascript
const card = webexpress.webui.Controller.getInstanceByElement(document.getElementById("statusCard"));

card.header = "Database";                // change header text
card.headerIconCss = "fas fa-database";   // swap header icon for a glyph
card.headerBgClass = "bg-danger";         // tint the header
card.headerColorClass = "text-white";     // and its text
card.headline = "Online";                 // change the body headline
card.footer = "updated 2s ago";           // change footer text
card.footerIconImage = "/img/check.png";  // swap footer icon for an image
card.footerBgStyle = "background:gold;";  // free-form footer colour
card.headerIconCss = null;                // remove the header icon
```

Setting either `*IconCss` or `*IconImage` clears the other variant so the two icon forms never coexist on the same row. The `*BgClass` / `*BgStyle` and `*ColorClass` / `*ColorStyle` pairs are independent: classes and inline styles can be combined when needed.

### Events

The controller does not dispatch any events of its own - cards are passive display containers. Use the surrounding controls (lists, buttons, etc.) if event-driven behaviour is required.

### Use Case Example

A small status card whose header label, body headline and footer icon are updated when a list selection changes.

```html
<!-- selectable source list -->
<div id="services" class="wx-webui-list" data-selectable="true">
    <div class="wx-list-item" data-item-id="database">Database</div>
    <div class="wx-list-item" data-item-id="cache">Cache</div>
    <div class="wx-list-item" data-item-id="queue">Queue</div>
</div>

<!-- card with data-* attributes only; the controller builds the structure -->
<div id="statusCard"
     class="wx-webui-card border"
     data-header="Database"
     data-header-icon-css="fas fa-database"
     data-headline="Online"
     data-footer="updated just now"
     data-footer-icon-css="fas fa-clock">
    <p>Pick a service on the left.</p>
</div>

<script>
const card = webexpress.webui.Controller.getInstanceByElement(
    document.getElementById("statusCard")
);

document.getElementById("services").addEventListener(
    webexpress.webui.Event.SELECT_ITEM_EVENT,
    (e) => {
        card.header = e.detail.text;
        card.headerIconCss = "fas fa-" + e.detail.itemId;
    }
);
</script>
```
