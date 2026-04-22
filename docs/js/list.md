![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# ListCtrl

The `ListCtrl` is a flexible flat-list component that renders a collection of items inside a `<ul>` element. It supports item selection, drag-and-drop reordering, inline editing, per-item context menus (options), deletable rows, change-flash highlighting, and cookie-based order persistence.

```
   ┌───────────────────────────────────────┐
   │ Title                               ▾ │
   ├───────────────────────────────────────┤
   │ ⠿  Item A                             │
   ┃ ⠿  Item B  ◄── selected (active)      │
   │ ⠿  Item C                             │
   │ ⠿  Item D                            x│
   └───────────────────────────────────────┘
```

## Configuration

The initialization and behaviour of the `ListCtrl` are controlled via `data-` attributes on the host element (`wx-webui-list`) and on each item element (`wx-list-item`).

### Host element attributes

| Attribute             | Description |
|-----------------------|-------------|
| `data-selectable`     | Set to `"true"` to allow the user to select a row by clicking it. Fires `SELECT_ITEM_EVENT` on selection change. |
| `data-movable-item`   | Set to `"true"` to show a drag handle on each row and allow the user to reorder rows via drag-and-drop or keyboard. |
| `data-deletable`      | Set to `"true"` to show a delete button on each row. Fires `MOVE_EVENT` with `action: "delete"` after removal. |
| `data-delete-confirm` | Set to `"true"` to show a browser `confirm()` dialog before deleting a row. |
| `data-delete-label`   | Label text for the delete button. Default: `"Delete"`. |
| `data-delete-title`   | Tooltip text for the delete button. Default: `"Delete item"`. |
| `data-persist-key`    | Cookie key used to persist item order across page loads. Falls back to the element's `id` if omitted. Only effective when all items have an `id`. |

### Item element attributes (`wx-list-item`)

| Attribute                   | Description |
|-----------------------------|-------------|
| `id`                        | Unique identifier for the item. Required for persistence and programmatic selection. |
| `data-color`                | A Bootstrap or custom CSS class added to the `<li>` element (e.g. `"text-danger"`). |
| `data-editable`             | Set to `"true"` to make the item content inline-editable via `SmartEditCtrl`. |
| `data-image`                | URL of an image to show in the item content area. |
| `data-icon`                 | CSS class of a Font Awesome icon to prepend (e.g. `"fa-solid fa-star"`). |
| `data-uri`                  | Link target URI rendered inside the item content. |
| `data-target`               | Link target (`_blank`, `_self`, …). |
| `data-modal`                | Modal selector to open on click. |
| `data-object-id`            | Object identifier forwarded to the `SmartEditCtrl` for inline edit operations. |
| `data-type`                 | Renderer type used to render the item body (e.g. a custom template type). |
| `data-wx-primary-action`    | Primary action type (`"frame"`, `"modal"`, …). |
| `data-wx-primary-target`    | CSS selector of the target element for the primary action. |
| `data-wx-primary-uri`       | URI passed to the primary action target. |
| `data-wx-secondary-action`  | Secondary action type (triggered on double-click). |
| `data-wx-secondary-target`  | CSS selector of the target element for the secondary action. |
| `data-wx-secondary-uri`     | URI passed to the secondary action target. |

### Options sub-element (`wx-list-options`)

Place a child `<div class="wx-list-options">` inside the host element to define a per-item context menu shown in a dropdown. Each child `<div>` inside it becomes one menu entry and supports the same attributes as option items in `ControlDropdown`.

## Functionality

`ListCtrl` parses all `.wx-list-item` children during construction and removes the original `<div>` elements from the DOM, replacing them with a managed `<ul>`. Each item is converted into an internal data object and rendered as a `<li class="wx-list-li">`.

**Selection** — when `data-selectable="true"` the user can click any row. The active row receives the CSS class `active` and `aria-selected="true"`. Only one row may be active at a time; clicking the same row again keeps it selected.

**Drag-and-drop reorder** — when `data-movable-item="true"` a drag handle (☰) is prepended to each `<li>`. Items can be moved by dragging with the mouse or using `Space` to pick up an item, `↑`/`↓` to move the placeholder, and `Enter` / `Escape` to confirm or cancel. An auto-scroll mechanism activates when the pointer approaches the list boundary.

**Delete** — when `data-deletable="true"` a delete button (✕) is appended to each `<li>`. An optional confirmation dialog is shown if `data-delete-confirm="true"` is set. After removal the item array is updated and `render()` is called.

**Change-flash highlight** — after a `render()` call, items whose text content has changed since the previous render receive a brief CSS flash animation (`wx-row-flash`). This can be suppressed for a single cycle with `suppressNextChangeFlash()` or toggled globally with `setChangeFlash(bool)`.

**Persistence** — when `data-persist-key` is set (or when the host element has an `id`), the current item order is serialised as JSON and stored in a cookie (30 days, `SameSite=Lax`) after every reorder. On the next page load the order is restored automatically. Persistence only works when every item carries an `id` attribute.

## Programmatic Control

After initialization, the component can be controlled via its JavaScript instance.

### Accessing an automatically created instance

```javascript
// find the host element in the DOM
const element = document.getElementById("my-list");

// retrieve the controller instance associated with the element
const listCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (listCtrl) {
    // select an item by its id
    listCtrl.selectItem("item-2");

    // insert a new item at the end
    listCtrl.insertItem({ id: "item-new", content: { content: "New entry" } });

    // delete an item by id
    listCtrl.deleteItem("item-1");

    // replace all items at once
    listCtrl.setItems([
        { id: "a", content: { content: "Alpha" } },
        { id: "b", content: { content: "Beta"  } }
    ]);

    // clear the whole list
    listCtrl.clear();
}
```

### Manual instantiation

```javascript
const container = document.getElementById("dynamic-list");

// mark items before instantiation
container.innerHTML = `
    <div class="wx-list-item" id="x1">First</div>
    <div class="wx-list-item" id="x2">Second</div>
`;

const listCtrl = new webexpress.webui.ListCtrl(container);
```

### API reference

| Method | Description |
|---|---|
| `render()` | Re-renders all items and applies change-flash highlighting to modified rows. |
| `clear()` | Removes all items and resets selection state. |
| `setItems(items)` | Replaces the entire item list with a new array of item objects or strings. |
| `insertItem(itemData, index?)` | Inserts a new item at the given index (appends if omitted). Returns the new item object. |
| `deleteItem(itemId)` | Removes the item with the given `id`. Returns `true` if found and removed. |
| `deleteItemAt(index)` | Removes the item at the given zero-based index. Returns `true` if removed. |
| `selectItem(itemId, dispatch?)` | Programmatically selects an item by `id`. Pass `dispatch = false` to suppress the event. |
| `enableChangeFlash()` | Enables the change-flash highlight feature (default: enabled). |
| `disableChangeFlash()` | Disables the change-flash highlight feature. |
| `setChangeFlash(enabled)` | Enables or disables the change-flash highlight feature. |
| `suppressNextChangeFlash()` | Suppresses the change-flash for the next `render()` cycle only. |

## Events

The component dispatches the following events on its host element.

| Event | When | Detail properties |
|---|---|---|
| `webexpress.webui.Event.SELECT_ITEM_EVENT` | A row is selected (or deselected) by click or `selectItem()`. | `{ item, itemId, originalEvent }` |
| `webexpress.webui.Event.ROW_REORDER_EVENT` | The user finishes a drag-and-drop reorder. | `{ newOrder, previousOrder }` |
| `webexpress.webui.Event.MOVE_EVENT` | An item is moved (`action: "move"`) or deleted (`action: "delete"`). | `{ kind, action, itemId, index }` |
| `webexpress.webui.Event.START_INLINE_EDIT_EVENT` | Integration only — forwarded from `SmartEditCtrl`. | — |
| `webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT` | Integration only — forwarded from `SmartEditCtrl`. | — |
| `webexpress.webui.Event.END_INLINE_EDIT_EVENT` | Integration only — forwarded from `SmartEditCtrl`. | — |

```javascript
const el = document.getElementById("my-list");

// react to item selection
el.addEventListener(webexpress.webui.Event.SELECT_ITEM_EVENT, (e) => {
    console.log("Selected item id:", e.detail.itemId);
});

// react to reorder
el.addEventListener(webexpress.webui.Event.ROW_REORDER_EVENT, (e) => {
    const ids = e.detail.newOrder.map(it => it.id);
    console.log("New order:", ids);
});
```

## Use-Case Example (HTML / declarative)

```html
<!--
    A selectable, movable list with options menu and order persistence.
    The cookie key is derived from the element id ("character-list").
-->
<ul id="character-list"
    class="wx-webui-list"
    data-selectable="true"
    data-movable-item="true"
    data-deletable="true"
    data-delete-confirm="true"
    data-delete-label="Remove"
    data-delete-title="Remove this character">

    <!-- global options menu entries (shared by all items) -->
    <div class="wx-list-options">
        <div data-icon="fa-solid fa-pen" data-uri="/edit">Edit</div>
        <div data-icon="fa-solid fa-trash" data-uri="/delete">Delete</div>
    </div>

    <!-- list items -->
    <div class="wx-list-item" id="char-1"
         data-icon="fa-solid fa-user"
         data-wx-primary-action="frame"
         data-wx-primary-target="#detail-frame"
         data-wx-primary-uri="/characters/1">
        Aragorn
    </div>

    <div class="wx-list-item" id="char-2"
         data-icon="fa-solid fa-user"
         data-wx-primary-action="frame"
         data-wx-primary-target="#detail-frame"
         data-wx-primary-uri="/characters/2">
        Legolas
    </div>

    <div class="wx-list-item" id="char-3"
         data-icon="fa-solid fa-user"
         data-wx-primary-action="frame"
         data-wx-primary-target="#detail-frame"
         data-wx-primary-uri="/characters/3">
        Gimli
    </div>
</ul>

<!-- detail frame that receives primary action content -->
<div id="detail-frame" class="wx-webui-frame"></div>
```
