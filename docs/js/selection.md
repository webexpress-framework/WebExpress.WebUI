![WebExpress-Framework](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# SelectionCtrl

The `SelectionCtrl` component is a read-only control used to display a static list of items. It is designed to visually represent a set of options and highlight which ones are "selected" without providing any user interaction for changing that selection.

All items are rendered in a single, flat `<ul>` list. This makes it an ideal choice for displaying data, such as the tags assigned to a blog post or the roles of a user, in a clear and non-interactive way.

```
   ┌────────────────────────────────────────────────────────┐
   │ ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐ │
   │ │ [icon] Option A │ │ [icon] Option B │ │ [icon] ... │ │
   │ └─────────────────┘ └─────────────────┘ └────────────┘ │
   └────────────────────────────────────────────────────────┘
```

## Configuration

The component is initialized declaratively. The host element defines the control, and its child elements define the available options.

| Attribute    | Description
|--------------|--------------------------------------------------------------------------------------
| `data-value` | A semicolon-separated list of option IDs that should be initially marked as selected.

Each available option is defined by an element with the class `.wx-selection-item`.

- **ID**: The `id` of the element serves as the unique value of the option.
- **`data-label`**: The text label for the item. If not provided, the element's text content is used.
- **`data-icon` / `data-image`**: An icon class or image URL for the item.
- **`data-label-color`**: A CSS class to apply to the list item, allowing for custom styling (e.g., colored tags).
- **`disabled`**: Marks the item with a disabled style.

## Functionality

- **Static List Display**: Renders all provided options in a simple `<ul>` list. The list is not filterable or sortable by the user.
- **Selection Highlighting**: Items whose IDs are present in the `value` property are given a `.selected` CSS class for visual distinction.
- **Read-Only by Design**: There are no user interactions for selecting or deselecting items. Changes to the selection can only be made programmatically.
- **State Management**: The component reads its initial configuration from the DOM. The `options` and `value` properties can be manipulated via JavaScript after initialization, which will trigger a re-render.

## Programmatic Control

After initialization, the component's state can be accessed and modified through its JavaScript instance.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-selection-list');

// retrieve the controller instance associated with the element
const selectionCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (selectionCtrl) {
    // get the currently marked items (array of IDs)
    const currentSelection = selectionCtrl.value;

    // set a new selection to be highlighted
    // this will re-render the list
    selectionCtrl.value = ['item-1', 'item-3'];
}
```

## Use Case Example

The following HTML demonstrates how to display a list of user roles, with "Administrator" and "Editor" marked as selected.

```html
<!--
    The host element defines the read-only selection list.
    The 'data-value' attribute specifies which items are highlighted.
-->
<div id="user-roles-display"
     class="wx-webui-selection"
     data-value="role-admin;role-editor">

    <!-- Each option is declared as a child element. -->
    <div id="role-admin" class="wx-selection-item" data-icon="fas fa-user-shield">Administrator</div>
    <div id="role-editor" class="wx-selection-item" data-icon="fas fa-user-edit">Editor</div>
    <div id="role-viewer" class="wx-selection-item" data-icon="fas fa-user">Viewer</div>
    <div id="role-guest" class="wx-selection-item" data-icon="fas fa-question-circle" disabled>Guest (Disabled)</div>
</div>
```

# InputSelectionCtrl

The `InputSelectionCtrl` is a versatile dropdown selection component that supports both single and multi-select modes, customizable options with icons and images, filtering, and structural elements like headers and dividers. It is designed to be highly configurable through declarative HTML attributes and provides a rich user experience for selecting items from a list.

The component's value is managed internally and synchronized with a hidden input field, making it fully compatible with standard HTML form submissions.

```
   ┌────────────────────────────────────────────┐
   │                                            │
   │ [[Icon] Option A [x]] [[Icon] Option C [x]]│  // Display area with selected items
   │                                            │
   └────────────────────────────────────────────┘
   ┌────────────────────────────────────────────┐
   │  [Filter Input...]                     [x] │  // Dropdown menu
   │ ────────────────────────────────────────── │
   │ [Header Text]                              │
   │   [Icon] Option B                          │
   │ ────────────────────────────────────────── │
   │   [Icon] Option D                          │
   │ ────────────────────────────────────────── │
   │ [Footer Content]                           │
   └────────────────────────────────────────────┘
