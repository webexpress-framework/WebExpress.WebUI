![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# SidebarCtrl

The `SidebarCtrl` component controls a responsive sidebar for web applications. It uses CSS classes prefixed with `wx-sidebar-` and integrates Popper.js to support overlay panels. The sidebar is flexibly configurable and automatically adapts to the window size, switching between compact and expanded view based on a set breakpoint.

```
   normal view
   ┌─────────────────────────────────────────┐
   │ [header]                                │<--- Header
   │ [icon] [link]                           │<--- Link
   │ [icon] [link]                       [x] │<--- removeable Link
   │ [icon] [link]                           │
   ├─────────────────────────────────────────┤<--- Separator
   │ [panel]                                 │<--- Panel
   │                                         │
   │ [footer]                                │<--- Footer
   └─────────────────────────────────────────┘
   
   compact view 
   ┌──────────┐
   │ [icon]   │<--- Link
   │ [icon]   │
   │ [icon]   │
   ├──────────┤<--- Separator
   │ [icon]   │<--- Panel as overlay
   │          │
   │ [footer] │<--- Footer
   └──────────┘
```

## Configuration

The sidebar is initialized at the host element using child elements and attributes. Several child element types are supported:

| Element Class           | Description
|-------------------------|-------------------------------------------------------------
| `.wx-sidebar-link`      | Navigation entries or action links
| `.wx-sidebar-separator` | Visual separator for structuring
| `.wx-sidebar-header`    | Section header within the sidebar
| `.wx-sidebar-panel`     | Panel with overlay functionality for additional content

Supported attributes:

| Attribute           | Description
|---------------------|-------------------------------------------------------------
| `data-mode`         | Controls compact mode ("hide" hides the element, "overlay" shows an overlay)
| `data-icon`         | Icon class for the element (e.g. `fas fa-cog`)
| `data-image`        | Image URL for the element
| `data-label`        | Label text of the element
| `data-uri`          | Target URI for links
| `data-tooltip`      | Tooltip text for the element
| `data-removeable`   | Indicates whether the element can be removed
| `data-breakpoint`   | Pixel value for switching between compact and normal view

## Functionality

The SidebarCtrl component parses the child elements, handles rendering and manages event handling. It reacts dynamically to window size changes and automatically adjusts the display:

- **Responsive Display:** The sidebar checks whether the window is smaller than the specified breakpoint and then switches to compact mode. In compact mode, elements with `data-mode="hide"` are hidden, panels with `data-mode="overlay"` can be displayed as overlays when clicked.
- **Overlay Panel:** Panels in overlay mode open an overlay window when clicked, positioned using Popper.js. The overlay can be closed by clicking outside or pressing the Escape key.
- **Toolbar:** A toolbar at the bottom of the sidebar is automatically detected and integrated.
- **Removable Elements:** Elements with `data-removeable="true"` receive a button for removal from the sidebar.
- **Event Handling:** The following events are triggered:
  - `webexpress.webui.Event.REMOVE_EVENT` (when an element is removed)
  - `webexpress.webui.Event.SHOW_EVENT` (when the sidebar or an overlay is shown)
  - `webexpress.webui.Event.HIDE_EVENT` (when the sidebar or an overlay is hidden)
  - `webexpress.webui.Event.BREAKPOINT_CHANGE_EVENT` (when switching between compact and expanded view)

## Programmatic Control

After initialization, the sidebar can also be controlled via its controller instance. Main methods are:

- `expand()`: Switches the sidebar to expanded view.
- `reduce()`: Switches the sidebar to compact view.
- `destroy()`: Removes resources and the footer element.

Example for programmatic control:

```javascript
const sidebarElement = document.getElementById('main-sidebar');
const sidebarCtrl = webexpress.webui.Controller.getInstanceByElement(sidebarElement);

if (sidebarCtrl) {
    // activate compact view
    sidebarCtrl.reduce();

    // activate expanded view
    sidebarCtrl.expand();
}
```

## Use Case Example

The following example shows the declaration of a sidebar with various element types and overlay functionality:

```html
<div id="main-sidebar"
     class="wx-webui-sidebar"
     data-breakpoint="800">

    <div class="wx-sidebar-header" data-label="Navigation"></div>
    <div class="wx-sidebar-link" data-icon="fas fa-home" data-label="Home" data-uri="/"></div>
    <div class="wx-sidebar-link" data-icon="fas fa-user" data-label="Profile" data-uri="/profile" data-removeable="true"></div>
    <div class="wx-sidebar-separator"></div>
    <div class="wx-sidebar-panel" data-icon="fas fa-cog" data-label="Settings" data-mode="overlay">
        <div>
            <!-- Panel content for overlay -->
            <form>
                <label for="setting1">Setting 1</label>
                <input type="checkbox" id="setting1" />
            </form>
        </div>
    </div>
    <div class="wx-sidebar-toolbar">
        <!-- Toolbar content -->
        <button type="button">Support</button>
    </div>
</div>
```

## Events

The SidebarCtrl component triggers the following events:

- **REMOVE_EVENT:** When an element is removed.
- **SHOW_EVENT:** When the sidebar or an overlay is shown.
- **HIDE_EVENT:** When the sidebar or an overlay is hidden.
- **BREAKPOINT_CHANGE_EVENT:** When switching between compact and expanded state.

## Summary

SidebarCtrl offers a structured and responsive sidebar with overlay panels, toolbar integration, removable elements, and extensive event handling. It is ideally suited for adaptive navigation structures in modern web applications.