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
|`data-edge-style`      |Defines the drawing style of edges: `rounded` (default, straight segments with rounded corners), `straight` (sharp corners) or `smooth` / `curve` (bezier).
|`data-physics-enabled` |Controls the built-in physics engine. If `true`, nodes without fixed positions will be auto-arranged. Set to `false` to disable physics.
|`data-label`           |The accessible name announced for the canvas. Defaults to a generic "Graph canvas".
|`data-grid`            |Optional background grid. `true` uses the default cell size (20), a number sets the cell size, and anything else (or omitting it) leaves the grid off.
|`data-grid-snap`       |Set to `true` to snap dragged nodes and waypoints to the grid. Requires `data-grid`.

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
|`data-icon`            |A CSS class string for a font icon (e.g., `server`).
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

> **Icons and images are not interchangeable.** `data-icon` is a CSS class rendered as
> `<i class="…">` inside a `foreignObject`; `data-image` is a URL rendered as an SVG
> `<image href="…">`. Putting a URL into `data-icon` sets it as a class name on an empty
> element and renders nothing.

### Colour precedence

An explicit `data-foreground-color` / `data-background-color` / `data-color` beats a
`…-css` class, which beats the theme default. The explicit colour is applied as an inline
style rather than as a `fill` / `stroke` presentation attribute — a presentation attribute
loses against every stylesheet rule, so the theme defaults for labels and edges would
otherwise silently overrule the colour that was chosen.

### Coordinate space

`data-x` / `data-y` address the **top left corner** of a node. The simulation works with
node centres internally and converts on both boundaries, so a position written to the
model and read back from it is unchanged. Code that writes positions back into the model
by hand must convert as well, or every round trip through the model (an undo, a save and
reload) shifts the node by half its size.

## Functionality

- **Pan & Zoom:** Users can pan the canvas by dragging the background and zoom using the mouse wheel.
- **Interactive Nodes:** Nodes can be dragged to new positions. If physics is enabled, the graph will react elastically.
- **View controls:** A cluster in the **lower left** corner of the canvas offers fit, centre, zoom in and zoom out. They act on the view only - nothing they do is saved or undone - which is why they sit on the canvas rather than in the editor toolbar, and why the read-only viewer has them too.
- **SVG Rendering:** The graph is rendered as scalable vector graphics, ensuring sharpness at any zoom level.

### Edge routing

The default routing draws straight segments and rounds the corner at each waypoint. That
keeps a waypoint readable as the deliberate routing decision it is: a bezier bends the
whole run and no longer passes through the point the user placed. `data-edge-style` selects
`straight` (sharp corners) or `smooth` when a curve is wanted anyway.

The arrowhead is drawn in the edge's own colour. Since an SVG marker cannot inherit the
stroke of the path referencing it, one marker is created per colour in use.

## Simulation Lifecycle

The physics engine runs on `requestAnimationFrame`, but only while there is something to
compute. The loop starts when nodes arrive without a position or when a node is grabbed,
and it **stops itself** as soon as no free node moves faster than `SETTLE_VELOCITY`
(0.05 units per frame). An idle graph therefore costs nothing. A configuration that
cannot reach equilibrium is bounded by `MAX_SIMULATION_FRAMES` (1800 frames, about 30
seconds) so it always hands the frame loop back.

Grabbing a node wakes a settled simulation again; releasing it lets the neighbourhood
settle and the loop ends once more.

## Teardown

`destroy()` releases everything the control installed outside its own subtree:

- the animation frame loop,
- the pan and drag handlers on `window`, **including the transient ones of a gesture that
  was still in progress**,
- the pointer, wheel and context-menu handlers on the SVG root,
- the SVG canvas, the fit button and the live region.

The controller calls `destroy()` when the host leaves the document. A control that is torn
down mid-drag leaves nothing behind.

## Accessibility

