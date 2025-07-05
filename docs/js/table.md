![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# TableCtrl

The `TableCtrl` is a highly functional and interactive table component that goes far beyond the standard HTML table. It provides a robust foundation for displaying data and is equipped with a variety of end-user features, including client-side sorting, drag-and-drop column reordering, row moving, and resizable columns.

The entire configuration is done declaratively via a structured HTML layout, which is transformed by the component at runtime into a fully functional table.

```
   ┌─┬──────────────────┬──────────────────┬─────┐
   │ │ [Icon] Column 1  │ [Icon] Column 2  │ […] │  // Draggable, Sortable, Resizable Headers
   ├─┼──────────────────┼──────────────────┼─────┤
   │≡│ Cell 1.1         │ Cell 1.2         │ […] │  // Draggable Row with Options
   ├─┼──────────────────┼──────────────────┼─────┤
   │≡│ Cell 2.1         │ Cell 2.2         │ […] │
   ├─┼──────────────────┼──────────────────┼─────┤
   │ │ Footer 1         │ Footer 2         │     │
   └─┴──────────────────┴──────────────────┴─────┘
```

## Declarative Configuration

The structure and appearance of the table are defined by `data-`attributes on the host element and a series of nested `<div>` elements.

**Host Element Attributes:**

| Attribute | Description |
| :--- | :--- |
| `data-color` | Applies a color scheme class to the table (e.g., for Bootstrap contexts). |
| `data-border` | Applies a border class to the table. |
| `data-striped` | Applies a class for zebra-striping to the table. |
| `data-movable-row`| If set to `"true"`, a column with a drag handle is added to enable row reordering. |

**Structure through Child Elements:**

The contents of the table are defined by `<div>` containers with specific classes:

- **`.wx-table-columns`**: Defines the columns of the table. Each direct child `<div>` represents a column. Attributes like `data-icon`, `data-color`, and `width` can be used for configuration.
- **`.wx-table-row`**: Represents a data row. Each child `<div>` within this container represents a cell. A special container `.wx-table-options` can be added per row to create a dropdown menu with actions for that row.
- **`.wx-table-footer`**: Defines the footer of the table. Each child `<div>` corresponds to a cell in the footer row.
- **`.wx-table-options`**: A global container for options that are displayed in the table header as a dropdown menu for the entire table.

## Architecture and Functionality

The `TableCtrl` is designed as a self-contained component that dynamically generates its DOM and manages its interaction logic internally.

- **Dynamic DOM Construction**: During initialization, the component parses the declared HTML structure. It extracts column, row, footer, and options data. Subsequently, the host element is cleared, and a complete `<table>` structure (`<thead>`, `<tbody>`, `<tfoot>`, `<colgroup>`) is programmatically built and inserted.
- **State-Driven Rendering**: The visual representation of the table is a direct function of the internal state, which is held in the `_columns` and `_rows` arrays. Any change to this data (e.g., through sorting or column reordering) triggers a call to the `render()` method, which redraws the affected parts of the table.
- **Interactive Columns**:
    - **Sorting**: Clicking on a column header sorts the table based on the text content of that column. The sort direction (ascending/descending) is toggled and visually indicated by a class. This fires the `TABLE_SORT_EVENT`.
    - **Column Reordering**: By holding down the `Ctrl` key and dragging a column header, the order of the columns can be changed. A visual indicator shows the drop position. This action reorders the column definitions (`_columns`) and the cell data in each row (`_rows`) and fires the `COLUMN_REORDER_EVENT`.
    - **Column Resizing**: Each column header contains an invisible drag handle on its right edge. By dragging this handle, the width of the column can be interactively adjusted.
- **Movable Rows**: If `data-movable-row` is enabled, a drag handle is prepended to each row. Users can reorder rows via drag-and-drop, which updates the order of the elements in the `_rows` array.
- **Options Menus**: The component can render both a global options menu in the table header and specific options menus for each individual row. These are displayed as dropdown buttons with a gear icon.

## Programmatic Control

After initialization, the table can be controlled via its JavaScript instance. A distinction is made between accessing an automatically created instance and creating one manually.

### Accessing an Automatically Created Instance

To access an instance created by adding the `wx-webui-table` class to an HTML element, the `getInstanceByElement` method is used. Once a reference to the controller instance is obtained, methods such as `clear()` to empty the table or `orderRows()` for programmatic sorting can be called.

```javascript
// find the host element in the DOM
const element = document.getElementById('my-table');

// retrieve the controller instance associated with the element
const tableCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (tableCtrl) {
    // clear all content from the table
    tableCtrl.clear();

    // programmatically sort the table by a specific column object
    const columnToSortBy = tableCtrl._columns[1]; // Example: sort by the second column
    columnToSortBy.sort = 'asc';
    tableCtrl.orderRows(columnToSortBy);
}
```

### Manual Instantiation
Alternatively, a TableCtrl instance can be created entirely programmatically. This is done by creating a new instance of the webexpress.webui.TableCtrl class and binding it to a container element. The data for columns and rows are then assigned via the columns and rows properties. A final call to the render() method is required to draw the table with the provided data.

```JavaScript
// find the container element for the dynamic table
const container = document.getElementById('dynamic-table-container');

// create a new instance of TableCtrl manually
const dynamicTableCtrl = new webexpress.webui.TableCtrl(container);

// set the properties programmatically
dynamicTableCtrl.columns = [
    { label: 'ID', width: '50px' },
    { label: 'Product Name' }
];

dynamicTableCtrl.rows = [
    { id: 'p1', cells: ['1', 'Laptop'] },
    { id: 'p2', cells: ['2', 'Mouse'] }
];

// manually trigger a re-render to display the data
dynamicTableCtrl.render();
```

## Event Handling

The component communicates important user interactions via two specific events.

- **`webexpress.webui.Event.TABLE_SORT_EVENT`**: Fired when the user clicks on a column header to sort the table. The `detail` object contains information about the column and the sort direction.
- **`webexpress.webui.Event.COLUMN_REORDER_EVENT`**: Fired after a column has been successfully moved to a new position. The `detail` object contains the source and target indices, as well as the updated array of column definitions.

## Use Case Example

```html
<!--
    Host element for the table control.
    Row movement is enabled, and the table has a striped appearance.
-->
<div id="user-table"
     class="wx-webui-table"
     data-movable-row="true"
     data-striped="table-striped">

    <!-- Column Definitions -->
    <div class="wx-table-columns">
        <div data-icon="fas fa-user">Name</div>
        <div data-icon="fas fa-envelope" width="200">Email</div>
        <div data-icon="fas fa-check-circle">Status</div>
    </div>

    <!-- Row Data -->
    <div class="wx-table-row">
        <div>Rene Schwarzer</div>
        <div>rene.schwarzer@example.com</div>
        <div>Active</div>
        <!-- Per-row options -->
        <div class="wx-table-options">
            <div data-uri="/users/1/edit">Edit</div>
            <div data-modal="#delete-confirm">Delete</div>
        </div>
    </div>
    <div class="wx-table-row">
        <div>Jane Doe</div>
        <div>jane.doe@example.com</div>
        <div>Inactive</div>
        <div class="wx-table-options">
            <div data-uri="/users/2/edit">Edit</div>
        </div>
    </div>
</div>
```