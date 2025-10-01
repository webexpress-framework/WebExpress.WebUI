![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# SplitCtrl

The `SplitCtrl` is a powerful UI component for creating customizable, split views (Split Panes). It divides a container into two areas—a main pane (`.wx-main-pane`) and a side pane (`.wx-side-pane`)—separated by a draggable divider (splitter). Users can interactively adjust the size of the panes by dragging the splitter.

The component is highly configurable and supports both horizontal and vertical orientations, minimum and maximum size constraints, a customizable order of the panes, as well as the persistence of the set size via cookies.

```
   // Horizontal
   ┌──────────────────┬───┬─────────────────┐
   │                  │ ░ │                 │
   │                  │ S │                 │
   │   Side Pane      │ p │   Main Pane     │
   │                  │ l │                 │
   │                  │ i │                 │
   │                  │ t │                 │
   │                  │ t │                 │
   │                  │ e │                 │
   │                  │ r │                 │
   │                  │ ░ │                 │
   └──────────────────┴───┴─────────────────┘

   // Vertical
   ┌────────────────────────────────────────┐
   │               Side Pane                │
   ├────────────────────────────────────────┤
   │░░░░░░░░░░░░░░░Splitter░░░░░░░░░░░░░░░░░│
   ├────────────────────────────────────────┤
   │               Main Pane                │
   └────────────────────────────────────────┘
```

## Configuration

The initialization and behavior of the `SplitCtrl` are controlled entirely via `data-` attributes on the host element. This allows for simple and clean integration directly within the HTML markup.

| Attribute             | Description
|-----------------------|-------------------------------------------------------------------------------------------------------------------------
| `data-orientation`    | Defines the orientation. Possible values are `"horizontal"` (side-by-side) or `"vertical"` (one above the other). Default is `"horizontal"`.
| `data-order`          | Determines the order of the panes. Possible values are `"side-main"` or `"main-side"`. Default is `"side-main"`.
| `data-size`           | Sets the initial size of the side pane. Supports units like `px`, `em`, `rem`, and `%`.
| `data-unit`           | The default unit for `data-size` if no unit is specified there. Possible values: `px`, `em`, `rem`, `%`. Default is `px`.
| `data-min-side`       | The minimum size of the side pane in pixels, which cannot be undercut when dragging.
| `data-max-side`       | The maximum size of the side pane in pixels, which cannot be exceeded when dragging.
| `data-splitter-class` | One or more CSS classes that are added to the splitter element.
| `data-splitter-style` | Inline CSS styles that are applied to the splitter element.
| `data-splitter-size`  | The width (for horizontal orientation) or height (for vertical orientation) of the splitter in pixels.

## Functionality

The `SplitCtrl` is designed as a self-contained component that manages its own user interface and interaction logic.

During initialization, the component identifies the two child elements `.wx-main-pane` and `.wx-side-pane`. It dynamically creates a splitter element and arranges these three elements within the host container based on `data-order`. The core logic for resizing is located in the `_setPaneSizes` method, which calculates the size of the main pane based on the total size of the container, the size of the side pane, and the size of the splitter.

Interaction occurs by dragging the splitter (`mousedown` and `mousemove`), where the new size is applied in real-time, respecting `min-` and `max-` limits. A double-click on the splitter toggles the side pane: it is either collapsed to its minimum size (or 0) or restored to its previous size. If the host element has an `id`, the component automatically saves the size of the side pane in a cookie to maintain the user's setting on future visits. Communication is handled via global custom events to ensure loose coupling.

## Programmatic Control

After initialization, the component can be controlled programmatically via its JavaScript instance.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-split-container');

// retrieve the controller instance associated with the element
const splitCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (splitCtrl) {
    // collapse the side pane to its minimum size
    splitCtrl.collapseSidePane();

    // expand the side pane to a specific size (e.g., 300px) or its previous size
    splitCtrl.expandSidePane(300);
    
    // fits the side pane size to its content size
    splitCtrl.fitSidePaneToContent();
}
```

### Manual Instantiation

```javascript
// find the container element for the dynamic split control
const container = document.getElementById('dynamic-split-container');

// define the main and side panes
const mainPane = document.createElement('div');
mainPane.classList.add('wx-main-pane');
mainPane.textContent = 'Main content area';
container.appendChild(mainPane);

const sidePane = document.createElement('div');
sidePane.classList.add('wx-side-pane');
sidePane.textContent = 'Side content area';
container.appendChild(sidePane);

// create a new instance of SplitCtrl manually
const dynamicSplitCtrl = new webexpress.webui.SplitCtrl(container);
```

## Events

The component dispatches three main events to inform the application logic about interactions.

- **`webexpress.webui.Event.SIZE_CHANGE_EVENT`**: Fired while the user is dragging the splitter and changing the size of the panes.
- **`web-express.webui.Event.HIDE_EVENT`**: Fired when the side pane is collapsed by a double-click on the splitter.
- **`web-express.webui.Event.SHOW_EVENT`**: Fired when a collapsed side pane is restored by a double-click.

## Use Case Example

```html
<!--
    A vertical split container. The side pane is on top
    and has an initial size of 25% of the container height.
    Its size is persisted via a cookie named "wx-split-size-editor-layout".
-->
<div id="editor-layout"
     class="wx-webui-split"
     data-orientation="vertical"
     data-size="25%"
     data-min-side="50">

    <!-- The main content area -->
    <div class="wx-main-pane">
        <textarea>Main content goes here...</textarea>
    </div>

    <!-- The resizable side area -->
    <div class="wx-side-pane">
        File Explorer or other tools...
    </div>
</div>
```