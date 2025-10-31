![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# ToolbarCtrl

The `ToolbarCtrl` control provides dynamic creation and management of a responsive toolbar. The content and layout of the toolbar are defined by its child elements, which enables flexible and declarative configuration directly in HTML. The toolbar supports various element types, such as buttons (with icon, text, or both), separators, interactive elements like dropdown menus and comboboxes, as well as static text items. Configuration is performed via `data-` attributes for detailed customization of appearance and behavior.

```
                           separator                         text            overflow-
               ...button....   :   dropdown    overflow       :    combobox    more    more
               :     :     :   :       :          :           :       :         :       :
   ┌───────────:─────:─────:───:───────:──────────V───────────:───────:─────────:───────:───┐
   │┌──────────:─────:─────:───:───────:──────────────────────:───────:─────────:───┐┌──:──┐│
   ││┌─────────V─────V─────V───V───────V───────────────┐┌─────:───────V──────┐┌─:──┐││  :  ││
   │││┌──────────┐┌────┐┌─────┐│┌────────────┐         ││     V  │┌────────┐ ││ V  │││  V  ││
   ││││icon label││icon││label│││icon label ▼│         ││   label││option ▼│ ││[▼] │││ […] ││
   │││└──────────┘└────┘└─────┘│└──┬─────────┘         ││        │└─┬──────┘ ││    │││     ││
   ││└───────────────────────────┌─┴──────────┐────────┘└─────────┌─┴──────┐─┘└────┘││     ││
   │└────────────────────────────│ header     │───────────────────│ option │────────┘└─────┘│
   └─────────────────────────────│ icon label │───────────────────│ option │────────────────┘
                                 │ icon label │                   │ option │
                                 ├────────────┤                   └────────┘
                                 │ icon label │
                                 └────────────┘
```

## Item Types

The toolbar structure is determined by the CSS classes of its child elements. Each type is recognized and transformed into the corresponding component. The following types are supported:

- **Buttons (`.wx-toolbar-button`)**: Main interactive elements that trigger actions. They can be displayed with icon, text, or both.
- **Separators (`.wx-toolbar-separator`)**: Provide visual grouping of related buttons.
- **Dropdown Buttons (`.wx-toolbar-dropdown`)**: Open submenus with further actions or links. Internally, the `DropdownCtrl` control is used.
- **Comboboxes (`.wx-toolbar-combo`)**: Create a dropdown menu for selection between several options.
- **Text Items (`.wx-toolbar-label`)**: Display static, non-interactive text in the toolbar, such as labels or status displays.
- **"More" Menu (`.wx-toolbar-more`)**: A special dropdown menu automatically placed at the right edge, marked by the "…" symbol. Used for less frequently required actions.

## Settings

Individual elements are configured via `data-` attributes in the HTML. These attributes provide fine-grained control over appearance and functionality.

| Attribute          | Description                                                                             | Example
|--------------------|-----------------------------------------------------------------------------------------|----------------------
| `data-label`       | Sets the visible text for buttons, comboboxes, or text items.                           | `data-label="Save"`
| `data-icon`        | Assigns a CSS icon class to a button.                                                   | `data-icon="fas fa-save"`
| `data-title`       | Adds a tooltip to a button, displayed on mouseover.                                     | `data-title="Save changes"`
| `data-color-css`   | Applies a predefined color class to an element.                                         | `data-color-css="btn-primary"`
| `data-color-style` | Applies a direct CSS style to an element.                                               | `data-color-style="background-color: #ff0000;"`
| `data-align`       | Sets the alignment of an element within the toolbar (`left` or `right`). Default: `left`| `data-align="right"`
| `active`           | Marks a button as active or selected visually. No value required.                       | `<div class="wx-toolbar-button" active></div>`
| `disabled`         | Disables an element and prevents interaction. No value required.                        | `<div class="wx-toolbar-button" disabled></div>`

## Programmatic Control

After initialization, the toolbar instance can be accessed programmatically to change its properties or child elements dynamically.

### Accessing an Automatically Created Instance

For toolbars declared in HTML, the associated controller instance can be retrieved using `getInstanceByElement(element)` from `webexpress.webui.Controller`.

```javascript
// find the host element in the DOM
const toolbarElement = document.getElementById('myToolbar');

// retrieve the controller instance for the element
const toolbarCtrl = webexpress.webui.Controller.getInstanceByElement(toolbarElement);

// programmatically interact with the toolbar, e.g., find a specific button
if (toolbarCtrl) {
    const saveButton = toolbarElement.querySelector('[data-label="Save"]');
    // ...further manipulation of the button
}
```

### Manual Instantiation

A toolbar can also be created completely programmatically and assigned to a host element, which is useful for dynamic UI scenarios.

```javascript
// find the container element for the dynamic toolbar
const container = document.getElementById('toolbar-container');

// create a new ToolbarCtrl instance manually
const dynamicToolbarCtrl = new webexpress.webui.ToolbarCtrl(container);

// add items to the toolbar programmatically
// ...
```

## Events

The control triggers global events in response to user interactions. These events can be processed by other application modules.

- **`webexpress.webui.Event.CLICK_EVENT`**
  Triggered when a button (`.wx-toolbar-button`) is clicked. The event `detail` object contains information about the sender and the clicked item.

- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`**
  Triggered when the user selects a new option in a combobox (`.wx-toolbar-combo`).

## Example Use Cases

The following HTML example demonstrates declarative configuration of a toolbar with different item types and attributes.

```html
<!-- Main container for the toolbar control -->
<div id="example-toolbar" class="wx-webui-toolbar">
  
  <!-- A button with icon and label -->
  <div class="wx-toolbar-button" data-label="Home" data-icon="fas fa-home"></div>
  
  <!-- A button with only icon and tooltip -->
  <div class="wx-toolbar-button" data-icon="fas fa-cog" data-title="Settings"></div>
  
  <!-- A separator for grouping -->
  <div class="wx-toolbar-separator"></div>
  
  <!-- A dropdown button with nested menu -->
  <div class="wx-toolbar-dropdown" data-label="Options">
    <ul class="dropdown-menu">
      <li><a href="#">Option 1</a></li>
      <li><a href="#">Option 2</a></li>
    </ul>
  </div>
  
  <!-- A combobox with label and selectable options -->
  <div class="wx-toolbar-combo" data-label="Select">
      <option value="a">Option A</option>
      <option value="b">Option B</option>
      <option value="c">Option C</option>
  </div>
  
  <!-- A static text item, aligned to the right -->
  <div class="wx-toolbar-label" data-label="Static Text" data-align="right"></div>

  <!-- A "more" dropdown for additional, less frequently used items -->
  <div class="wx-toolbar-more">
    <a href="#">Another Item 1</a>
    <a href="#">Another Item 2</a>
  </div>
</div>
```