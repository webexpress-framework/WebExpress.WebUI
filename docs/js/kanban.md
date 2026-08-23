# KanbanCtrl

`KanbanCtrl` (`wx-webui-kanban`) renders a column-based board for visual workflow management using a dashboard-style CSS grid. Each column represents a process stage, each card one movable work item. Optional swimlanes group related items as horizontal, expandable lanes across all columns. Cards move via pixel-perfect drag & drop. The board carries a `…` menu (settings with a WQL filter, add column, add swimlane); each column carries a `…` menu (rename, size, color, delete) and can be reordered by its ⠿ grip; each swimlane carries a `…` menu (rename, delete).

```
   ┌───────────────┬───────────────┬───────────────┐
   │ To Do         │ In Progress   │ Done          │ ← column headers
   ├───────────────┼───────────────┼───────────────┤
   │ ┌───────────┐ │ ┌───────────┐ │               │
   │ │ Title (GT)│ │ │ Title (EM)│ │               │ ← cards (assignee avatar)
   │ │ text …    │ │ │ text …    │ │               │
   │ │ [P1] [8*] │ │ └───────────┘ │               │ ← optional footer chips
   │ └───────────┘ │               │               │
   └───────────────┴───────────────┴───────────────┘
```

## Configuration

The board is parsed from the static DOM. The host carries the column and board flags, the cards are child nodes.

| Attribute               | Description                                                                              | Example
|-------------------------|------------------------------------------------------------------------------------------|---------------------------
| `data-columns`          | Comma-separated column ids (alternative to `.wx-column` child nodes).                    | `data-columns="todo,done"`
| `data-column-titles`    | Comma-separated column labels.                                                            | `data-column-titles="To Do,Done"`
| `data-swimlanes`        | Comma-separated swimlane ids (alternative to `.wx-swimlane` child nodes).                 | `data-swimlanes="team-a,team-b"`
| `data-editable-column`  | When `"true"`, the column `…` menu offers **Rename**, **Size** and **Color**.             | `data-editable-column="true"`
| `data-movable-column`   | When `"true"`, columns can be reordered by dragging the ⠿ grip.                           | `data-movable-column="true"`
| `data-deletable-column` | When `"true"`, the column `…` menu offers **Delete** (removes the column and its cards).  | `data-deletable-column="true"`
| `data-addable-column`   | When `"true"`, the board `…` menu offers **New column**.                                  | `data-addable-column="true"`
| `data-addable-swimlane` | When `"true"`, the board `…` menu offers **New swimlane**.                                | `data-addable-swimlane="true"`
| `data-editable-swimlane`| When `"true"`, the swimlane `…` menu offers **Rename** and **Color**.                     | `data-editable-swimlane="true"`
| `data-deletable-swimlane`| When `"true"`, the swimlane `…` menu offers **Delete** (removes the lane and its cards). | `data-deletable-swimlane="true"`
| `data-movable-swimlane` | When `"true"`, the swimlane `…` menu offers **Move up** / **Move down**.                  | `data-movable-swimlane="true"`
| `data-configurable-board`| When `"true"`, the board `…` menu offers **Settings** (the WQL filter).                  | `data-configurable-board="true"`
| `data-configurable-swimlane`| When `"true"`, the swimlane `…` menu offers **Settings** (the swimlane WQL filter).   | `data-configurable-swimlane="true"`
| `data-filter`           | The initial WQL filter shown in the settings dialog (REST boards seed it from the server).| `data-filter="priority = 'high'"`

A column, a swimlane and a card each accept an optional `data-badge` (with `data-badge-color` for a system color class or `data-badge-style` for an inline color) that renders a small trailing badge in the header, mirroring the tab header badge.

### Card fields

A card is a child node carrying the class `wx-kanban-card` (or a `data-card-id`).

| Attribute                | Description
|--------------------------|----------------------------------------------------------------------
| `data-card-id`           | Unique card id.
| `data-column-id`         | Id of the column the card sits in.
| `data-swimlane-id`       | Id of the swimlane (when swimlanes are configured).
| `data-label`             | Card title.
| `data-html`              | Card body (HTML).
| `data-color-css`         | Color hint for the top border (`success`, `warning`, `danger`, `info`).
| `data-assignee-id`       | Id of the assigned person; without an assignee no avatar is rendered.
| `data-assignee-name`     | Display name, used as the avatar tooltip.
| `data-assignee-initials` | Short text inside the avatar; derived from the name when omitted.
| `data-assignee-color`    | CSS color used as the avatar background.
| `data-assignee-image`    | Uri of the avatar image; when present, it replaces the initials badge.
| `data-badge`             | Optional trailing badge in the card header (e.g. a ticket number).
| `data-badge-color`       | CSS class of a system badge color (e.g. `text-bg-primary`).
| `data-badge-style`       | Inline style of a user-defined badge color (e.g. `background:#ff8800;`).
| `data-footer`            | JSON array of chips, see below.

