![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# TabCtrl

The `TabCtrl` component provides a versatile tabbed interface, enabling navigation between different views or content panes without leaving the current page. It supports declarative initialization with `data-` attributes to easily map interactive elements to their respective views. It parses the DOM structure, applies necessary CSS classes for styling (such as standard tabs, pills, or underline layouts), and handles the logic for switching between active states.

```
   ┌─────────────────────────────────────────────────────────────────┐
   │ [Tab 1]  [Tab 2]  [Tab 3]                            [Toolbar]  │
   ├─────────────────────────────────────────────────────────────────┤
   │                                                                 │
   │ Content for the active tab                                      │
   │                                                                 │
   └─────────────────────────────────────────────────────────────────┘
```

## Declarative Configuration

The initial structure and configuration of the tabs are defined declaratively in the HTML markup. The root element acts as the container, and its children with the `wx-tab-view` class define the individual tabs and their content.

### Container Element Attributes

The container element (typically a `<div>`) can be configured using `data-` attributes.

| Attribute     | Description                                                                           | Example
|---------------|---------------------------------------------------------------------------------------|---------------------------------
| `data-layout` | Defines the visual style of the tabs. Supported values: `tab`, `pill`, `underline`. | `data-layout="underline"`

### Tab View Elements Attributes

Each child element representing a tab view can also use `data-` attributes to configure its corresponding navigation header.

| Attribute                 | Description                                                          | Example
|---------------------------|----------------------------------------------------------------------|---------------------------------
| `id`                      | Unique identifier for the tab (required for linking nav and pane).   | `id="settings-tab"`
| `data-label`              | Text label displayed in the tab navigation.                          | `data-label="Settings"`
| `data-icon`               | CSS class for an icon displayed next to the label.                   | `data-icon="fas fa-cog"`
| `data-color`              | CSS class for the icon color.                                        | `data-color="text-primary"`
| `data-wx-primary-action`  | Optional action identifier for the tab.                              | `data-wx-primary-action="save"`
| `data-wx-primary-target`  | Optional target identifier for the tab action.                       | `data-wx-primary-target="form1"`

### Toolbar

The `TabCtrl` supports an optional toolbar that is displayed on the right side of the navigation header. Any direct child element of the main container with the class `wx-tab-toolbar` will be treated as the toolbar and relocated into the nav bar automatically.

The toolbar content uses the same item types as the [`ToolbarCtrl`](toolbar.md). The following items are supported:

- **Buttons (`.wx-toolbar-button`)**: Interactive elements that trigger actions.
- **Separators (`.wx-toolbar-separator`)**: Visual grouping of related buttons.
- **Dropdown Buttons (`.wx-toolbar-dropdown`)**: Open submenus with further actions.
- **Comboboxes (`.wx-toolbar-combo`)**: Dropdown menus for selection between options.
- **Text Items (`.wx-toolbar-label`)**: Static, non-interactive text.
- **"More" Menu (`.wx-toolbar-more`)**: Overflow dropdown at the right edge.

Refer to [toolbar.md](toolbar.md) for full documentation on item types and `data-` attribute configuration.

```html
<div id="myTabs" class="wx-webui-tab">
    <!-- Toolbar -->
    <div class="wx-tab-toolbar">
        <div class="wx-toolbar-button" data-icon="fas fa-plus" data-title="Add"></div>
        <div class="wx-toolbar-separator"></div>
        <div class="wx-toolbar-dropdown" data-label="Options">
            <ul class="dropdown-menu">
                <li><a href="#">Option 1</a></li>
                <li><a href="#">Option 2</a></li>
            </ul>
        </div>
    </div>

    <!-- Tab Views -->
    <div id="tab1" class="wx-tab-view" data-label="Tab 1">...</div>
</div>
```

## Programmatic Control

Once initialized, the `TabCtrl` instance can be used to programmatically change the active tab.

### Accessing an Automatically Created Instance

For tabs defined declaratively, the instance is retrieved via the `getInstanceByElement(element)` method.

```javascript
// find the host element in the DOM
const tabElement = document.getElementById('myTabs');

// retrieve the controller instance associated with the element
const tabCtrl = webexpress.webui.Controller.getInstanceByElement(tabElement);

// programmatically select a specific tab by its ID
if (tabCtrl) {
    tabCtrl.selectTab('settings-tab');
}
```

## Events

The component dispatches events to notify the application of user interactions, specifically when a different tab is selected.

- **`webexpress.webui.Event.SELECTED_TAB_EVENT`**: This event is fired when the user selects a tab. The event `detail` object contains the `tabId` of the newly active tab.

## Use Case Examples

The following example illustrates a complete declarative setup for a tab control, utilizing the underline layout.

```html
<!-- The main tab container -->
<div id="myTabs" class="wx-webui-tab" data-layout="underline">

    <!-- Optional Toolbar (aligned to the right) -->
    <div class="wx-tab-toolbar">
        <div class="btn-group">
            <button class="btn btn-outline-secondary btn-sm">Action</button>
        </div>
    </div>
    
    <!-- Tab 1 -->
    <div id="home-tab" class="wx-tab-view" data-label="Home" data-icon="fas fa-home">
        <h3>Home Content</h3>
        <p>This is the content for the home tab.</p>
    </div>
    
    <!-- Tab 2 -->
    <div id="profile-tab" class="wx-tab-view" data-label="Profile" data-icon="fas fa-user">
        <h3>Profile Content</h3>
        <p>This is the content for the user profile tab.</p>
    </div>

</div>
```
