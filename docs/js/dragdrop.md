![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# DragDrop

The `DragDrop` component (`webexpress.webui.DragDrop`) is one drag-and-drop protocol for the data controls. A row of a table, a tile or a list item can be dropped onto a tree node or onto another row, and every target looks and answers alike. The protocol works by delegation on the document, so sources and targets that a control renders later take part without registering. It never changes the page itself; the control that owns the data moves it. Only drags the protocol started are handled, so the editor, the upload and the own reordering of the static tree, the kanban board and a movable table keep their own drag and drop.

```
   ┌──────────────┐           ┌───────────────────┐
   │ row  (drag)  │ ────────► │ ▸ node  (drop)    │
   └──────────────┘           └───────────────────┘
        sources                  target, position
```

## Declarative Configuration

Sources and targets are marked with `data-` attributes. A source element also needs `draggable="true"`.

| Attribute               | Description                                                                                           | Example
|-------------------------|-------------------------------------------------------------------------------------------------------|---------------------------------
| `data-wx-drag`          | The id the dragged element stands for.                                                                | `data-wx-drag="issue-42"`
| `data-wx-drag-kind`     | The kind of the item, by which a target accepts or refuses it.                                        | `data-wx-drag-kind="issue"`
| `data-wx-drag-scope`    | On an ancestor: a drag that starts on a chosen source (`aria-selected="true"`) carries every chosen source of the scope. | `data-wx-drag-scope`
| `data-wx-drop`          | The id of the target.                                                                                 | `data-wx-drop="backlog"`
| `data-wx-drop-kind`     | The kind of the target.                                                                               | `data-wx-drop-kind="folder"`
| `data-wx-drop-accept`   | The source kinds the target takes, separated by spaces; any kind when omitted.                        | `data-wx-drop-accept="issue"`
| `data-wx-drop-position` | `edges` lets a source of the target's own kind land above or below it as well, which reorders siblings. | `data-wx-drop-position="edges"`
| `data-wx-drop-into`     | `false` leaves only the edges, for a target that takes no children. `other` leaves its own kind the edges and takes sources of another kind into itself, as a card that is reordered among cards and takes a file onto itself. | `data-wx-drop-into="other"`

On the server, `ControlDataTable`, `ControlDataTile` and `ControlDataList` set these attributes from `DragKind` and `DropKind`, and `ControlDataTree` makes its nodes targets and, when it is movable, sources.

## Functionality and Behavior

While a drag is over a target, the protocol decides where the items land and asks the target whether it takes them. A target of the sources' own kind with edges takes items above, into or below itself; any other target takes them into itself. A source is never dropped onto itself. The marks follow the shared drop design: where an item lands inside a target, the target shows the dashed tinted area (`.wx-drag-over`); where it lands between two others, the edge shows a line (`data-wx-drop-at="above"` or `"below"`); a refused target shows the red area (`.wx-drag-blocked`), and the dragged items are faded (`.wx-dragging`). The colors come from the `--wx-drop-*` tokens only.

## Programmatic Control

The protocol installs itself when the script loads. A control marks its elements through two helpers.

### Marking Elements Rendered as Virtual Nodes

A control that renders virtual nodes takes the attributes from `attributes(id, options)` and passes them to its element.

```javascript
// mark a row as a source of the kind issue and as a target of the kind folder
const props = Object.assign({ key: row.id }, webexpress.webui.DragDrop.attributes(row.id, {
    dragKind: 'issue',
    dropKind: 'folder'
}));
```

### Marking Elements Built by Hand

A control that builds its elements itself sets the attributes with `decorate(element, id, options)`.

```javascript
// mark a list item as a source
const li = document.createElement('li');
webexpress.webui.DragDrop.decorate(li, item.id, { dragKind: 'issue' });
```

The drag in progress is available as `webexpress.webui.DragDrop.current`, with its `sources` and its `origin`, until its drop has been announced.

## Events

The protocol dispatches standardized events on the target; both bubble.

- **`webexpress.webui.Event.DROP_CHECK_EVENT`**: Fired while a drag is over a target; cancelable. The `detail` object contains `sources`, `origin`, `target` and `effect`. A listener that calls `preventDefault()` refuses the target, which is then drawn as refused.
- **`webexpress.webui.Event.DROP_EVENT`**: Fired when the items are dropped on a target that accepted them. The `detail` object contains `sources` (`{ id, kind }` entries), `origin` (the element the drag started on), `target` (`{ id, kind, position, element }`, with the position `into`, `above` or `below`) and `effect` (`copy` when Ctrl or Option is held, `move` otherwise). A control needs the origin to tell its own items from those of another control that carry the same ids.

## Use Case Examples

Rows of a table that are dragged onto the folders of a tree, where only open folders take issues:

```html
<div id="issues" class="wx-webapp-table" data-drag-kind="issue"></div>
<div id="folders" class="wx-webapp-tree"></div>

<script>
    document.addEventListener(webexpress.webui.Event.DROP_CHECK_EVENT, (e) => {
        if (e.detail.target.element.dataset.closed === 'true') {
            e.preventDefault();
        }
    });

    document.addEventListener(webexpress.webui.Event.DROP_EVENT, (e) => {
        const { sources, target } = e.detail;
        console.log(sources.map((x) => x.id), 'to', target.id);
    });
</script>
```
