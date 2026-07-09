# KanbanCtrl

`KanbanCtrl` (`wx-webui-kanban`) renders a column-based board for visual workflow management using a dashboard-style CSS grid. Each column represents a process stage, each card one movable work item. Optional swimlanes group related items as horizontal, expandable lanes across all columns. Cards move via pixel-perfect drag & drop; column headers can optionally be renamed, reordered and deleted.

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
| `data-editable-column`  | When `"true"`, column titles can be renamed inline (pencil / double-click).               | `data-editable-column="true"`
| `data-movable-column`   | When `"true"`, columns can be reordered by dragging the ⠿ grip.                           | `data-movable-column="true"`
| `data-deletable-column` | When `"true"`, columns (and their cards) can be deleted.                                  | `data-deletable-column="true"`

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
| `data-footer`            | JSON array of chips, see below.

### Footer

The optional footer carries small, application-defined facts — for example the priority or the story points — so the card layout stays generic while every application decides which information matters on its board. Each entry renders as one chip.

| Field        | Description
|--------------|-----------------------------------------------------------------------
| `label`      | Text shown inside the chip.
| `icon`       | Icon of the chip, either a CSS class (`fas fa-star`) or an image uri.
| `colorCss`   | CSS class of a system color (e.g. `text-bg-danger`).
| `colorStyle` | Inline style declaration of a user-defined color (e.g. `background:#ff8800;`).
| `title`      | Tooltip explaining the chip (e.g. "Story points").

## Column reordering feedback

While a column is dragged by its grip, the header under the pointer shows an insertion indicator on the edge where the column would land (`wx-board-col-drop-before` / `wx-board-col-drop-after`), and the dragged header dims (`wx-board-col-dragging`). After the drop, the header at the new position briefly flashes (`wx-board-col-moved`); the flash respects `prefers-reduced-motion`.

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

## REST boards

`ControlDataKanban` (WebExpress.WebApp, `wx-webapp-kanban`) loads the same board from a REST endpoint and persists card moves and column changes. The card payload mirrors the DOM fields:

```json
{
    "columns":   [{ "id": "todo", "label": "To Do" }],
    "swimlanes": [{ "id": "melee", "label": "Mêlée Island", "expanded": true }],
    "items": [{
        "id": "k1", "columnId": "todo", "swimlaneId": "melee",
        "label": "Steal the Idol", "html": "…", "colorCss": "border-danger",
        "assigneeId": "elaine", "assigneeName": "Elaine Marley",
        "assigneeInitials": "EM", "assigneeColor": "#7c3aed", "assigneeImage": null,
        "footer": [
            { "label": "P1", "colorCss": "text-bg-danger", "title": "Priority" },
            { "label": "8", "icon": "fas fa-star", "title": "Story points" }
        ]
    }]
}
```

On the server, the endpoint extends `RestApiKanban<TIndexItem>` and returns `RestApiKanbanCard` records; the footer chips are `RestApiKanbanCardChip` objects whose typed `Color` collapses into `colorCss` / `colorStyle` at serialization time.

## Events

- **`webexpress.webui.Event.MOVE_EVENT`** — fired when a card is moved. `event.detail` carries `{ id, cardId, columnId, swimlaneId, index }`.
- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`** — fired with `action: "columns"` when the column layout changes (rename, reorder, delete), carrying the new column list.
