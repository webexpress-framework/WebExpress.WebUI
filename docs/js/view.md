![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

The `View` control acts as an intelligent container for applications with multiple views. It enables switching between different work areas within a single DOM container and optionally provides a master-detail logic. Each view is defined by a child element with the `.wx-view` class and can be configured using attributes such as `data-title`, `data-description`, and `data-icon-css`. The controller automatically generates a toolbar with a title and a dropdown menu for switching between views.

A notable feature is its support for **split layouts**. If a view is marked with `data-has-details="true"`, the controller listens for `SELECT_ITEM_EVENT` events. When a record is selected, the workspace is automatically split: the main view (master) remains on the left, while a detail area opens on the right, loading content through a `webexpress.webui.FrameCtrl`. The status of the active view is automatically stored in a **cookie**, allowing the user to return to their last view when the page is reloaded.

```
   ┌────────────────────────────────────────────────────────┐ 
   │ [Icon] Title / Description                   [▼ Views] │ 
   ├────────────────────────────────────────────────────────┤ 
   │ Header                                                 │ 
   ├───────────────────────────┬─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤ 
   │ Master Pane               ░ Detail Pane                │
   │                           ░                            │ 
   │                           ░                            │ 
   │                           ░                            │ 
   │                           ░                            │ 
   │                           ░                            │ 
   ├───────────────────────────┴─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤ 
   │ Footer                                                 │ 
   └────────────────────────────────────────────────────────┘
```

## Configuration

The initialization is handled declaratively through the HTML structure. The host element acts as the container, and direct children define the views and optional layout areas.

### Host Element

The host element requires no specific attributes but should be empty of content other than the structural elements described below.

### Child Elements

The controller scans the host for specific classes to build the layout:

|Selector Class |Description
|---------------|----------------------------------------------------------------------------
|`.wx-view`     |Defines a selectable view. Multiple elements allowed.
|`.wx-header`   |(Optional) Defines a persistent header area above the views
|`.wx-footer`   |(Optional) Defines a persistent footer area below the views.

### View Configuration (`.wx-view`)

Attributes on the `.wx-view` elements control the appearance and behavior:

|Attribute          |Description
|-------------------|------------------------------------------------------------------------------
|`data-title`       |The display name of the view (shown in Toolbar and Dropdown).
|`data-description` |A short description displayed below the title in the Toolbar.
|`data-icon-css`    |CSS class for an icon (e.g., `fa fa-list`) shown in the Toolbar and Dropdown.
|`data-icon-img`    |URL to an image icon (alternative to CSS icon).
|`data-has-details` |If `"true"`, enables the Split-Layout logic for Master-Detail interactions.

## Functionality

- **Dynamic Layout**: The controller restructures the DOM, moving `.wx-view` contents into a managed container structure (`.wx-main-pane`).
- **View Switching**: Only one view is visible at a time. Switching is instant and preserves the DOM state of the hidden views.
- **State Persistence**: The index of the active view is stored in a cookie (Key: `wx_view_state_{elementId}`). On reload, the last active view is restored.
- **Master-Detail Logic**:
    - When a view has `data-has-details="true"`, the controller listens for `webexpress.webui.Event.SELECT_ITEM_EVENT`.
    - Upon selection, a `SplitCtrl` is injected, resizing the master view and opening a detail pane on the right.
    - The detail pane uses `FrameCtrl` to load content based on the event data (`detailUri` or `uri`).
- **External Integration**: If `.wx-header` or `.wx-footer` elements are provided, they are preserved and placed outside the scrollable view area, ensuring they remain visible.

## Programmatic Control

The component can be controlled via its JavaScript instance.

### Accessing the Instance

```javascript
// find the host element
const viewContainer = document.getElementById('my-main-view');

// retrieve the controller instance
const viewCtrl = webexpress.webui.Controller.getInstanceByElement(viewContainer);

if (viewCtrl) {
    // switch to the second defined view (index 1)
    viewCtrl.switchView(1);
}

## Events

The component dispatches events to inform the application about state changes.

- webexpress.webui.Event.CHANGE_VISIBILITY_EVENT: Fired when the active view changes.

## Use Case Example

The following example defines a layout with two views. The first view ("List") supports details, while the second ("Settings") does not.

```html
<div id="app-view-container" class="wx-ctrl-view">

    <!-- Persistent Header -->
    <div class="wx-header">
        <!-- global search or filter controls could go here -->
        <input type="text" placeholder="Global Search...">
    </div>

    <!-- view 1: master-detail list -->
    <div class="wx-view"
         data-title="Customer List"
         data-description="Manage all customers"
         data-icon-css="fa fa-users"
         data-has-details="true">
        
        <!-- content of the view (e.g. a table) -->
        <table class="table">
            <!-- ... -->
        </table>
    </div>

    <!-- view 2: simple settings page -->
    <div class="wx-view"
         data-title="Settings"
         data-description="System configuration"
         data-icon-css="fa fa-cogs">
        
        <form>
            <!-- ... -->
        </form>
    </div>

    <!-- persistent footer -->
    <div class="wx-footer">
        <span>Status: Online</span>
    </div>

</div>
```