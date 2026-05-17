![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# PanelDismissibleCtrl

The `PanelDismissibleCtrl` is a dismissible container with a title bar and an `x` button in the upper-right corner. Users can hide the panel manually; other controls can re-open it through the [`show` bind](#data-bind-show), which makes it a natural fit for master-detail layouts (list selection → details panel).

```
   ┌──────────────────────────────────┐
   │ [Title]                       x  │  // Header with title + dismiss button
   ├──────────────────────────────────┤
   │                                  │
   │         [Body Content]           │  // Arbitrary controls
   │                                  │
   └──────────────────────────────────┘
```

### Configuration

The component is initialised declaratively from `data-` attributes on the host element. The C# side (`ControlPanelDismissible`) sets these attributes automatically; manual HTML usage is possible too.

| Attribute               | Description
|-------------------------|-------------
| `data-title`            | Title text rendered in the header bar.
| `data-initial-hidden`   | When set to `"true"`, the panel starts in the hidden state.
| `data-dismiss-aria`     | aria-label of the dismiss button (defaults to `"close"`).

### Features

- **Toggleable visibility**: `show()`, `hide()`, and `toggle()` allow programmatic control of the panel state.
- **Dismiss button**: A Font Awesome `fa-xmark` button styled with the same `wx-button-close` class the `Alert` / `Modal` close buttons use, including the hover-to-danger colour transition. The button is pinned to the right edge of the header via the `ms-auto` flex utility.
- **Fade animation**: Show/hide go through Bootstrap's `.fade` + `.show` opacity transition (same pattern as `Alert` / `Toast`); the panel only becomes `d-none` after the fade-out completes, so the dismiss is visibly animated. `SHOW_EVENT` / `HIDE_EVENT` fire at the end of the animation.
- **Data-binding ready**: External controls (lists, tiles, trees) can re-open the panel by emitting `SELECT_ITEM_EVENT` and being referenced through the [`show` bind](#data-bind-show).
- **Arbitrary body content**: Any HTML nested inside the host element on initialisation becomes the body of the panel.

### Programmatic Control

The component exposes a small public API. After initialisation, the instance can be retrieved through `webexpress.webui.Controller.getInstanceByElement(...)`:

```javascript
const panel = webexpress.webui.Controller.getInstanceByElement(document.getElementById("detailPanel"));

panel.show();          // reveal
panel.hide();          // dismiss
panel.toggle();        // flip current state
panel.setTitle("New"); // update header text
console.log(panel.isVisible);
```

### Events

The component dispatches:

- **`webexpress.webui.Event.SHOW_EVENT`** - fired exactly once when the panel transitions from hidden to visible.
- **`webexpress.webui.Event.HIDE_EVENT`** - fired exactly once when the panel transitions from visible to hidden, including dismiss-button clicks.

### `data-bind="show"`

The companion `show` bind reacts to events on a source element and calls `show()` on the bound control. Defaults to listening for `SELECT_ITEM_EVENT` - the event raised by `ListCtrl`, `TileCtrl` and `TreeCtrl` when the active item changes.

| Attribute                          | Description
|------------------------------------|-------------
| `data-wx-bind`                     | Must contain `show` (combined with other binds via comma).
| `data-wx-source-show`              | CSS selector of the source element (e.g. `#myList`).
| `data-wx-bind-event-show`          | Optional event name. Default: `webexpress.webui.select.item`.
| `data-wx-bind-condition-show`      | Optional condition expression evaluated against the event detail. Same syntax as the `hide` bind (`!=null`, `>10`, `/^foo/i`, ...).
| `data-wx-bind-detail-show`         | Optional key in the event `detail` used for the condition. Default: `itemId`.

### Use Case Example

A list paired with a dismissible details panel - user picks an entry, panel appears; user closes the panel; user picks a different entry, panel reopens.

```html
<!-- selectable source list -->
<div id="characters" class="wx-webui-list" data-selectable="true">
    <div class="wx-list-item">Guybrush Threepwood</div>
    <div class="wx-list-item">Elaine Marley</div>
    <div class="wx-list-item">LeChuck</div>
</div>

<!-- dismissible panel re-opened by the list's SELECT_ITEM_EVENT -->
<div id="detailPanel"
     class="wx-webui-panel-dismissible"
     data-title="Details"
     data-wx-bind="show"
     data-wx-source-show="#characters">
    <p>Pick a character on the left, then close this panel with the X button.</p>
    <p>Selecting another entry will bring it back automatically.</p>
</div>
```

### C# Counterpart

The same wiring expressed from the server side via `WebExpress.WebUI`:

```csharp
new ControlList("characters") { Selectable = _ => true }
    .Add(new ControlListItem(null) { Text = _ => "Guybrush Threepwood" })
    .Add(new ControlListItem(null) { Text = _ => "Elaine Marley" });

new ControlPanelDismissible("detailPanel")
{
    Title = _ => "Details",
    Bind  = _ => new Binding().Add(new BindShow { Source = "characters" })
}
    .Add(new ControlText() { Text = _ => "Pick a character above." });
```

For composable variants where additional content is contributed through registered fragments (analogous to `ControlView`), use `FragmentControlPanelDismissible` and target it with the `SectionPanelDismissibleBody` section.
