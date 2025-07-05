![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# ExpandableCtrl

The `ExpandableCtrl` component provides a container whose content can be dynamically shown and hidden. It is ideal for structuring user interfaces by allowing complex or secondary information to be concealed by default and revealed upon user interaction. Initialization is purely declarative via HTML, where the content is placed directly as a child element and the behavior is controlled through `data-` attributes.

The component consists of a perpetually visible header that acts as an interactive toggle, and a content area whose visibility is controlled.

```
   ┌──────────────────────────────────┐
   │ ▼ [Icon] [Header]                │  // Interactive Header
   ├──────────────────────────────────┤
   │                                  │
   │    [Collapsible Content Area]    │  // Content Section
   │                                  │
   └──────────────────────────────────┘
```

### Configuration

The component's configuration is managed via `data-` attributes directly on the host element. This enables an intuitive and maintainable integration without the need for initialization scripts.

| Attribute | Description |
| :--- | :--- |
| `data-header` | Defines the text for the header. |
| `data-expanded` | Controls the initial state. If set to `"true"`, the content is initially displayed; otherwise, it is collapsed. |
| `data-icon-opened` / `data-icon-closed` | Allows assigning different CSS classes for icons to visually distinguish between the expanded and collapsed states. |
| `data-image-opened` / `data-image-closed` | Defines different image URLs for each state. |
| `data-color` | Assigns a CSS class to the icon for color styling. |
| `data-headercss` | Allows applying additional CSS classes to the header text for further styling. |

### Features

The `ExpandableCtrl` is designed to reduce the complexity of the user interface while offering high flexibility.

- **Declarative Content Area**: Any HTML code placed within the host element is automatically treated as the collapsible content area. The component takes ownership of these child elements upon initialization.
- **Interactive Header**: The entire header, including the indicator arrow, optional icon, and text, responds to click events to toggle the visibility state of the content area.
- **State-Dependent Visualization**: The ability to define different icons or images for the open and closed states provides clear visual feedback on the component's current state.
- **Visual Transitions**: A subtle CSS transition for the indicator symbol ensures a visually appealing state change.

### Programmatic Control

Beyond declarative initialization, the component can also be manipulated programmatically via its JavaScript instance after the page has loaded.

#### 1. Accessing an Automatically Created Instance

For components defined declaratively in HTML, the associated instance is retrieved via the `getInstanceByElement(element)` method of the central `webexpress.webui.Controller`.

```javascript
// find the host element in the DOM
const element = document.getElementById('details-section');

// retrieve the controller instance associated with the element
const expandableCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (expandableCtrl) {
    // programmatically toggle the visibility state
    expandableCtrl.expand = !expandableCtrl.expand;
}
```

#### 2. Manual Instantiation

An `ExpandableCtrl` component can also be created entirely programmatically, which is useful for dynamic UI scenarios.

```javascript
// find the container element for the dynamic expandable section
const container = document.getElementById('dynamic-expandable-container');

// create a new instance of ExpandableCtrl manually
const dynamicExpandableCtrl = new webexpress.webui.ExpandableCtrl(container);

// set the properties programmatically
dynamicExpandableCtrl.header = 'Dynamic Section';
dynamicExpandableCtrl.expanded = true;
dynamicExpandableCtrl.iconOpened = 'fas fa-minus';
dynamicExpandableCtrl.iconClosed = 'fas fa-plus';

// you can then append content to the container
const content = document.createElement('p');
content.textContent = 'This content was added dynamically.';
container.appendChild(content);
```

### Events

The component dispatches standardized events to facilitate loose coupling with other parts of the application.

- **`webexpress.webui.Event.CLICK_EVENT`**: Fired immediately after the user clicks on the header.
- **`webexpress.webui.Event.CHANGE_VISIBILITY_EVENT`**: Fired after the state has been changed. The `detail` object of the event contains the new visibility status (`true` for visible, `false` for hidden).

### Use Case Example

The following example demonstrates the configuration of an initially collapsed section with state-dependent icons.

```html
<!--
    The main container for the expandable control.
    It is configured with a header and different icons for its expanded/collapsed states.
    The content is defined by the nested <div> element.
-->
<div id="details-section"
     class="wx-webui-expand"
     data-header="Show Advanced Settings"
     data-icon-opened="fas fa-chevron-down"
     data-icon-closed="fas fa-chevron-right"
     data-expanded="false">

    <!-- This content will be toggled. -->
    <div class="p-3 border-top">
        <p>Here are the advanced settings you can configure.</p>
        <label>Option 1: <input type="text"></label>
    </div>
</div>
```