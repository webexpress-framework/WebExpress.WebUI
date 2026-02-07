![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# GraphViewerCtrl

The `GraphViewerCtrl` is an interactive visualization component designed to display network graphs consisting of nodes and connecting edges. It renders using SVG and provides built-in support for panning, zooming, and dragging nodes.

The component includes a lightweight spring-mass physics engine that can automatically arrange nodes if explicit positions are not provided. It supports various node shapes, icons, images, and customizable edge styles.

```
          ┌────────────┐
          │  [Icon]    │ ──────┐
          │   Node A   │       │
          └────────────┘       │ (Edge Label)
                 │             │
                 ▼             ▼
          ┌────────────┐  ┌────────────┐
          │   Node B   │  │   Node C   │
          └────────────┘  └────────────┘
```

## Configuration

The component is initialized on a host container. Global settings for the graph behavior and visual style are defined via `data-` attributes on this container.

|Attribute              |Description                                                                                    
|-----------------------|-----------------------------------------------------------------------------------------------
|`data-node-style`      |Defines the default layout for nodes. Set to `label-below` to place text under the icon/shape. 
|`data-edge-style`      |Defines the drawing style of edges. Options are `smooth` (curved bezier lines) or `straight`.
|`data-physics-enabled` |Controls the built-in physics engine. If `true`, nodes without fixed positions will be auto-arranged. Set to `false` to disable physics.

## Defining the Graph Structure

The initial graph model is parsed directly from the DOM children of the host element.

### Nodes

Nodes are defined by elements with the class `.wx-graph-node`.

|Attribute              |Description
|-----------------------|------------------------------------------------------------------------------------
|`id`                   |**Required**. Unique identifier for the node.
|`data-label`           |The text label displayed on the node. Defaults to the ID if omitted.
|`data-uri`             |URL or path associated with the node.
|`data-x` / `data-y`    |Explicit coordinates. If omitted, the node will be positioned by the physics engine.
|`data-shape`           |The shape of the node background. Options: `rect` (default), `circle`.
|`data-icon`            |A CSS class string for a font icon (e.g., `fas fa-server`).
|`data-image`           |URL to an image to display inside the node.
|`data-background-color`|Hex color or standard color name for the node background fill.
|`data-background-css`  |CSS class to append to the node shape for styling via stylesheets.
|`data-foreground-color`|Color for the text and icon.

### Edges

Edges are defined by elements with the class `.wx-graph-edge`.

|Attribute        |Description
|-----------------|-------------------------------------------------------------------------------------------
|`data-from`      |**Required**. The ID of the source node.
|`data-to`        |**Required**. The ID of the target node.
|`data-label`     |Optional text label displayed in the middle of the edge.
|`data-color`     |Stroke color for the edge line.
|`data-dasharray` |SVG stroke-dasharray pattern (e.g., `5,5` for dashed lines).
|`data-waypoints` |A JSON string array of coordinates `[{"x":10,"y":20}, ...]` for routing the edge manually.

## Functionality

- **Pan & Zoom:** Users can pan the canvas by dragging the background and zoom using the mouse wheel.
- **Interactive Nodes:** Nodes can be dragged to new positions. If physics is enabled, the graph will react elastically.
- **Fit to View:** A built-in button (bottom-right) automatically scales and pans the graph to fit all nodes within the viewport.
- **SVG Rendering:** The graph is rendered as scalable vector graphics, ensuring sharpness at any zoom level.

## Programmatic Control

The graph data can be updated dynamically via JavaScript using the `model` property.

### Accessing an Automatically Created Instance

```javascript
// find the host element
const element = document.getElementById('network-graph');

// retrieve the controller instance
const graphCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (graphCtrl) {
    // update the graph model completely
    graphCtrl.model = {
        nodes: [
            { id: 'n1', label: 'Server', icon: 'fas fa-server', x: 100, y: 100 },
            { id: 'n2', label: 'Client', icon: 'fas fa-laptop', x: 300, y: 100 }
        ],
        edges: [
            { from: 'n1', to: 'n2', label: 'Connection', color: 'blue' }
        ]
    };
}
```

### Manual Instantiation

You can instantiate a `GraphViewerCtrl` manually if you need programmatic control over the graph's initialization:

```javascript
// find the host container for the graph
const container = document.getElementById('my-manual-graph');

// create a new GraphViewerCtrl instance manually
const graphCtrl = new webexpress.webui.GraphViewerCtrl(container);

// set the graph data directly
graphCtrl.model = {
    nodes: [
        { id: 'node-1', label: 'First Node', icon: 'fas fa-circle', x: 120, y: 180, backgroundColor: '#e3f2fd' },
        { id: 'node-2', label: 'Second Node', icon: 'fas fa-square', x: 270, y: 200 }
    ],
    edges: [
        { from: 'node-1', to: 'node-2', label: 'Link', color: '#607d8b' }
    ]
};
```

## Events

The component triggers events when user interactions occur on nodes.

- `webexpress.webui.Event.CLICK_EVENT`: Fired when a node is clicked.
- `webexpress.webui.Event.DOUBLE_CLICK_EVENT`: Fired when a node is double-clicked.

The `detail` property of the event contains:
```javascript
{
    id: "node-id", // The ID of the clicked node
    data: { ... }  // The full data object associated with the node
}
```

## Use Case Example

The following example creates a simple network diagram with three nodes. "Server" and "Database" have fixed positions, while "Client" will be positioned by the physics engine.

```html
<div id="my-graph" 
     class="wx-webui-graph-viewer"
     data-edge-style="smooth"
     data-physics-enabled="true"
     style="height: 500px; border: 1px solid #ccc;">

    <!-- Nodes -->
    <div id="srv-01" 
         class="wx-graph-node" 
         data-label="Main Server" 
         data-icon="fas fa-server"
         data-x="100" data-y="150"
         data-background-color="#e0f7fa"></div>

    <div id="db-01" 
         class="wx-graph-node" 
         data-label="Database" 
         data-shape="circle"
         data-icon="fas fa-database"
         data-x="100" data-y="300"
         data-background-color="#fff9c4"></div>

    <div id="client-01" 
         class="wx-graph-node" 
         data-label="User Client" 
         data-icon="fas fa-laptop"></div>

    <!-- Edges -->
    <div class="wx-graph-edge" 
         data-from="client-01" 
         data-to="srv-01" 
         data-label="HTTPS"
         data-color="#666"></div>

    <div class="wx-graph-edge" 
         data-from="srv-01" 
         data-to="db-01" 
         data-dasharray="4,4"></div>

</div>
```