### Footer

The optional footer carries small, application-defined facts — for example the priority or the story points — so the card layout stays generic while every application decides which information matters on its board. Each entry renders as one chip.

| Field        | Description
|--------------|-----------------------------------------------------------------------
| `label`      | Text shown inside the chip.
| `icon`       | Icon of the chip, either a CSS class (`star`) or an image uri.
| `colorCss`   | CSS class of a system color (e.g. `text-bg-danger`).
| `colorStyle` | Inline style declaration of a user-defined color (e.g. `background:#ff8800;`).
| `title`      | Tooltip explaining the chip (e.g. "Story points").

## Column reordering feedback

While a column is dragged by its grip, the header under the pointer shows an insertion indicator on the edge where the column would land (`wx-board-col-drop-before` / `wx-board-col-drop-after`), and the dragged header dims (`wx-board-col-dragging`). After the drop, the header at the new position briefly flashes (`wx-board-col-moved`); the flash respects `prefers-reduced-motion`.

## Menus

Three `…` menus mirror the dashboard control; the per-column and per-swimlane triggers reveal on hover, while the board menu (top right) stays visible.

- **Board `…` menu** — **Settings** (`data-configurable-board`, opens the board settings dialog with the WQL filter), **New column** (`data-addable-column`) and **New swimlane** (`data-addable-swimlane`). Adding the first swimlane moves the existing (lane-less) cards into it so they stay visible.
- **Column `…` menu** — **Rename** (inline edit), **Size** (drill-down: Auto / 25 % / 33 % / 50 % / 66 % / 75 %), **Color** (drill-down palette + None), **Delete**. Rename, size and color require `data-editable-column`; delete requires `data-deletable-column`.
- **Swimlane `…` menu** — **Rename** and **Color** (drill-down palette + None, both behind `data-editable-swimlane`), **Settings** (`data-configurable-swimlane`, the per-swimlane WQL filter), **Move up** / **Move down** (`data-movable-swimlane`) and **Delete** (`data-deletable-swimlane`, removes the lane and its cards). Only the direction with room is offered, so the first and last lanes never carry a dead move entry.

Each change re-renders the board and dispatches a `CHANGE_VALUE_EVENT` (see below) so the REST layer can persist it. The board scroller clips its overflow, so an open menu is pinned to the viewport with a fixed position to escape the clip.

## Settings (WQL filter)

The board settings dialog and the per-swimlane settings dialog each carry a single **Filter (WQL)** field. When the WebApp layer is loaded, the field is the full `DataWqlPrompt` control (live WQL syntax highlighting and a themed clear button); it degrades to a plain textarea otherwise. The value is a [WQL](index.md) expression that restricts which cards the board (or lane) loads. On save the filter is dispatched (`action: "settings"` for the board, carried per-swimlane for a lane) and, on a REST board, sent as the `wql` query parameter on the next load so the server narrows the card query. The current filter is echoed back in the load response (`filter` on the board, `filter` per swimlane) so the dialog re-seeds it.

## Badges

A column, a swimlane and a card each render an optional trailing badge in their header (`wx-board-col-badge`, `wx-kanban-swimlane-badge`, `wx-kanban-card-badge`) — for example a card count on a lane or a ticket number on a card. The badge text comes from `badge`; its color from `badgeColor` (a system color css class) or `badgeStyle` (an inline user color), exactly like the tab header badge. On the server the typed `BadgeColor` (`PropertyColorBackgroundBadge`) collapses into `badgeColor` / `badgeStyle` at serialization time.

## C# authoring

```csharp
var kanban = new ControlKanban("board")
    .Add(
        new ControlKanbanColumn("todo", "To Do", "33%"),
        new ControlKanbanColumn("done", "Done", "*"))
    .Add(
        new ControlKanbanCard("task1")
        {
            Title = _ => "Write Documentation",
            ColumnId = _ => "todo",
            AssigneeId = _ => "guybrush",
            AssigneeName = _ => "Guybrush Threepwood",
            AssigneeInitials = _ => "GT",
            AssigneeColor = _ => "#1d4ed8",
            // an ImageIcon replaces the initials badge with a picture
            AssigneeImage = _ => new ImageIcon(new UriEndpoint("/assets/img/guybrush.png"))
        }.Add(
            new ControlKanbanCardChip { Label = _ => "P1", Color = _ => new PropertyColorBackgroundBadge(TypeColorBackgroundBadge.Danger), Title = _ => "Priority" },
            new ControlKanbanCardChip { Label = _ => "8", Icon = _ => new IconStar(), Title = _ => "Story points" }));
```

## Filling the pane

