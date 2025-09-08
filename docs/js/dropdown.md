![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# DropdownCtrl

The `Dropdown` component generates a button with a dropdown menu. It is designed to create dynamic and interactive menu elements based on a declarative HTML structure. Instead of a programmatic configuration, the component is defined by `data-` attributes on the host element and by its child elements, which represent the individual menu items.

```
   ┌────────────────┐
   │ [icon] [label] │
   └─┬──────────────┘
   ┌─┴────────────────┐
   │ [header]         │
   │   [icon] [label] │
   │   [icon] [label] │
   ├──────────────────┤
   │ [icon] [label]   │
   └──────────────────┘
```

## Configuration

The component is configured through `data-` attributes on the main container and by defining the menu items as child elements with specific CSS classes.

### Button Settings

The appearance and behavior of the main dropdown button are controlled by the following attributes on the host element:

| Attribute          | Description                                                        | Example
|--------------------|--------------------------------------------------------------------|-----------------------------------------
| `data-label`       | The text label displayed on the button.                            | `data-label="Actions"`
| `data-icon`        | A CSS class for an icon to be displayed on the button.             | `data-icon="fas fa-cog"`
| `data-image`       | The URL of an image to be displayed on the button.                 | `data-image="/path/to/image.png"`
| `data-color`       | A color class (e.g., from a CSS framework) for styling the button. | `data-color="btn-primary"`
| `data-buttoncss`   | Additional CSS classes to be applied to the button.                | `data-buttoncss="btn-sm custom-style"`
| `data-buttonstyle` | Inline CSS styles for the button.                                  | `data-buttonstyle="margin-right: 10px;"`
| `data-menucss`     | Additional CSS classes for the dropdown menu container (`<ul>`).   | `data-menucss="shadow-lg"`
| `active`           | Indicates that the button is in an active state.                   | `<div active></div>`
| `disabled`         | Disables the button, preventing user interaction.                  | `<div disabled></div>`

### Menu Item Types

The items within the dropdown menu are defined by child elements inside the main container. The type of each item is determined by its CSS class:

- **`.wx-dropdown-item`**: A standard clickable menu item. It can contain text, an icon, and an image.
- **`.wx-dropdown-header`**: A non-interactive header to group related menu items.
- **`.wx-dropdown-divider`**: A visual separator between menu items.

Individual items can be configured with their own `data-` attributes, such as `data-icon`, `data-image`, or the `disabled` attribute.

## Programmatic Control

After initialization, the properties of the component can be accessed programmatically.

### Accessing an Automatically Created Instance

For dropdowns defined declaratively in HTML, the instance is retrieved via the `getInstanceByElement(element)` method of the central `webexpress.webui.Controller`.

```javascript
// find the host element in the DOM
const element = document.getElementById('mainDropdown');

// retrieve the controller instance associated with the element
const dropdownCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (dropdownCtrl) {
    // disable the dropdown programmatically
    dropdownCtrl.disabled = true;
}
```

### Manual Instantiation

A dropdown can also be created entirely programmatically. This is useful for dynamic UI scenarios.

```javascript
// find the container element for the dynamic dropdown
const container = document.getElementById('dynamic-dropdown-container');

// create a new instance of DropdownCtrl manually
const dynamicDropdownCtrl = new webexpress.webui.DropdownCtrl(container);
```

## Events

The component dispatches global events to allow other parts of the application to react to user interactions.

- **`webexpress.webui.Event.CLICK_EVENT`**: This event is fired when a clickable menu item is selected. The `event.detail` object contains a reference to the sender and the specific item that was clicked.
- **`webexpress.webui.Event.CHANGE_VISIBILITY_EVENT`**: This event is fired when the dropdown menu is shown or hidden. The `event.detail` object indicates whether the menu is now visible (`true`) or not (`false`).

## Use Case Example

The following code demonstrates how to create a `DropdownCtrl` using a declarative HTML structure.

```html
<!-- The main container for the dropdown button control -->
<div id="mainDropdown" class="wx-webui-dropdown" data-label="Actions" data-icon="fas fa-ellipsis-v" data-color="btn-secondary">

    <!-- A header for the first group of items -->
    <div class="wx-dropdown-header" data-icon="fas fa-cog">
        Settings
    </div>

    <!-- A clickable item with an icon and a text color class -->
    <a id="home-item" class="wx-dropdown-item text-primary" data-icon="fas fa-home">
        Home
    </a>

    <!-- Another clickable item with an image -->
    <a id="profile-item" class="wx-dropdown-item" data-image="/path/to/profile.jpg">
        Profile
    </a>

    <!-- A visual divider -->
    <div class="wx-dropdown-divider"></div>

    <!-- A disabled item that cannot be clicked -->
    <a id="logout-item" class="wx-dropdown-item" data-icon="fas fa-sign-out-alt" disabled>
        Logout
    </a>
</div>
```
In this example, the component is initialized from the HTML. The main button will have the label "Actions" and an icon. The dropdown menu will contain a header, two active items, a divider, and one disabled item, all derived from the child elements.
