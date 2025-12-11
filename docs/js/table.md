![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# TableCtrl

The `TableCtrl` class is a modular, CSS Grid-based table component designed for modern web applications. It focuses on rendering, cell templating, hierarchical data presentation, and providing a flexible architecture for custom renderer integration. All manipulation features (such as column/row reordering, persistence, drag and drop) are deliberately left out for maximum separation of concerns and extensibility.

```
   ┌────────────────────┬──────────────────┬─────┐
   │ [Icon] Column 1    │ [Icon] Column 2  │ [+] │  // Drag & Drop, Sortable, Resizable Headers
   ├────────────────────┼──────────────────┼─────┤
   │ ▼ Row 1            │ Cell 1.2         │ […] │  // Row drag handle, collapsible, options
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
- **Cell Templating:** Cell content is delegated to the global `TableTemplates` registry, supporting both built-in and user-defined renderers via `<template data-type="...">` nodes or programmatically via JS. Built-in types: `date`, `tag`, `selection`, `combo`, `text`, `numeric`, `move`, `rating`, `editor`. Options/choices can be passed via nested children and `data-*`.
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
| `data-color`         | Sets table color scheme (Bootstrap etc.)
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
        <div id="open" data-icon="far fa-circle">Open</div>
        <div id="shipped" data-icon="fas fa-truck">Shipped</div>
        <div id="closed" data-icon="fas fa-check">Closed</div>
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

- `TABLE_SORT_EVENT` (sort changes)

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

# TableCtrlReorderable

`TableCtrlReorderable` extends `TableCtrl` with interactive manipulation abilities and persistence. It enables users to reorder columns and rows, hide columns, manage view state, and move rows within hierarchical structures (trees). It is ideal for UIs where table structure needs to be configurable and persistent across sessions.

```
   ┌─┬──────────────────┬──────────────────┬─────┐
   │≡│ [Icon] Column 1  │ [Icon] Column 2  │ [+] │  // Drag & Drop, Sortable, Resizable Headers
   ├─┼──────────────────┼──────────────────┼─────┤
   │≡│ ▼ Row 1          │ Cell 1.2         │ […] │  // Row drag handle, collapsible, options
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
- **Column Modal:** Button in rightmost header cell opens a column management modal (reorder, show/hide, resize, sort). Can use an external DialogPanel via key `table-columns`.
- **Column Visibility Management:** Easily hide or show columns via modal; modal can search/filter columns.
- **Persistence:** View state (columns, widths, tree collapsed/expanded, sort) is saved in a cookie using `data-persist-key` and restored on initialization.
- **Row Reordering:** Drag handle (`≡`) in leftmost column when `data-movable-row="true"`; support for hierarchical drag and drop including reparenting.
- **Auto-Expand on Row Hover:** When dragging a row, hovering for >2 seconds over a collapsed parent with children auto-expands the parent to enable dropping as a child.
- **Action/Options Column:** Automatically handled; supports per-row or global action dropdowns for contextual table actions.
- **All base features:** Hierarchy, cell templates, flexible, responsive rendering.

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
        <div id="open" data-icon="far fa-circle">Open</div>
        <div id="shipped" data-icon="fas fa-truck">Shipped</div>
        <div id="closed" data-icon="fas fa-check">Closed</div>
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

You can access automatically created instances or instantiate a new TableCtrlReorderable explicitly.

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
const reorderCtrl = new webexpress.webui.TableCtrlReorderable(div);
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
- Use `TableCtrlReorderable` for interactive, user-configurable layout with drag & drop, persistent views, and hierarchical editing.
- Integrate external modal panels via `table-columns` for advanced workflows.