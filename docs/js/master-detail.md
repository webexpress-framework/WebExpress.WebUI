![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# MasterDetailCtrl

The `MasterDetailCtrl` turns two independent controls into a master-detail view: an enumeration control on one side, a detail region on the other, and the selection state that ties them together.

The component is a composite. It owns the layout and the selected id but none of the content: the master side may be any control that renders selectable items - `ControlList`, `ControlTile`, `ControlTable`, a kanban board, a backlog or hand-written markup - and the detail side is a `FrameCtrl` that fetches its content on demand. Neither half knows the other; both are reached only through the item contract and the frame's `uri` setter.

The splitter is not reimplemented. The host wraps a `SplitCtrl`, so dragging, the persisted size and the min/max constraints all come from there. Hiding the detail side hides its content, which makes the split drop the splitter, hand the whole container to the master and restore the previous splitter position once the detail comes back. The master side is rendered non-collapsible (`data-collapsible="false"` on the split): it carries the only navigation of the view, so the splitter stops at `data-min-side` instead of dragging it out of sight.

The detail side carries its own way out, in a header bar that sits above its scrolling body: a close button in the two-column layout and a back button in the sequential one. The bar is no part of the scroll area, so neither button can cover the detail content or scroll out of reach with it.

```
   // two-column mode (>= breakpoint)
   ┌───────────────────┬───┬──────────────────────────────┐
   │ ▸ Entry 1         │ ░ │                            × │ 
   │ ▪ Entry 2         │ S │   Detail                     │
   │ ▸ Entry 3         │ p │                              │
   │ ▸ Entry 4         │ l │   loaded on demand           │
   │                   │ i │   through the frame          │
   │                   │ t │                              │
   │                   │ t │                              │
   │                   │ e │                              │
   │                   │ r │                              │
   │                   │ ░ │                              │
   └───────────────────┴───┴──────────────────────────────┘
     ↑ never dragged away:  ↑ gap to the splitter, on the
       the splitter stops     body only (--wx-master-detail-gap)
       at data-min-side

   // sequential mode (< breakpoint)
   ┌────────────────────┐        ┌────────────────────┐
   │ ▸ Entry 1          │        │ ← Back to the list │
   │ ▪ Entry 2          │  ───►  ├────────────────────┤
   │ ▸ Entry 3          │        │  Detail            │
   │ ▸ Entry 4          │  ◄───  │                    │
   └────────────────────┘        └────────────────────┘
```

## Structure

The controller binds to a fixed structure, which `ControlMasterDetail` renders on the server. A hand-written host has to provide the same one.

```html
<div id="myMasterDetail" class="wx-webui-master-detail" data-breakpoint="768">
    <div id="myMasterDetail-split" class="wx-webui-split"
         data-size="30" data-unit="%" data-min-side="180" data-collapsible="false">
        <div class="wx-side-pane">
            <div class="wx-master">
                <!-- any enumeration control -->
                <div class="wx-webui-list" data-selectable="true">
                    <div class="wx-list-item" data-bind-id="1" data-bind-uri="/apps/details?id=1">Entry 1</div>
                </div>
            </div>
        </div>
        <div class="wx-main-pane">
            <div id="myMasterDetail-detail" class="wx-detail">
                <div class="wx-detail-body">
                    <div class="wx-empty-state">…please select an item…</div>
                    <div id="myMasterDetail-frame" class="wx-webui-frame"></div>
                </div>
            </div>
        </div>
    </div>
</div>
```

The two ways out of the detail side are created by the controller, because which of them applies depends on the layout mode that only the client knows. Both go into `.wx-detail-header`, which the controller prepends to `.wx-detail`:

```html
<div id="myMasterDetail-detail" class="wx-detail">
    <div class="wx-detail-header">
        <button class="wx-detail-back">…</button>
        <button class="btn wx-button-close wx-detail-close">×</button>
    </div>
    <div class="wx-detail-body">…</div>
</div>
```

- `.wx-detail-close` - the framework's standard close button (`btn wx-button-close`, the same one the modal and the dismissible panel use), at the trailing edge of the bar. Shown in the two-column layout. It sits in the bar rather than floating over the pane, so it can neither cover what the loaded detail places in that corner nor scroll away with it.
- `.wx-detail-back` - a labelled back button at the leading edge of the same bar. Shown in the sequential mode, where it replaces the close button.

The bar is a sibling of `.wx-detail-body` and only the body scrolls, so the bar stays put. With `data-closable="false"` it has nothing to show outside the sequential mode; the controller then leaves the marker class `wx-md-closable` off the host and the stylesheet hides the empty bar.

## Configuration

The behavior is controlled entirely via `data-` attributes on the host element. They are removed after being read, so no configuration leaks into the DOM. The splitter is configured on the nested split element (see [SplitCtrl](split.md)).

| Attribute              | Description
|------------------------|-------------------------------------------------------------------------------------------------------------------------
| `data-breakpoint`      | The container width in pixels below which the control switches to the sequential single-column mode. Default is `768`; `0` disables the mode. The width of the *container* is measured, not of the viewport, so a control inside a narrow column behaves like one on a narrow screen.
| `data-item`            | The css selector identifying a selectable item inside the master side. Default is `.wx-list-item, .wx-tile-card, .wx-table-row, .wx-grid-row, .wx-kanban-card, .wx-scrum-row, [data-bind-uri], [data-wx-primary-action='master-detail']` - the item markup of the built-in controls both as authored on the server and as those controls re-render it, plus the two neutral hooks.
| `data-detail-uri`      | The uri template used for items that carry an id but no uri of their own. The placeholder `{id}` is replaced by the (uri-encoded) item id.
| `data-detail-visible`  | `"false"` starts with a hidden detail side - the master alone, without a splitter. Any other value (or none) starts with both sides visible.
| `data-closable`        | `"false"` omits the close button, for a view whose detail side must always stay open. Hiding it through the toggle action or the api remains possible either way.
| `data-reveal`          | The gesture that opens a *hidden* detail side. The default opens it on any selection; `"dblclick"` waits for a double click, so a single click only moves the selection while the detail is closed. Once the detail is open the mode no longer applies and a single click swaps its content.

## Item contract

A selectable item is an element that matches the item selector and carries at least one of the following attributes. The first attribute present in each list wins.

| Purpose    | Attributes (in order)                                             |
|------------|-------------------------------------------------------------------|
| Detail uri | `data-bind-uri`, `data-wx-primary-uri`, `data-uri`, `data-href`    |
| Item id    | `data-bind-id`, `data-wx-primary-item`, `data-tile-id`, `data-card-id`, `data-item-id`, `id` |

The id list covers the item markup the built-in enumeration controls write for themselves - a kanban board labels its cards `data-card-id`, a backlog its rows `data-item-id` - so those masters resolve without the host having to restate the id.

An item that carries only an id resolves its uri through `data-detail-uri`, so the master can stay free of routing knowledge. Items marked with `disabled`, `aria-disabled="true"` or the class `disabled` are neither selectable nor reachable with the keyboard.

## Selection routing

Selections arrive through four channels that all funnel into `select()`, so the state transition is identical no matter what triggered it:

1. **A delegated click** on the master side. Delegation is used instead of per-item listeners, so items rendered later are covered without a re-binding pass.
2. **A delegated double click**, which selects and always opens the detail side. It is the gesture `data-reveal="dblclick"` waits for.
3. **Keyboard activation** with `Enter` or `Space`.
4. **The selection events of the master control itself** - `SELECT_ITEM_EVENT` and `SELECT_ROW_EVENT` - which keep the state in sync when that control selects on its own, for example when a selectable list auto-selects its first row.

A click that lands on a control inside an item - `button`, `input`, `textarea`, `select` or a `contenteditable` - operates that control and changes no selection, so a row menu never loads a detail behind the action the user asked for.

Whether a selection opens a *hidden* detail side is decided per call: `reveal: true` always opens it, `reveal: false` never does, and leaving it out lets `data-reveal` decide. The pointer channels leave it out, so they follow the mode; keyboard activation and the programmatic `selectItem()` pass `reveal: true`, because both are deliberate and have no second gesture to wait for.

A selection that is already present when the controller initializes (an item carrying `aria-selected="true"` or the class `active`) is adopted, but does not override a configured `data-detail-visible="false"`.

Selecting the item that is already selected does **not** fetch again; call `reload()` for an explicit refresh. A selection made while the detail is hidden fetches nothing at all - opening the detail later syncs the content, so a closed detail costs no round trips.

Content that arrives in the detail frame is animated in (a short rise into place, `wx-detail-enter`), so a swap from one item to the next reads as a transition rather than as a jump. The frame keeps the previous detail on screen while the next one is on its way - no skeleton in between - so the two exchange in a single step. Only the *arrival* is animated, which also means a failed load can never leave the detail stuck invisible. The animation is suppressed under `prefers-reduced-motion`.

## Accessibility

The controller applies the listbox pattern to whatever the master renders:

- `role="listbox"` goes on the element that actually owns the items - the list's own container when they share one - so the options stay direct children of their listbox. `role="option"` and `aria-controls` (pointing at the detail region) go on every item.
- `aria-selected` reflects the selection; exactly one item is `"true"`.
- A roving `tabindex` keeps a single tab stop: the selected item, or the first one when nothing is selected.
- `ArrowUp` / `ArrowDown` move the focus, `Home` / `End` jump to the ends, `Enter` / `Space` activate, and `Escape` returns from the detail overlay in the sequential mode.

Keyboard events that another control already handled (`defaultPrevented`) are left alone, so a self-navigating master such as `TableCtrl` does not move twice.

## Programmatic Control

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById("myMasterDetail");

// retrieve the controller instance associated with the element
const masterDetail = webexpress.webui.Controller.getInstanceByElement(element);

if (masterDetail) {
    // the currently selected id
    const current = masterDetail.selectedId;

    // select an item by id; the uri is resolved from the item or the template
    masterDetail.selectItem("1024");

    // select an item explicitly, bypassing the item markup entirely
    masterDetail.select({ id: "1024", uri: "/apps/details?id=1024" });

    // back to the placeholder
    masterDetail.clearSelection();

    // show, hide or toggle the detail side (the splitter goes with it)
    masterDetail.showDetail();
    masterDetail.hideDetail();
    masterDetail.toggleDetail();

    // fetch the current detail content again
    masterDetail.reload();

    // re-read the master items after they were replaced outside a mutation
    masterDetail.refresh();

    // the current layout mode
    if (masterDetail.compact) {
        // single-column, the detail slides in as an overlay
    }
}
```

### Declarative Actions

Two actions are registered so a control can drive the composite without custom JavaScript. Their server-side counterparts are `ActionMasterDetail` and `ActionMasterDetailToggle`.

```html
<!-- selects the item and loads the uri into the detail side -->
<div class="wx-list-item"
     data-wx-primary-action="master-detail"
     data-wx-primary-target="#myMasterDetail"
     data-wx-primary-item="1024"
     data-wx-primary-uri="/apps/details?id=1024">Entry</div>

<!-- shows or hides the detail side -->
<button data-wx-primary-action="master-detail-toggle"
        data-wx-primary-target="#myMasterDetail">Toggle detail</button>
```

## Events

- **`webexpress.webui.Event.SELECT_ITEM_EVENT`**: Fired when the selection changes.
  - Payload: `{ itemId: string|null, uri: string|null, item: HTMLElement|null }`
- **`webexpress.webui.Event.SHOW_EVENT`**: Fired when the detail side becomes visible.
  - Payload: `{ compact: boolean }`
- **`webexpress.webui.Event.HIDE_EVENT`**: Fired when the detail side is hidden.
  - Payload: `{ compact: boolean }`
- **`webexpress.webui.Event.BREAKPOINT_CHANGE_EVENT`**: Fired when the layout mode changes.
  - Payload: `{ compact: boolean, breakpoint: number, width: number }`

## Styling

| Class                  | Purpose
|------------------------|--------------------------------------------------------------------------
| `.wx-master-detail`    | The host, once the controller has upgraded it. It draws no frame of its own - no border, no radius: the control is a layout region rather than a card, so the page around it brings whatever framing it wants and the splitter alone divides the two columns.
| `.wx-master`           | The master column. Scrolls on its own (`overflow-y: auto`).
| `.wx-detail`           | The detail column. It fills the whole main pane: the stylesheet takes back the `overflow: auto` the split writes onto that pane, because its scrollbar gutter would otherwise sit between the pane edge and the detail.
| `.wx-detail-body`      | The scrolling part of the detail column, and the only part that scrolls. A `padding-left` of `--wx-master-detail-gap` (default `0.75rem`) keeps the content clear of the splitter, so it does not start right against the drag handle. The gap sits here rather than on `.wx-detail`, because the header bar above has to run edge to edge. Beyond that gap the body carries no padding: the detail content is a page in its own right, gets the full width and brings whatever spacing it wants.
| `.wx-detail-swap`      | Set on the frame while freshly arrived content plays its enter animation, and removed again on `animationend` so the next swap can restart it.
| `.wx-detail-header`    | The fixed bar above the scrolling body, holding the close and the back button. It has neither a background nor a border, so the detail reads as one surface, and stays only as tall as its buttons need. The minimum height clears the taller of the two, so the bar does not change height when the layout mode swaps one button for the other.
| `.wx-detail-close`     | The close button, at the trailing edge of the bar. Shown in the two-column layout.
| `.wx-detail-back`      | The back button, at the leading edge of the same bar. Shown in the sequential mode, where it replaces the close button.
| `.wx-md-item-active`   | The selected item. The accent is an inset shadow rather than a border, because a border would shift the item content of any master that does not compensate for it.
| `.wx-md-closable`      | Set on the host while the detail carries a close button. Its absence lets the stylesheet hide a header bar that would be empty outside the sequential mode.
| `.wx-md-compact`       | Set on the host while the sequential mode is active. The detail then covers the whole container, so the gap to the splitter goes with it.
| (embedded controls)    | A `.wx-list` or `.wx-table` inside the control loses its own border and radius: the composite is frameless, so a card inside it would be the only border in the view - a stray box around the master rather than the plain column the layout asks for.
| `.wx-md-detail-open`   | Set on the host while the detail overlay is on screen.

The two columns scroll independently, which only works against a definite height. The host therefore has one, taken from `--wx-master-detail-height` (default `70vh`). Override it wherever the parent has a height of its own:

```csharp
new ControlMasterDetail("myMasterDetail")
{
    Styles = ["--wx-master-detail-height: 100%;"]
};
```

The gap between the splitter and the detail content is a variable of its own, so a detail that loads a full-bleed page can take it back. It applies to `.wx-detail-body` only; the header bar always runs the full width of the pane:

```csharp
new ControlMasterDetail("myMasterDetail")
{
    Styles = ["--wx-master-detail-gap: 0;"]
};
```

## Use Case Example

```html
<!--
    A master-detail view whose items carry only ids; the detail uri is built
    from the template. Below 768 px of container width the control switches to
    the sequential mode.
-->
<div id="myMasterDetail"
     class="wx-webui-master-detail"
     data-breakpoint="768"
     data-detail-uri="/apps/details?id={id}">

    <div id="myMasterDetail-split" class="wx-webui-split" data-size="30" data-unit="%" data-min-side="180">
        <div class="wx-side-pane">
            <div class="wx-master">
                <ul class="wx-list">
                    <li class="wx-list-item" data-bind-id="1">Entry 1</li>
                    <li class="wx-list-item" data-bind-id="2">Entry 2</li>
                </ul>
            </div>
        </div>
        <div class="wx-main-pane">
            <div id="myMasterDetail-detail" class="wx-detail">
                <div class="wx-detail-body">
                    <div class="wx-empty-state">Please select an item.</div>
                    <div class="wx-webui-frame"></div>
                </div>
            </div>
        </div>
    </div>
</div>
```

```javascript
// react to the selection, for example to keep the url in sync
document.getElementById("myMasterDetail")
    .addEventListener(webexpress.webui.Event.SELECT_ITEM_EVENT, function (e) {
        if (e.detail.itemId) {
            history.replaceState(null, "", "?id=" + encodeURIComponent(e.detail.itemId));
        }
    });
```
