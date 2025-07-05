![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# ToolbarCtrl

The `ToolbarCtrl` control is used for the dynamic creation of a toolbar. The content and layout of the toolbar are defined by its child elements. This allows for a flexible and declarative configuration directly within the HTML. The toolbar supports a variety of element types, including buttons (with an icon, text, or both), separators for visual grouping, as well as interactive elements like dropdown menus, comboboxes, and static text items. The configuration of individual elements is accomplished using `data-`attributes, which permits detailed customization of appearance and behavior.

```
                           separator                                   text            more
               ...button....   :   dropdown                              :    combobox  :
               :     :     :   :       :                                 :       :      :
   ┌───────────:─────:─────:───:───────:─────────────────────────────────:───────:──────:────┐
   │ ┌─────────V─────V─────V───V───────V─────────────────────────┐┌──────:───────V───────:──┐│
   │ │┌──────────┐┌────┐┌─────┐│┌────────────┐                   ││      V  │┌────────┐  V  ││
   │ ││icon label││icon││label│││icon label ▼│                   ││    label││option ▼│ […] ││
   │ │└──────────┘└────┘└─────┘│└──┬─────────┘                   ││         │└─┬──────┘     ││
   │ └───────────────────────────┌─┴──────────┐──────────────────┘└──────────┌─┴──────┐─────┘│
   └─────────────────────────────│ header     │──────────────────────────────│ option │──────┘
                                 │ icon label │                              │ option │
                                 │ icon label │                              │ option │
                                 ├────────────┤                              └────────┘
                                 │ icon label │
                                 └────────────┘
```

## Item Types

To structure the toolbar, various CSS classes are used for the child elements. Each type is recognized by the control and converted into a corresponding component. The following item types are supported:

- **Buttons (`.wx-toolbar-button`)**: These are the primary interactive elements. They can be used to trigger actions and can be flexibly displayed with an icon, text, or both.
- **Separators (`.wx-toolbar-separator`)**: These provide visual structure and help to organize related buttons into groups.
- **Dropdown Buttons (`.wx-toolbar-dropdown`)**: These buttons open a submenu that can contain further actions or links. The `DropdownCtrl` control is used internally to implement this functionality.
- **Comboboxes (`.wx-toolbar-combobox`)**: These create a dropdown menu from which the user can select one of several predefined options.
- **Text Items (`.wx-toolbar-text`)**: These allow for the display of static, non-interactive text within the toolbar, for instance, for labels or status indicators.
- **"More" Menu (`.wx-toolbar-more`)**: A special dropdown menu that is automatically placed at the right edge of the toolbar and is identified by a "…" symbol. It is intended to hold less frequently used actions.

## Settings

The configuration of individual elements is done via `data-`attributes in the HTML. These attributes allow for fine-grained control over the appearance and functionality.

| Attribute | Description | Example |
| :--- | :--- | :--- |
| `data-label` | Defines the visible text for buttons, comboboxes, or text items. | `data-label="Save"` |
| `data-icon` | Assigns a CSS icon class to a button. | `data-icon="fas fa-save"` |
| `data-title` | Adds a tooltip to a button, which is displayed on mouseover. | `data-title="Save changes"` |
| `data-color` | Applies a predefined color class to a button. | `data-color="btn-primary"` |
| `data-options` | Defines the selectable options for a combobox as a comma-separated list. | `data-options="View 1,View 2"` |
| `data-align` | Sets the alignment of an element within the toolbar (`left` or `right`). The default is `left`. | `data-align="right"` |
| `active` | Visually marks a button as active or selected. The attribute requires no value. | `<div class="wx-toolbar-button" active></div>` |
| `disabled` | Disables an element and prevents interaction. The attribute requires no value. | `<div class="wx-toolbar-button" disabled></div>` |

## Programmatic Control

After initialization, the toolbar instance can be accessed programmatically to dynamically change its properties or child elements.

### Accessing an Automatically Created Instance

For toolbars defined declaratively in HTML, the associated instance is retrieved via the `getInstanceByElement(element)` method of the central `webexpress.webui.Controller`.

```javascript
// find the host element in the DOM
const toolbarElement = document.getElementById('myToolbar');

// retrieve the controller instance associated with the element
const toolbarCtrl = webexpress.webui.Controller.getInstanceByElement(toolbarElement);

// programmatically interact with the toolbar, e.g., to find a specific button
if (toolbarCtrl) {
    const saveButton = toolbarElement.querySelector('[data-label="Save"]');
    // ... further manipulation of the button
}
```

### Manual Instantiation
A toolbar can also be created entirely programmatically and attached to a host element. This is useful for dynamic UI scenarios.

```javascript
// find the container element for the dynamic toolbar
const container = document.getElementById('toolbar-container');

// create a new instance of ToolbarCtrl manually
const dynamicToolbarCtrl = new webexpress.webui.ToolbarCtrl(container);

// add items to the toolbar programmatically
// ...
```

## Events

The control triggers global events to react to user interactions. These can be captured by other parts of the application to execute corresponding actions.

- **`webexpress.webui.Event.CLICK_EVENT`**
  Triggered when a button (`.wx-toolbar-button`) is clicked. The `detail` object of the event contains information about the sender and the clicked item.

- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`**
  Triggered when the user selects a new option in a combobox (`.wx-toolbar-combobox`).

## Use Case Examples

The following HTML example demonstrates the declarative configuration of a toolbar with various item types and attributes.

```html
<!-- The main container for the toolbar control -->
<div id="example-toolbar" class="wx-webui-toolbar">
  
  <!-- A button with an icon and a label -->
  <div class="wx-toolbar-button" data-label="Home" data-icon="fas fa-home"></div>
  
  <!-- A button with only an icon and a tooltip -->
  <div class="wx-toolbar-button" data-icon="fas fa-cog" data-title="Settings"></div>
  
  <!-- A separator to group items -->
  <div class="wx-toolbar-separator"></div>
  
  <!-- A dropdown button with a nested menu -->
  <div class="wx-toolbar-dropdown" data-label="Options">
    <ul class="dropdown-menu">
      <li><a href="#">Option 1</a></li>
      <li><a href="#">Option 2</a></li>
    </ul>
  </div>
  
  <!-- A combobox with a label and selectable options -->
  <div class="wx-toolbar-combobox" data-label="Select" data-options="Option A,Option B,Option C"></div>
  
  <!-- A static text item, aligned to the right -->
  <div class="wx-toolbar-text" data-label="Static Text" data-align="right"></div>

  <!-- A "more" dropdown for additional items that are not frequently used -->
  <div class="wx-toolbar-more">
    <a href="#">Another Item 1</a>
    <a href="#">Another Item 2</a>
  </div>
</div>
```