![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# TableCtrl

The `TableCtrl` class is a modular, CSS Grid-based table component designed for modern web applications. It focuses on rendering, cell templating, hierarchical data presentation, and providing a flexible architecture for custom renderer integration. All manipulation features (such as column/row reordering, persistence, drag and drop) are deliberately left out for maximum separation of concerns and extensibility.

```
   ┌────────────────────┬──────────────────┬─────┐
   │ [Icon] Column 1   ▼│ [Icon] Column 2  │     │  // Sortable, resizable Headers
   ├────────────────────┼──────────────────┼─────┤
   │ ▼ Row 1            │ Cell 1.2         │ […] │  // Collapsible, Options
   ├────────────────────┼──────────────────┼─────┤
   │   ► Sub-row 1.1    │ Cell 1.1.2       │ […] │
   ├────────────────────┼──────────────────┼─────┤
   │ ► Row 2            │ Cell 2.2         │ […] │
   ├────────────────────┼──────────────────┼─────┤
   │ Footer 1           │ Footer 2         │     │
   └────────────────────┴──────────────────┴─────┘
```

## Features

The following core features define the structure, behavior, and extensibility of the `WebExpress`` table component:

- **Declarative Configuration:** Structure and settings are provided via `data-` attributes and a set of nested `<div>` elements following a semantic hierarchy.
- **CSS Grid Layout:** Tables use CSS Grid instead of HTML `<table>`, allowing flexible, responsive layouts and programmatic control of column widths (`--wx-grid-template`).
- **Hierarchical Trees:** Nested `.wx-table-row` elements represent parent-child relationships; toggles for collapse/expand are automatically inserted.
- **Cell Templating:** Cell content is delegated to the global `TableTemplates` registry, supporting both built-in and user-defined renderers via `<template data-type="...">` nodes or programmatically via JS. Built-in types: `date`, `tag`, `selection`, `combo`, `text`, `numeric`, `move`, `rating`, `editor`. The `editor` template renders an editable column through `SmartEditCtrl` and a read-only one through [ContentCtrl](content.md), so a non-editable cell shows the document rather than the editor markup. Options/choices can be passed via nested children and `data-*`.
- **Sorting:** Column header click cycles between ascending, descending, and none; sort state is visualized and `TABLE_SORT_EVENT` is fired.
- **Resizable Columns:** All columns except the last visible and columns with `resizable=false` have a draggable resize grip. Autosize is supported via double click.
- **Change Highlighting:** When data updates via API or program logic, rows with signature change flash (`wx-change-flash`), and new rows flash with (`wx-new-flash`).
- **Options Column:** If `.wx-table-options` or per-row actions exist, an actions column will automatically be appended.

## Structure & Configuration

The Table component is defined through a declarative markup structure that separates configuration, layout, and behavior. The following overview explains how host attributes and nested elements work together to form a fully customizable table hierarchy.

### Host Attributes

Host attributes define the table’s visual appearance and high‑level behavior, allowing key presentation settings to be configured directly on the root element.
Wenn du möchtest, kann ich es noch technischer, kürzer oder stärker an API‑Dokumentationen anlehnen.

| Attribute            | Description
|----------------------|----------------------------------------
| `data-color`         | Sets table color scheme using the framework theme
| `data-border`        | Adds border style
| `data-striped`       | Enables zebra striping for rows

### Child Elements

Child elements define the internal structure of the table, specifying columns, rows, footers, and optional action menus through a nested hierarchy of semantic `<div>` blocks.

- `.wx-table-columns`: list of `<div>` column configs, with optional `<template>` for custom rendering
- `.wx-table-row`: tree structure via nested rows and cells
- `.wx-table-footer`: one or more summary/total/footer cells
- `.wx-table-options`: global dropdown menu definitions for action column

### Example Markup

The following example illustrates a minimal declarative setup, showing how columns, rows, and optional features are expressed in markup.

```html
<div id="orders-table" class="wx-webui-table">
  <div class="wx-table-columns">
    <div data-id="id" data-label="#"></div>
    <div data-id="customer" data-label="Customer"></div>
    <div data-id="date" data-label="Order Date">
      <template data-type="date" data-format="yyyy-MM-dd"></template>
    </div>
    <div data-id="status" data-label="Status">
      <template data-type="move">
        <div id="open" data-icon="circle">Open</div>
        <div id="shipped" data-icon="truck">Shipped</div>
        <div id="closed" data-icon="check">Closed</div>
      </template>
    </div>
  </div>
  <div class="wx-table-row" id="ord-100">
    <div>100</div>
    <div>Acme Corp</div>
    <div>2023-10-01</div>
    <div>shipped</div>
  </div>
</div>
```

### Events

The following events form the central interaction points of the table control system, enabling flexible handling of sort changes and visibility updates in tree structures.

- `TABLE_SORT_EVENT` (sort changes): `columnId` and `sortDirection` (`asc`, `desc` or `null`). The header and the column dialog announce it alike; the detail still carries `dir` with the same value, which is deprecated and will be dropped - read `sortDirection`.

## Rendering and State

The control renders on `webexpress.webui.StateCtrl`: the header, the rows and the footer are a function of its state - the columns, the rows, the footer, the selected row and the rows the last refresh found changed. The table element is the render root; the host keeps room for what a subclass places beside it (the pager and the progress bar of the REST table).

Rows are keyed by their id, so a sort, an expand or a selection moves and patches the row nodes instead of rebuilding them. The content of a cell - the output of a cell template, which may be a control of its own such as an inline editor - is built into the cell and kept until the cell, its column or what it shows (content, type, link, tree state) changes; a refresh does not rebuild an editor under the hands of the user.

The rows and the columns stay records that the control, its subclasses and the cell templates change in place. After such a change `render()` renders the table again on the next microtask and compares the rows with the last refresh: a changed row flashes `wx-change-flash`, a new one `wx-new-flash`, and the marks are taken away once the animation has played. A selection is rendered before `SELECT_ROW_EVENT` fires, so a listener finds the row marked. A column resize follows the pointer through the grid template (`--wx-grid-template`) alone and renders nothing until it ends; a double click on the resizer sizes the column by its own cells.

The cells of a row are positional: `cells[i]` belongs to `columns[i]`, and so does `footer[i]`. Every reorder of the columns goes through `_applyColumnOrder(orderedIds)`, which moves the columns, the cells of every row and child row and the footer together; a sort and an edit find the cell of a column through the index cache by the column id (`column.index` is only the position the column was declared at). A body cell names its column in `data-column-id`, so a manual edit in it is written back to exactly that model cell - `content` and `text` together, because the text is what the column sorts by. A cell whose template brings an editor of its own (`SmartEditCtrl`) reports through the save event of that editor instead.

A subclass extends the view through hooks (`_renderHeadPrefix`, `_renderHeadSuffix`, `_renderRowPrefix`, `_renderRowSuffix`, `_renderFootPrefix`, `_renderFootSuffix` with `_gridPrefixTracks` and `_gridSuffixTracks` for the cells of no column ahead of and behind the columns, `_headerCellProps`, `_renderActionsHeader`, `_rowClasses`, `_renderRowsList`, `_renderTableExtras`, `_bodyHandlers`, `_afterRenderDom`) and opens the table at the end of its own constructor with `_open()`, because the hooks read what that constructor sets up; the base opens it only when it is constructed itself. The REST table of WebExpress.WebApp goes one step further and renders the whole host, placing the table element among its progress bar and paging info line.

## Programmatic Control

Programmatic control allows you to interact with the table and customize its structure, data, and behavior directly via JavaScript APIs. This is especially useful for building dynamic applications, updating data on the fly, or integrating with other JavaScript modules.

You can access automatically created instances or instantiate a new TableCtrl explicitly.

### Accessing an Automatically Created Instance

If the table has already been initialized (for example, via markup plus auto-detection), you can retrieve its controller and update it as needed:

```js
const tableCtrl = webexpress.webui.Controller.getInstanceByElement(document.getElementById('orders-table'));
tableCtrl.insertRow({ id: 'p99', cells: [{ text: 'New Product' }, { text: '2025-12-01' }] });
```

### Manual Instantiation

Create new table controller instances dynamically, giving you full control over when and how the instance is created and configured.

```js
const div = document.createElement('div');
const ctrl = new webexpress.webui.TableCtrl(div);
ctrl.setColumns([
    { id: 'name', label: 'Name' },
    { id: 'date', label: 'Date', rendererType: 'date', rendererOptions: { format: 'yyyy-MM-dd' } }
]);
ctrl.insertRow({ id: 'p01', cells: [{ text: 'Sample' }, { text: '2025-05-01' }] });
document.body.appendChild(div);
```

# TableReorderableCtrl

`TableReorderableCtrl` extends `TableCtrl` with interactive manipulation abilities and persistence. It enables users to reorder columns and rows, hide columns, manage view state, and move rows within hierarchical structures (trees). It is ideal for UIs where table structure needs to be configurable and persistent across sessions.

```
   ┌─┬──────────────────┬──────────────────┬─────┐
   │ │ [Icon] Column 1 ▼│ [Icon] Column 2  │ [+] │  // Sortable, resizable Headers
   ├─┼──────────────────┼──────────────────┼─────┤
   │≡│ ▼ Row 1          │ Cell 1.2         │ […] │  // Row drag handle, Collapsible, Options
   ├─┼──────────────────┼──────────────────┼─────┤
   │≡│   ► Sub-row 1.1  │ Cell 1.1.2       │ […] │
   ├─┼──────────────────┼──────────────────┼─────┤
   │≡│ ► Row 2          │ Cell 2.2         │ […] │
   ├─┼──────────────────┼──────────────────┼─────┤
   │ │ Footer 1         │ Footer 2         │     │
   └─┴──────────────────┴──────────────────┴─────┘
```

## Extra Features

Beyond its core functionality, the table control component offers a range of advanced features that enhance usability, customization, and interaction.

- **Column Drag & Drop:** CTRL+drag header to move columns; indicator visualizes destination.
- **Column Modal:** Button in rightmost header cell opens a column management modal (reorder, show/hide, resize, sort). The button is there whenever the header is shown; hiding columns in it needs `data-allow-column-remove`. Can use an external DialogPanel via key `table-columns`.
- **Column Visibility Management:** With `data-allow-column-remove`, hide or show columns via modal; modal can search/filter columns.
- **Persistence:** View state (columns, widths, tree collapsed/expanded, sort) is saved in localStorage using `data-persist-key` and restored on initialization.
- **Row Reordering:** Drag handle (`≡`) in leftmost column when `data-movable-row="true"`; support for hierarchical drag and drop including reparenting.
- **Auto-Expand on Row Hover:** When dragging a row, hovering for a second over a collapsed parent with children auto-expands the parent to enable dropping as a child.
- **Action/Options Column:** Automatically handled; supports per-row or global action dropdowns for contextual table actions.
- **All base features:** Hierarchy, cell templates, flexible, responsive rendering.

## Filling the pane

Growing with its rows is right for a table among other blocks on a page. Where the table *is* the view, it is wrong: inside an application shell the page does not scroll, the panes do, and a growing table takes the column header out of view with the page — the reader then scrolls through rows whose columns no longer say what they hold. A table wider than the pane pushes the pane sideways for the same reason. `Fill` takes the height from the host instead — on `ControlTable` as on the REST-backed `ControlDataTable`:

```csharp
new ControlDataTable("items")
{
    Fill = _ => true
};
```

The host is marked `wx-fill`, and a flex column host then drives the table: it grows into the free space and shrinks with it, and the rows scroll under a header that stays, sideways as well as down. Anything the data table keeps beside the table — the pager, the info line, the progress bar — holds its height. In a `WebExpress.WebApp` shell the content panel becomes a flex column on its own as soon as a filling control is on the page, so `Fill` is all a page there has to set; elsewhere, make the host a flex column with `min-height: 0`. A host that hands nothing down leaves the table at `--wx-table-height` (default `70vh`), **never at its content height** — the rows only scroll while the table is bounded. `max-height: 100%` keeps it inside a host that does have an extent.

## Additional Configuration

In addition to its interactive features, the table control component can be further tailored through several optional configuration attributes that extend behavior, persistence, and integration with external UI elements.

| Attribute                    | Description
|------------------------------|------------------------------------
| `data-movable-row="true"`    | enables row drag-and-drop reordering
| `data-persist-key`           | enables view state persistence
| `data-allow-column-remove`   | allows columns to be hidden via modal
| `data-columns-modal-key`     | links modal to external DialogPanel

## Events

In addition to the core event set, the table control component emits several extended events that capture user-driven structural changes—such as reordering columns, toggling visibility, or rearranging rows—while still supporting all base interaction events.

- `COLUMN_REORDER_EVENT`: details about column move
- `COLUMN_VISIBILITY_EVENT`: toggling columns on/off
- `ROW_REORDER_EVENT`: details about row move/reparenting (includes parentId, toIndex)

## Rendering

The reorderable table renders through the hooks of the base table: the grip cell ahead of every row, the column manager in the actions header and the drag listeners of the column headers. A row move is state - the moved row (`wx-dragging`), the row under the pointer (`wx-drag-over`) and the place the drop line stands at - so the rows render their marks and the line from it, and a drop moves the row nodes rather than rebuilding them. Only the ghost and the insertion line of a column drag follow the pointer directly, because they change at pointer rate. A row moved with the arrow keys keeps the focus on its grip.

## Example Markup

The following example demonstrates a minimal yet fully functional table control setup, showcasing how the key attributes and features come together in practical markup.

```html
<div id="orders-table" class="wx-webui-table-reorderable"
     data-persist-key="orders-view"
     data-movable-row="true"
     data-allow-column-remove="true">
  <div class="wx-table-columns">
    <div data-id="id" data-label="#"></div>
    <div data-id="customer" data-label="Customer"></div>
    <div data-id="status" data-label="Status">
      <template data-type="move">
        <div id="open" data-icon="circle">Open</div>
        <div id="shipped" data-icon="truck">Shipped</div>
        <div id="closed" data-icon="check">Closed</div>
      </template>
    </div>
  </div>
  <div class="wx-table-row" id="ord-100">
    <div>100</div><div>Acme Corp</div><div>shipped</div>
  </div>
</div>
```

## Programmatic Control

Programmatic control allows you to interact with the table and customize its structure, data, and behavior directly via JavaScript APIs. This is especially useful for building dynamic applications, updating data on the fly, or integrating with other JavaScript modules.

You can access automatically created instances or instantiate a new TableReorderableCtrl explicitly.

### Accessing Instance

If the table has already been initialized (e.g., via markup combined with automatic controller detection), you can obtain the corresponding controller instance and apply configuration updates programmatically.

```js
const reorderCtrl = webexpress.webui.Controller.getInstanceByElement(document.getElementById('orders-table'));
reorderCtrl.insertRow({ id: 'p01', cells: [{ text: 'Sample' }, { text: '2025-05-01' }] });
```

### Manual Instantiation

Dynamically creating new table controller instances gives you full control over when and how they are initialized and configured.

```js
const div = document.createElement('div');
div.dataset.movableRow = "true";
div.dataset.persistKey = "demo-table";
const reorderCtrl = new webexpress.webui.TableReorderableCtrl(div);
reorderCtrl.setColumns([
    { id: 'name', label: 'Name' },
    { id: 'date', label: 'Date', rendererType: 'date', rendererOptions: { format: 'yyyy-MM-dd' } }
]);
reorderCtrl.insertRow({
    id: 'p01',
    cells: [{ text: 'Sample' }, { text: '2025-05-01' }]
});
document.body.appendChild(div);
```

# Best Practices & Advanced Integration

- Use `TableCtrl` for pure data presentation with custom rendering and trees.
- Use `TableReorderableCtrl` for interactive, user-configurable layout with drag & drop, persistent views, and hierarchical editing.
- Integrate external modal panels via `table-columns` for advanced workflows.