Growing with its longest column is right for a board among other blocks on a page. Where the board *is* the view, it is wrong: inside an application shell the page does not scroll, the panes do, and a growing board takes its column headers out of view with the page - the very thing the board is read by. `Fill` takes the height from the host instead - on `ControlKanban` as on the REST-backed `ControlDataKanban`:

```csharp
new ControlKanban("board")
{
    Fill = _ => true
};
```

The host is marked `wx-fill`, and a flex column host then drives the board: it grows into the free space and shrinks with it, and the cards scroll under headers that stay. In a `WebExpress.WebApp` shell the content panel becomes one on its own as soon as a filling control is on the page, so `Fill` is all a page there has to set; elsewhere, make the host a flex column with `min-height: 0`. A host that hands nothing down leaves the board at `--wx-kanban-height` (default `70vh`), **never at its content height** - the board is its own scrollport, and a scrollport only exists while its container is bounded. `max-height: 100%` keeps the board inside a host that does have an extent.

## REST boards

`ControlDataKanban` (WebExpress.WebApp, `wx-webapp-kanban`) loads the same board from a REST endpoint and persists card moves, column, swimlane and settings changes. The load response mirrors the DOM fields and echoes the active filter:

```json
{
    "filter":    "priority = 'high'",
    "columns":   [{ "id": "todo", "label": "To Do", "size": "1fr", "color": "#0d6efd", "badge": "3", "badgeColor": "text-bg-secondary" }],
    "swimlanes": [{ "id": "melee", "label": "Mêlée Island", "expanded": true, "filter": "team = 'a'", "color": "#198754", "badge": "3", "badgeColor": "text-bg-secondary" }],
    "items": [{
        "id": "k1", "columnId": "todo", "swimlaneId": "melee",
        "label": "Steal the Idol", "html": "…", "colorCss": "border-danger",
        "assigneeId": "elaine", "assigneeName": "Elaine Marley",
        "assigneeInitials": "EM", "assigneeColor": "#7c3aed", "assigneeImage": null,
        "badge": "#42", "badgeColor": "text-bg-primary",
        "footer": [
            { "label": "P1", "colorCss": "text-bg-danger", "title": "Priority" },
            { "label": "8", "icon": "star", "title": "Story points" }
        ]
    }]
}
```

The control declares its capabilities through flags; each is emitted only when set, so a read-only board offers no affordances:

```csharp
new ControlDataKanban("board")
{
    EditableColumn      = _ => true,
    MovableColumn       = _ => true,
    DeletableColumn     = _ => true,
    AddableColumn       = _ => true,
    AddableSwimlane     = _ => true,
    EditableSwimlane    = _ => true,
    DeletableSwimlane   = _ => true,
    MovableSwimlane     = _ => true,
    ConfigurableBoard   = _ => true,
    ConfigurableSwimlane = _ => true
}
    .DataService<MyKanbanApi>(svc => svc.Method(HttpMethod.Get).UpdateMethod(HttpMethod.Put));
```

On the server, the endpoint extends `RestApiKanban<TIndexItem>` and returns `RestApiKanbanCard` records; the footer chips are `RestApiKanbanCardChip` objects whose typed `Color` collapses into `colorCss` / `colorStyle` at serialization time. A column, a swimlane and a card each carry an optional `Badge` plus a typed `BadgeColor` that collapses into `badgeColor` / `badgeStyle` the same way. Every structural change is a `PUT` tagged with an `action`:

| `action`     | Body                                                              | Hook                                    |
|--------------|-------------------------------------------------------------------|-----------------------------------------|
| `"columns"`  | `{ "columns": [{ id, title, size, color }] }`                     | `UpdtaeColumns(layout, request)`        |
| `"swimlanes"`| `{ "swimlanes": [{ id, title, filter, color }] }`                 | `UpdateSwimlanes(layout, request)`      |
| `"settings"` | `{ "filter": "…" }`                                               | `UpdateSettings(layout, request)`       |

The full ordered list is sent for columns and swimlanes: an absent entry is deleted, an unknown id is created, and the swimlane order defines the new lane order (Move up / Move down). The `settings` filter narrows the card query on the next load; override `ApplyWql(wql, query, request)` to apply it and `RetrieveFilter(wql, request)` to seed a persisted filter across full page reloads. A card move is a `PUT` without an `action` and carries `{ cardId, columnId, swimlaneId }`.

## Events

- **`webexpress.webui.Event.MOVE_EVENT`** — fired when a card is moved. `event.detail` carries `{ id, cardId, columnId, swimlaneId, index }`.
- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`** — fired for a structural change, tagged by `action`:
  - `"columns"` — the column layout changed (rename, resize, recolor, reorder, delete, add), carrying the new `columns` list.
  - `"swimlanes"` — the swimlane layout changed (rename, reorder, delete, add), carrying the new `swimlanes` list.
  - `"settings"` — the board settings changed, carrying the new `filter`.
