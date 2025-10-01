![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# PaginationCtrl

The `PaginationCtrl` is a UI component for displaying page navigation. It allows users to browse through paginated data, such as long lists or tables. The control dynamically generates a series of page numbers, including "Back" and "Next" buttons, and intelligently adapts its display to the total number of pages. For a large number of pages, an abbreviated view with ellipses (...) is used to keep the user interface clean.

The component is designed to manage its state (current page and total page count) internally and triggers a redraw of the view with every change.

```
   ┌─────────────────────────────────────────┐
   │                                         │
   │ [<]   1   …   4   [5]   6   …   10  [>] │ Example of the pagination control for page 5 of 10.
   │                                         │
   └─────────────────────────────────────────┘   
```

## Configuration

The initialization of the control is done via `data-` attributes directly on the host element. This allows for simple configuration in the HTML markup.

| Attribute    | Description
|--------------|----------------------------------------------------------------------------------------------
| `data-page`  | The initially active page. The count starts at 0. If not specified, 0 is used as the default.
| `data-total` | The total number of available pages. If not specified, 10 is used as the default.

## Functionality

The `PaginationCtrl` is designed as a self-contained, reactive component that manages its own lifecycle from initialization to interaction.

- **Dynamic DOM Construction**: During initialization, the component reads the configuration attributes, completely clears the host element, and programmatically rebuilds the pagination buttons using `<li>` and `<a>` elements that correspond to the Bootstrap pagination classes.
- **State-Driven Rendering**: The visual representation is directly coupled with the internal properties `_page` and `_count`. Any change to these properties, whether through user interaction or programmatic access, automatically triggers a call to the `render()` method. This method redraws the control completely based on the new state.
- **Intelligent Pagination Logic**: The core logic resides in the `_addPageItems` method. It decides how the page numbers are displayed:
    - **Few pages (≤ 10)**: All page numbers are displayed directly.
    - **Many pages**: Depending on the position of the current page (`_page`), an abbreviated representation is chosen:
        - **At the beginning**: The first few pages are displayed, followed by an ellipsis and the last page (e.g., `< 1 2 3 4 5 ... 20 >`).
        - **At the end**: The first page, an ellipsis, and the last few pages are displayed (e.g., `< 1 ... 16 17 18 19 20 >`).
        - **In the middle**: The first page, an ellipsis, a few pages around the current page, another ellipsis, and the last page are displayed (e.g., `< 1 ... 8 9 10 11 12 ... 20 >`).
- **Event-Based Communication**: Instead of interacting directly with other parts of the application, the component communicates by dispatching global custom events. This promotes loose coupling and allows other components to react to page changes.

## Programmatic Control

After initialization, the control can be fully managed programmatically via its JavaScript instance.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-pagination');

// retrieve the controller instance associated with the element
const paginationCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (paginationCtrl) {
    // get the current page number
    const currentPage = paginationCtrl.page;

    // programmatically set the current page to 3
    // this will trigger a re-render and dispatch the CHANGE_PAGE_EVENT
    paginationCtrl.page = 3;
}
```

### Manual Instantiation

```javascript
// find the container element for the dynamic pagination
const container = document.getElementById('dynamic-pagination-container');

// create a new instance of PaginationCtrl manually
const dynamicPaginationCtrl = new webexpress.webui.PaginationCtrl(container);

// set the properties programmatically
dynamicPaginationCtrl.total = 25;
dynamicPaginationCtrl.page = 5;
```

## Events

The component dispatches two main events to inform the application logic about interactions.

- **`webexpress.webui.Event.CLICK_EVENT`**: Fired on every click of any page button (including "Back" and "Next"). The `detail` object contains the index of the page that was clicked.
- **`webexpress.webui.Event.CHANGE_PAGE_EVENT`**: Fired only when the `page` property actually changes. This is the primary event to listen for in order to reload paginated data.

## Use Case Example

```html
<!--
    The host element for the pagination control.
    It is initialized to show page 4 of a total of 15 pages.
-->
<ul id="content-pagination"
    class="wx-webui-pagination"
    data-page="4"
    data-total="15">
</ul>
```