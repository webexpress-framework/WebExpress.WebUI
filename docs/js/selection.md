![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# SelectionCtrl

The `SelectionCtrl` is an advanced and highly customizable selection component that serves as a replacement for the native HTML `<select>` element. It extends the `PopperCtrl` base class to accurately position a dropdown menu. The component supports both single and multiple selections, client-side filtering of options, a rich structuring of the dropdown list (including headers and dividers), and seamless integration into HTML forms.

The selected items are displayed as tags or "pills" directly in the display area, which provides clarity, especially in multi-select mode.

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

The entire configuration of the control is done declaratively through HTML attributes and a structured arrangement of child elements.

| Attribute | Description |
| :--- | :--- |
| `name` | The `name` for the hidden `<input>` field that holds the selected values for form submission. |
| `placeholder` | The text that is displayed when no option is selected. |
| `data-value` | A semicolon-separated list of IDs that defines the initial selection. |
| `data-multiselection`| If set to `"true"`, multi-select mode is activated. |

The items within the dropdown list are defined by child elements with specific classes:

- **`.wx-selection-item`**: A selectable option. It can be configured via attributes such as `id`, `data-label`, `data-icon`, `data-image`, `data-label-color`, and `disabled`. A `data-render` attribute can specify a JavaScript function for custom rendering.
- **`.wx-selection-header`**: A non-selectable heading within the dropdown list.
- **`.wx-selection-divider`**: A visual separator.
- **`.wx-selection-footer`**: A footer section that is displayed at the bottom of the dropdown menu.

## Functionality

The `SelectionCtrl` is designed as a self-contained, reactive component.

- **Dynamic DOM Construction**: During initialization, the component parses its declarative configuration from the host element and its children. The original DOM content is then removed and replaced by a programmatically generated, interactive structure. This includes the visible selection field, a hidden input field, and the dropdown menu.
- **State-Driven Rendering**: The view is a direct function of the internal state, which is primarily determined by the `_values` array (the selected IDs) and the text in the filter field. Any change to this state triggers a call to the `render()` method, which completely redraws the component.
- **Client-Side Filtering**: The dropdown menu contains an input field that allows for real-time filtering of the options list. With each keystroke, the `render()` method is called, which displays only the matching options without modifying the original list of `_items`.
- **Structured and Customizable Options**: The component can display not only simple text options but also richly formatted items with icons, images, and custom render functions. The support for headers and dividers allows for the logical grouping of options.
- **Form Integration**: The IDs of the selected values are stored as a semicolon-separated string in the `value` of a hidden `<input>` element. This allows the component to be used like a native form element.
- **Event-Based Communication**: Instead of directly accessing other parts of the application, the `SelectionCtrl` communicates by dispatching global custom events. This decouples the component and allows for flexible integration.

## Programmatic Control

After initialization, the control can also be manipulated programmatically via its JavaScript instance.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-selection');

// retrieve the controller instance associated with the element
const selectionCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (selectionCtrl) {
    // get the current selection (an array of IDs)
    const currentSelection = selectionCtrl.value;

    // set a new selection programmatically
    // this will trigger a re-render and dispatch the CHANGE_VALUE_EVENT
    selectionCtrl.value = ['user_1', 'user_3'];
}
```

### Manual Instantiation

```javascript
// find the container element for the dynamic selection
const container = document.getElementById('dynamic-selection-container');

// create a new instance of SelectionCtrl manually
const dynamicSelectionCtrl = new webexpress.webui.SelectionCtrl(container);

// set the properties programmatically
dynamicSelectionCtrl.name = 'dynamic-assignees';
dynamicSelectionCtrl.multiselection = true;
dynamicSelectionCtrl.options = [{ id: 'new_1', label: 'New Option' }];
dynamicSelectionCtrl.value = ['new_1'];
```

## Events

The control dispatches four main events to inform the application logic about state changes.

- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`**: Fired when the selection (`value`) changes.
- **`webexpress.webui.Event.CHANGE_FILTER_EVENT`**: Fired when the user types text into the filter field.
- **`webexpress.webui.Event.DROPDOWN_SHOW_EVENT`**: Fired when the dropdown menu becomes visible.
- **`webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT`**: Fired when the dropdown menu is hidden.

## Use Case Example

```html
<!--
    Host element for a multi-select control.
    It is pre-configured with two selected values.
-->
<div id="assign-users"
     class="wx-webui-selection"
     name="assignees"
     placeholder="Select users..."
     data-multiselection="true"
     data-value="user_1;user_3">

    <!-- A header for grouping options -->
    <div class="wx-selection-header">Administrators</div>

    <!-- Selectable items with icons -->
    <div id="user_1" class="wx-selection-item" data-icon="fas fa-user-shield">Rene Schwarzer</div>
    <div id="user_2" class="wx-selection-item" data-icon="fas fa-user-shield">Jane Doe</div>

    <!-- A visual separator -->
    <div class="wx-selection-divider"></div>

    <div class="wx-selection-header">Contributors</div>
    <div id="user_3" class="wx-selection-item" data-icon="fas fa-user-edit">John Smith</div>
    <div id="user_4" class="wx-selection-item" data-icon="fas fa-user-edit" disabled>Inactive User</div>
</div>
```