![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

The `View` control acts as an intelligent container for applications with multiple views. It enables switching between different work areas within a single DOM container. Each view is defined by a child element with the `.wx-view` class and can be configured using attributes such as `data-title`, `data-description`, and `data-icon-css`. A persistent header and footer can optionally be defined and remain visible while the active view changes.

The control supports two layouts that determine how view switching is presented to the user:

- **Default** &mdash; The host renders a toolbar that displays the title and description of the active view. Switching is performed through a dropdown menu.
- **ToggleGroup** &mdash; The host renders a compact toggle bar in which all available views can be selected directly. The title and description of the active view are intentionally omitted, so switching only requires a single click on the corresponding label or icon.

The header area, search bar, main content area and footer remain fully intact in both layouts; only the navigation itself differs.

```
   Default layout:
   ┌────────────────────────────────────────────────────────┐ 
   │ [Icon] Title / Description                   [▼ Views] │ 
   ├────────────────────────────────────────────────────────┤ 
   │ Header                                                 │ 
   ├────────────────────────────────────────────────────────┤ 
   │ Active view content                                    │ 
   │                                                        │ 
   ├────────────────────────────────────────────────────────┤ 
   │ Footer                                                 │ 
   └────────────────────────────────────────────────────────┘

   ToggleGroup layout:
   ┌────────────────────────────────────────────────────────┐ 
   │                         [ View 1 ][ View 2 ][ View 3 ] │ 
   ├────────────────────────────────────────────────────────┤ 
   │ Header                                                 │ 
   ├────────────────────────────────────────────────────────┤ 
   │ Active view content                                    │ 
   │                                                        │ 
   ├────────────────────────────────────────────────────────┤ 
   │ Footer                                                 │ 
   └────────────────────────────────────────────────────────┘
```

## Configuration

The initialization is handled declaratively through the HTML structure. The host element acts as the container, and direct children define the views and optional layout areas.

### Host Element

The host element requires no specific attributes. The optional `data-layout` attribute selects the layout used to render the switcher:

|Attribute      |Values                       |Description
|---------------|-----------------------------|------------------------------------------------------------------------
|`data-layout`  |`default`, `togglegroup`     |Controls how view switching is rendered. Defaults to `default`.

### Child Elements

The controller scans the host for specific classes to build the layout:

|Selector Class |Description
|---------------|----------------------------------------------------------------------------
|`.wx-view`     |Defines a selectable view. Multiple elements allowed.
|`.wx-header`   |(Optional) Defines a persistent header area above the views.
|`.wx-footer`   |(Optional) Defines a persistent footer area below the views.

### View Configuration (`.wx-view`)

Attributes on the `.wx-view` elements control the appearance and behavior:

|Attribute          |Description
|-------------------|------------------------------------------------------------------------------
|`data-title`       |The display name of the view (shown in the toolbar, dropdown or toggle bar).
|`data-description` |A short description displayed below the title in the default toolbar. Ignored by the `togglegroup` layout.
|`data-icon-css`    |CSS class for an icon (e.g., `fa fa-list`).
|`data-icon-img`    |URL to an image icon (alternative to CSS icon).

## Functionality

- **Dynamic Layout**: The controller restructures the DOM, moving `.wx-view` contents into a managed container structure (`.wx-main-pane`).
- **View Switching**: Only one view is visible at a time. Switching is instant and preserves the DOM state of the hidden views.
- **State Persistence**: The index of the active view is stored in a cookie (Key: `wx_view_state_{elementId}`). On reload, the last active view is restored.
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
```

## Events

The component dispatches events to inform the application about state changes.

- webexpress.webui.Event.CHANGE_VISIBILITY_EVENT: Fired when the active view changes.

## Use Case Example

The following example defines a layout with two simple views rendered in the `togglegroup` layout.

```html
<div id="app-view-container" class="wx-ctrl-view" data-layout="togglegroup">

    <!-- persistent header -->
    <div class="wx-header">
        <input type="text" placeholder="Global Search...">
    </div>

    <!-- view 1 -->
    <div class="wx-view"
         data-title="Customer List"
         data-description="Manage all customers"
         data-icon-css="fa fa-users">
        <table class="table">
            <!-- ... -->
        </table>
    </div>

    <!-- view 2 -->
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
