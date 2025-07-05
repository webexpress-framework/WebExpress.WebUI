![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# SearchCtrl

The `SearchCtrl` is a sophisticated search field component that extends beyond the functionality of a standard input field. It provides an integrated dropdown list with predefined search suggestions, a favorites feature, a search icon, and a button to quickly clear the field. The control is designed to offer users an intuitive and guided search experience by displaying relevant suggestions and prioritizing frequently used search queries for quick access.

The positioning of the dropdown menu is managed by the `PopperCtrl` base class to ensure correct alignment below the search field.

```
   ┌──────────────────────────────────────────┐
   │                                          │
   │ [Icon] [Search Input Placeholder...] [x] │
   │                                          │
   └──────────────────────────────────────────┘
   ┌──────────────────────────────────────────┐
   │ [*] Favorited Suggestion 1               │
   │ [*] Favorited Suggestion 2               │
   │ ──────────────────────────────────────── │
   │     Filtered Suggestion 3                │
   │     Filtered Suggestion 4                │
   │ ──────────────────────────────────────── │
   │ [Footer Content]                         │
   └──────────────────────────────────────────┘
```

## Configuration

The entire configuration of the search field is done declaratively via HTML attributes and child elements of the host element.

| Attribute | Description |
| :--- | :--- |
| `name` | The name for the `<input>` element, relevant for form submissions. |
| `placeholder` | The placeholder text displayed in the empty search field. |
| `data-icon` | The CSS class for the icon displayed at the beginning of the search field (e.g., `fas fa-search`). |
| `data-favorited` | If set to `"true"`, the favorites feature (star icon) is enabled for the suggestions. |
| `data-value` | The initial value of the search field. |

Search suggestions and an optional footer are defined as child elements:

- **Suggestions**: Each `<div>` with the class `.wx-search-suggestion` is interpreted as a suggestion. Attributes like `id`, `data-icon`, `data-image`, `data-color`, and `data-favorited` can be used to customize each suggestion individually.
- **Footer**: An element with the class `.wx-search-footer` can contain HTML content that is displayed at the bottom of the dropdown list.

## Functionality

The `SearchCtrl` is designed as a self-contained component that dynamically generates its user interface and manages its state internally.

- **Dynamic DOM Construction**: During initialization, the component reads the configuration from the host element and its children. Subsequently, the original content of the host element is removed and replaced by a programmatically created structure that includes the search field, icon, clear button, and dropdown menu.
- **Suggestion Management**: The declared suggestions are extracted and stored internally. The component distinguishes between favorited and non-favorited suggestions.
- **Interactive Dropdown Menu**: The dropdown menu becomes visible as soon as the input field gains focus. The `_refreshSuggestions` method is called on every input (`input` event) to filter the list of non-favorited suggestions, so that only those containing the entered text are displayed.
- **Favorites System**: If the favorites feature is enabled, favorited suggestions are always displayed at the top of the list, separated by a divider. Each suggestion item gets a star icon that allows the user to toggle its favorite status. Such a change triggers the `CHANGE_FAVORITE_EVENT` to inform the application of the change and re-renders the list.
- **State Management and Event Communication**: The current search text is stored in the `_value` property. Any change to this property (either by user input or programmatic assignment) triggers the `CHANGE_FILTER_EVENT`. This is the primary event that informs other components that a new search should be performed.

## Programmatic Control

After initialization, the value of the search field can be read and set programmatically.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-search');

// retrieve the controller instance associated with the element
const searchCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (searchCtrl) {
    // get the current search query
    const currentQuery = searchCtrl.value;

    // set a new search query programmatically
    // this will update the input field and trigger the CHANGE_FILTER_EVENT
    searchCtrl.value = "status:open";
}
```

### Manual Instantiation

```javascript
// find the container element for the dynamic search control
const container = document.getElementById('dynamic-search-container');

// create a new instance of SearchCtrl manually
const dynamicSearchCtrl = new webexpress.webui.SearchCtrl(container);

// set the properties programmatically
dynamicSearchCtrl.name = 'q-dynamic';
dynamicSearchCtrl.placeholder = 'Search dynamically...';
dynamicSearchCtrl.suggestions = [
    { id: 'dyn1', label: 'Dynamic Suggestion 1' },
    { id: 'dyn2', label: 'Dynamic Suggestion 2', favorited: true }
];
```

## Events

The component communicates state changes via four specific events.

- **`webexpress.webui.Event.CHANGE_FILTER_EVENT`**: Fired when the value of the search field changes. This is the signal to perform a filter or search operation.
- **`webexpress.webui.Event.CHANGE_FAVORITE_EVENT`**: Fired when a user changes the favorite status of a suggestion.
- **`webexpress.webui.Event.DROPDOWN_SHOW_EVENT`**: Fired when the dropdown menu with suggestions becomes visible.
- **`webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT`**: Fired when the dropdown menu is hidden.

## Use Case Example

```html
<!--
    Host element for the search control.
    Favoriting is enabled, and an initial value is set.
-->
<div id="issue-search"
     class="wx-webui-search"
     name="q"
     placeholder="Search issues..."
     data-favorited="true"
     data-value="is:open">

    <!-- Pre-defined suggestions -->
    <div id="s1" class="wx-search-suggestion" data-favorited="true">is:open</div>
    <div id="s2" class="wx-search-suggestion" data-favorited="true">is:closed</div>
    <div id="s3" class="wx-search-suggestion">label:bug</div>
    <div id="s4" class="wx-search-suggestion">label:enhancement</div>

    <!-- Optional footer for the dropdown -->
    <div class="wx-search-footer">
        <a href="/search/advanced">Advanced Search</a>
    </div>
</div>
```