```

## Configuration

The component is initialized on a host element and configured using `data-` attributes.

| Attribute            | Description                                                   | Example
|----------------------|---------------------------------------------------------------|----------------------------------
| `name`               | The name for the hidden input field used for form submission. | `name="categories"`
| `data-value`         | A semicolon-separated list of IDs for the initial selection.  | `data-value="id2;id3"`
| `data-multiselection`| Set to `"true"` to enable multi-select mode.                  | `data-multiselection="true"`
| `placeholder`        | The text displayed when no items are selected.                | `placeholder="Select an item..."`

### Options and Structural Elements

Options and other list items are defined as child elements of the host container.

- **Item (`.wx-selection-item`)**: Represents a selectable option.
  - `id`: The unique value of the item.
  - `data-label`: The text label for the item.
  - `data-icon` / `data-image`: An icon class or image URL for the item.
  - `data-label-color`: A CSS class to apply to the selected item's tag.
  - `disabled`: Marks the item as non-selectable.
  - `data-render`: A JavaScript function string for custom rendering of the item in the dropdown list.
- **Header (`.wx-selection-header`)**: A non-selectable header to group options.
- **Divider (`.wx-selection-divider`)**: A visual separator line.
- **Footer (`.wx-selection-footer`)**: A static footer section at the bottom of the dropdown.

## Functionality

- **Single and Multi-Select**: Can be configured for both modes. In single-select mode, choosing a new item replaces the current one.
- **Filtering**: A built-in search box allows users to filter the list of options in real-time.
- **Rich Content**: Options can include icons, images, and custom HTML structures.
- **Custom Rendering**: A `data-render` attribute allows for a completely custom JavaScript-driven rendering for each option in the dropdown.
- **Form Integration**: The component automatically manages a hidden `<input>` field, storing the selected values as a semicolon-separated string.
- **Dynamic Updates**: Both the available `options` and the selected `value` can be get and set programmatically.

## Programmatic Control

The component's instance can be accessed to manipulate its state after initialization.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-selection');

// retrieve the controller instance associated with the element
const selectionCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (selectionCtrl) {
    // get the current selection (array of IDs)
    const currentSelection = selectionCtrl.value;

    // set a new selection programmatically
    selectionCtrl.value = ['id1', 'id4'];

    // update the available options
    selectionCtrl.options = [
        { id: 'new1', label: 'New Option 1' },
        { id: 'new2', label: 'New Option 2', icon: 'fas fa-star' }
    ];
}
```

## Events

The component dispatches several events to allow for external interactions.

- `webexpress.webui.Event.CHANGE_VALUE_EVENT`: Fired when the selection changes.
- `webexpress.webui.Event.CHANGE_FILTER_EVENT`: Fired when the user types in the filter input.
- `webexpress.webui.Event.DROPDOWN_SHOW_EVENT`: Fired when the dropdown menu becomes visible.
- `webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT`: Fired when the dropdown menu is hidden.

## Use Case Example

```html
<div id="category-selection"
     class="wx-webui-input-selection"
     name="categories"
     data-value="cat-2"
     data-multiselection="true"
     placeholder="Select categories...">

    <div class="wx-selection-header">Group 1</div>
    <div id="cat-1" class="wx-selection-item" data-icon="fas fa-tag">Category 1</div>
    <div id="cat-2" class="wx-selection-item" data-icon="fas fa-tag" data-label-color="bg-primary">Category 2</div>
    <div class="wx-selection-divider"></div>
    <div class="wx-selection-header">Group 2</div>
    <div id="cat-3" class="wx-selection-item" data-icon="fas fa-tag" disabled>Category 3 (Disabled)</div>
    <div id="cat-4"
         class="wx-selection-item"
         data-render="(item) => `<strong>${item.label}</strong><br><small>Custom Render</small>`"
         data-label="Category 4">
    </div>
    <div class="wx-selection-footer">
        <a href="#">Add New...</a>
    </div>
</div>
```