The canvas is a single tab stop (`tabindex="0"`, `role="application"`) with an accessible
name from `data-label`. Pointer interaction moves the focus onto it, so mouse and keyboard
operate on the same element. Each node group carries `role="img"` and an `aria-label` with
its label, and an off-screen live region next to the canvas announces selection and
structural changes, which are otherwise invisible because they only manifest as geometry.

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
            { id: 'n1', label: 'Server', icon: 'server', x: 100, y: 100 },
            { id: 'n2', label: 'Client', icon: 'laptop', x: 300, y: 100 }
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
        { id: 'node-1', label: 'First Node', icon: 'circle', x: 120, y: 180, backgroundColor: '#e3f2fd' },
        { id: 'node-2', label: 'Second Node', icon: 'card', x: 270, y: 200 }
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
         data-icon="server"
         data-x="100" data-y="150"
         data-background-color="#e0f7fa"></div>

    <div id="db-01" 
         class="wx-graph-node" 
         data-label="Database" 
         data-shape="circle"
         data-icon="database"
         data-x="100" data-y="300"
         data-background-color="#fff9c4"></div>

    <div id="client-01" 
         class="wx-graph-node" 
         data-label="User Client" 
         data-icon="laptop"></div>

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

---

# GraphEditorCtrl

The `GraphEditorCtrl` extends `GraphViewerCtrl` with editing: a toolbar, selection,
undo/redo, node and edge creation, waypoint routing and a properties dialog. It reads the
same DOM model and is registered under `wx-webui-graph-editor`.

The physics engine is off in the editor - positions are authored, not simulated - so the
frame loop never runs.

## Toolbar

The toolbar carries undo/redo, add node, add edge, edit, delete and export. Which of them
appear is decided by `_toolbarActions()`, so a subclass that offers some of these elsewhere
narrows the list instead of removing buttons afterwards — the workflow editor moves
creation and editing into its properties panel that way. Separators collapse automatically
when the actions around them are absent.

## Editing with the Pointer

- **Click** a node or an edge to select it; clicking the background clears the selection.
- **Drag** a node to move it, or a waypoint to reshape an edge.
- **Double-click** the background to add a node, an edge to add a waypoint, a node to open
  its properties.
- **Right-click** a waypoint to remove it.
- **Add edge mode** (toolbar toggle): click the source node, then the target.
- Dragging an edge endpoint handle reconnects it to another node.

## Keyboard Model

The editor is fully operable from the keyboard once the canvas has the focus. Colour
fields in the properties dialog use the framework colour control
(`ControlFormItemInputColor` / `InputColorCtrl`), so they offer the shared palette rather
than a bare native swatch.

|Key                    |Action
|-----------------------|-----------------------------------------------------------------------
|`Arrow`                |Moves the selection to the nearest node in that direction. With an edge selected and a waypoint active, the horizontal arrows walk its waypoints.
|`Alt` + `Arrow`        |Moves the selected node or waypoint by `NUDGE_STEP` (10 units).
|`Alt` + `Shift` + `Arrow` |Moves it by a single unit for fine placement.
|`Enter`                |Opens the properties of the selection, or completes a pending edge.
|`Ctrl` + `Enter`       |Starts an edge at the selected node; pick the target with the arrows and confirm with `Enter`.
|`Insert`               |Adds a waypoint to the selected edge, on its longest segment, and selects it.
|`Delete`               |Removes the selection. With a waypoint selected only the waypoint is removed, not the edge. Removing a node asks for confirmation and takes its edges with it.
|`Escape`               |Cancels a pending edge and clears the selection.
|`Ctrl` + `Z` / `Ctrl` + `Y` |Undo / redo.
|`+` / `-` / `0`        |Zoom in, zoom out, fit to view.

The edge properties dialog offers the stroke pattern as drawn samples rather than as a
`stroke-dasharray` value, and the colour fields use the framework colour control.

### Shortcut ownership

The key handler is registered on `window`, because an SVG canvas is not focused by merely
pointing at it. It therefore checks whether the event belongs to this editor before acting:

- an event whose target is an `input`, `textarea`, `select` or a `contenteditable` element
  is left to that element - **including the fields of the editor's own properties panel**,
  so `Delete` while renaming a state edits the text instead of deleting the state;
- an event originating outside this editor's host is ignored, so a page can carry several
  graphs and arbitrary other forms without a shortcut crossing over;
- a torn-down editor ignores keys entirely.

## Undo History

Every structural change pushes a deep snapshot of the model. A drag pushes its pre-drag
snapshot once, on release, and only if the element actually moved. The stack is capped at
`HISTORY_LIMIT` (50 entries). Undo and redo prune a selection the restored model no longer
contains, so the properties panel never edits an object that has been undone away.

## Events

In addition to the viewer events the editor emits
`webexpress.webui.Event.CHANGE_VALUE_EVENT` after every model mutation, with the current
model in `detail.model`. Node positions are synchronized into the model before the event
is dispatched, so a listener always sees current coordinates.