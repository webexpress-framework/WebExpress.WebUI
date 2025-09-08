![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# TableCtrl

The `TableCtrl` is a highly functional and interactive table component that goes far beyond the standard HTML table. It provides a robust foundation for displaying data and is equipped with a variety of end-user features, including client-side sorting, drag-and-drop column reordering, row moving (including hierarchical structures), and resizable columns.

The entire configuration is done declaratively via a structured HTML layout, which is transformed by the component at runtime into a fully functional table. This component also supports state persistence for column order, visibility, widths, and the collapsed state of tree nodes.

```
   ┌─┬──────────────────┬──────────────────┬─────┐
   │ │ [Icon] Column 1  │ [Icon] Column 2  │ [+] │  // Draggable, Sortable, Resizable Headers
   ├─┼──────────────────┼──────────────────┼─────┤
   │≡│ ▼ Row 1          │ Cell 1.2         │ […] │  // Draggable, Collapsible Row with Options
   ├─┼──────────────────┼──────────────────┼─────┤
   │≡│   ► Sub-row 1.1  │ Cell 1.1.2       │ […] │
   ├─┼──────────────────┼──────────────────┼─────┤
   │≡│ ► Row 2          │ Cell 2.2         │ […] │
   ├─┼──────────────────┼──────────────────┼─────┤
   │ │ Footer 1         │ Footer 2         │     │
   └─┴──────────────────┴──────────────────┴─────┘
```

## Declarative Configuration

The structure and appearance of the table are defined by `data-`attributes on the host element and a series of nested `<div>` elements.

**Host Element Attributes:**

| Attribute                  | Description
|----------------------------|-------------------------------------------------------------------------------------------------------------
| `data-color`               | Applies a color scheme class to the table (e.g., for Bootstrap contexts).
| `data-border`              | Applies a border class to the table.
| `data-striped`             | Applies a class for zebra-striping to the table.
| `data-movable-row`         | If set to `"true"`, a column with a drag handle is added to enable row reordering.
| `data-persist-key`         | A unique key used to store the table's state (column order, visibility, widths, and tree state) in a cookie.
| `data-allow-column-remove` | If set to `"true"`, columns can be hidden via the column management dropdown.

**Structure through Child Elements:**

The contents of the table are defined by `<div>` containers with specific classes:

- **`.wx-table-columns`**: Defines the columns of the table. Each direct child `<div>` represents a column. Attributes like `data-icon`, `data-label`, `data-editable`, and `width` can be used for configuration.
- **`.wx-table-row`**: Represents a data row. Nesting `.wx-table-row` elements creates a tree structure. Each child `<div>` within this container that is not a row itself represents a cell. A special container `.wx-table-options` can be added per row to create a dropdown menu with actions.
- **`.wx-table-footer`**: Defines the footer of the table. Each child `<div>` corresponds to a cell in the footer row.
- **`.wx-table-options`**: A global container for options that are displayed in the table header as a dropdown menu for the entire table.

## Architecture and Functionality

The `TableCtrl` is designed as a self-contained component that dynamically generates its DOM and manages its interaction logic internally.

- **Dynamic DOM Construction**: During initialization, the component parses the declared HTML structure. It extracts column, row (hierarchically), footer, and options data. Subsequently, the host element is cleared, and a complete `<table>` structure (`<thead>`, `<tbody>`, `<tfoot>`, `<colgroup>`) is programmatically built and inserted.
- **State-Driven Rendering**: The visual representation of the table is a direct function of the internal state, which is held in the `_columns` and `_rows` arrays. Any change to this data (e.g., through sorting, reordering, or expanding/collapsing) triggers a call to the `render()` method, which redraws the entire table.
- **Interactive Columns**:
    - **Sorting**: Clicking on a column header sorts the table based on the text content of that column. The sort direction (ascending/descending/none) is toggled.
    - **Reordering**: By holding down the `Ctrl` key and dragging a column header, the order of the columns can be changed. A visual indicator shows the drop position.
    - **Resizing**: Each column header contains a drag handle on its right edge for interactive width adjustment.
    - **Visibility and Management**: A dropdown menu in the header allows users to show/hide columns and reorder them via drag-and-drop.
- **Hierarchical and Movable Rows**:
    - **Tree Structure**: If rows are nested in the declarative HTML, the component automatically renders a tree table with expand/collapse toggles.
    - **Drag-and-Drop**: If `data-movable-row` is enabled, a drag handle is prepended to each row. Users can reorder rows and change their parentage by dragging them.
- **State Persistence**: If a `data-persist-key` is provided, the component automatically saves the column configuration (order, visibility, width), sort state, and the collapsed state of tree nodes to a browser cookie. This state is restored upon re-initialization.
- **Inline Editing**: The table integrates with `SmartEditCtrl` and `SmartViewCtrl`. By marking a column as `data-editable="true"`, its cells become editable fields, with events for starting and saving edits.

## Programmatic Control

After initialization, the table can be controlled via its JavaScript instance. This allows for dynamic data manipulation beyond the initial declarative setup.

### Accessing an Automatically Created Instance

To access an instance created by adding the `wx-webui-table` class to an HTML element, the `getInstanceByElement` method is used.

```javascript
// find the host element in the DOM
const element = document.getElementById('my-table');

// retrieve the controller instance associated with the element
const tableCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (tableCtrl) {
    // expand all nodes in the tree
    tableCtrl.expandAll();
}
```

### Manual Instantiation and Data Manipulation
A `TableCtrl` instance can be created programmatically, which is useful for dynamically generated tables. Data can be added, removed, or modified at any time, followed by a call to `render()` to update the view.

```JavaScript
// find the container element for the dynamic table
const container = document.getElementById('dynamic-table-container');

// create a new instance of TableCtrl manually
const dynamicTableCtrl = new webexpress.webui.TableCtrl(container);

// set columns and rows programmatically
dynamicTableCtrl.setColumns([
    { id: 'id', label: 'ID', width: 50 },
    { id: 'product', label: 'Product Name' }
]);

dynamicTableCtrl.insertRow({
    id: 'p1',
    cells: [{ text: '1' }, { text: 'Laptop' }]
});

dynamicTableCtrl.insertRow({
    id: 'p2',
    cells: [{ text: '2' }, { text: 'Mouse' }]
});

// manually trigger a re-render to display the data
dynamicTableCtrl.render();
```

## Events

The component communicates user interactions and state changes through a comprehensive set of events, typically dispatched via `webexpress.webui.Event`.

- **`TABLE_SORT_EVENT`**: Fired when a column is sorted.
- **`COLUMN_REORDER_EVENT`**, **`COLUMN_VISIBILITY_EVENT`**: Fired when columns are moved or their visibility is changed.
- **`ROW_REORDER_EVENT`**, **`MOVE_EVENT`**: Fired when a row is moved within the table, providing details about the source and destination.
- **`CHANGE_VISIBILITY_EVENT`**: Fired when tree nodes are expanded or collapsed.
- **`START_INLINE_EDIT_EVENT`**, **`SAVE_INLINE_EDIT_EVENT`**: Fired during the inline editing lifecycle.

## Use Case Example

```html
<!--
    Host element for a hierarchical, persistent table.
    Row movement is enabled, and the state is saved under the key 'user-management-table'.
-->
<div id="user-table"
     class="wx-webui-table"
     data-movable-row="true"
     data-persist-key="user-management-table"
     data-striped="table-striped">

    <!-- Column Definitions -->
    <div class="wx-table-columns">
        <div data-id="name" data-label="Name" data-icon="fas fa-user"></div>
        <div data-id="email" data-label="Email" data-icon="fas fa-envelope" data-editable="true" width="250"></div>
        <div data-id="status" data-label="Status" data-icon="fas fa-check-circle"></div>
    </div>

    <!-- Hierarchical Row Data -->
    <div class="wx-table-row" id="group-admin" data-expanded="true">
        <div>Administrators</div>
        <div></div>
        <div></div>
        <!-- Nested Row -->
        <div class="wx-table-row" id="user-1">
            <div>Rene Schwarzer</div>
            <div>rene.schwarzer@example.com</div>
            <div>Active</div>
            <!-- Per-row options -->
            <div class="wx-table-options">
                <div data-uri="/users/1/edit">Edit</div>
                <div data-modal="#delete-confirm-1">Delete</div>
            </div>
        </div>
    </div>
    <div class="wx-table-row" id="group-user" data-expanded="false">
        <div>Users</div>
        <div></div>
        <div></div>
        <!-- Nested Row -->
        <div class="wx-table-row" id="user-2">
            <div>Jane Doe</div>
            <div>jane.doe@example.com</div>
            <div>Inactive</div>
            <div class="wx-table-options">
                <div data-uri="/users/2/edit">Edit</div>
            </div>
        </div>
    </div>

    <!-- Footer Definition -->
    <div class="wx-table-footer">
        <div>Total: 2 Groups</div>
        <div></div>
        <div></div>
    </div>
</div>
```