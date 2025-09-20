![WebExpress-Framework](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# TreeCtrl

The `TreeCtrl` component is used for displaying and managing hierarchical data in a tree structure. It allows users to navigate through nested nodes, expand and collapse branches by clicking, and—if enabled—reorganize the structure by dragging and dropping nodes.

The component is designed to read its entire configuration and initial structure declaratively from the HTML markup and generate a fully interactive and ARIA-compliant tree view at runtime.

```
   ┌───────────────────────────┐
   │                           │
   │ ▼ [Icon] Parent Node 1    │  // Expanded Node
   │   ► [Icon] Child Node 1.1 │
   │   ► [Icon] Child Node 1.2 │
   │ ► [Icon] Parent Node 2    │  // Collapsed Node
   │                           │
   └───────────────────────────┘
```

## Declarative Configuration

Initialization is handled entirely through `data-` attributes on the host element and a nested structure of `<div>` elements for the nodes.

**Host Element Attributes:**

| Attribute             | Description
|-----------------------|-------------------------------------------------------------------------------------------------------------------
| `data-layout`         | Defines the visual layout of the tree. Possible values include `wx-tree-group`, `wx-tree-flush`, `wx-tree-flat`, `wx-tree-horizontal`.
| `data-indicator`      | If set to `"false"`, the expand/collapse indicators (arrows/dots) are hidden. Default is `true`.
| `data-indicator-leaf` | If set to `"false"`, hides dot indicators for leaf nodes. Any other value shows leaf dots (default).
| `data-movable`        | If set to `"true"`, drag-and-drop functionality for moving nodes is enabled.

**Node Structure and Attributes:**

The tree structure is defined by `<div>` elements with the class `.wx-tree-node`. Nested nodes are placed as child elements within their parent node.

| Attribute | Description |
| :--- | :--- |
| `id` | A unique ID for the node, used for events and programmatic control. |
| `data-label` | The visible text of the node. |
| `data-icon` | A base icon used for both the opened and closed states. |
| `data-icon-opened` | A specific icon for the expanded state. |
| `data-icon-closed` | A specific icon for the collapsed state. |
| `data-image` / `data-image-opened` / `data-image-closed` | Corresponds to the icon attributes, but for using image URLs. |
| `data-active` | If set to `"true"`, the node is marked as active (e.g., highlighted). |
| `data-expand` | If set to `"true"`, the node is initially displayed in an expanded state. |
| `data-uri` / `data-target` | Creates a link (`<a>`) instead of a button to point to a URL. |
| `data-tooltip` | Adds a tooltip to the node. |
| `data-render` | A JavaScript function as a string that allows for custom rendering of the node's content. |

## Architecture and Functionality

The `TreeCtrl` is designed as a self-contained, reactive component.

- **Dynamic DOM Construction**: During initialization, the component recursively parses the declared HTML structure and builds an internal data model (the `_nodes` array) from it. Subsequently, the host element is cleared, and a semantically correct, accessible tree structure made of `<ul>` and `<li>` elements with the appropriate `role` and `aria-` attributes is programmatically constructed.
- **State-Driven Rendering**: The visual representation of the tree is a direct function of the `_nodes` data model. Any change to a node's state (e.g., the `expand` property) or to the structure itself (e.g., through drag-and-drop) triggers a call to the `render()` method, which redraws the tree.
- **Interaction Model**:
    - **Expand/Collapse**: A click on the indicator arrow or a double-click on the node itself toggles the `expand` property of the node and re-renders the child nodes (or hides them). This fires the `CHANGE_VISIBILITY_EVENT`.
    - **Click**: A single click on the node label fires the `CLICK_EVENT`, allowing the application to react to a node selection.
- **Drag-and-Drop Logic**: If `data-movable` is enabled, a complex drag-and-drop functionality is provided:
    - **Intelligent Target Detection**: A node can be dropped above, below, or as a child of another node. The component detects the target position by evaluating the mouse position relative to the target element (top 25%, middle 50%, bottom 25%).
    - **Visual Feedback**: A horizontal line indicator (`.wx-tree-drag-indicator`) precisely shows the insertion position (above/below). If the node is inserted as a child, the target element is visually highlighted.
    - **Validation**: It prevents a parent node from being moved into one of its own child nodes to avoid inconsistent states.
    - **Event Communication**: After a successful move operation, the `MOVE_EVENT` is fired, containing the source and target node IDs as well as the position.

## Programmatic Control

The component can be fully controlled via its JavaScript instance after initialization. There are two primary ways to obtain or create an instance.

### Accessing an Automatically Created Instance

For trees defined declaratively in HTML, the central `webexpress.webui.Controller` automatically creates an instance. Access to this instance is provided through the controller's `getInstanceByElement(element)` method.

```javascript
// find the host element in the DOM
const element = document.getElementById('my-tree');

// retrieve the controller instance associated with the element
const treeCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (treeCtrl) {
    // now the instance can be controlled programmatically
    // e.g., to replace the entire tree with new data
    treeCtrl.nodes = [
        { 
            id: 'new_node_1', 
            label: 'New Root Node',
            children: [
                { id: 'new_child_1', label: 'Child' }
            ]
        }
    ];

    // e.g., to clear the entire tree
    treeCtrl.clear();
}
```

### Manual Instantiation

Alternatively, a tree can be created entirely programmatically. This is useful when data is loaded dynamically at runtime (e.g., from an API). The `new` constructor of the `TreeCtrl` class is used for this purpose.

```javascript
// find the container element for the dynamic tree
const container = document.getElementById('dynamic-tree-container');

// create a new instance of TreeCtrl manually
const dynamicTreeCtrl = new webexpress.webui.TreeCtrl(container);

// the new instance is now ready to be used
dynamicTreeCtrl.expandAll();
```

## Event Handling

The `TreeCtrl` component communicates user interactions and state changes via global events dispatched on the host element.

- **`webexpress.webui.Event.CLICK_EVENT`**: Fired when a user clicks on a node. The `event.detail` object contains the data of the clicked node.
- **`webexpress.webui.Event.CHANGE_VISIBILITY_EVENT`**: Fired when a node is expanded or collapsed. The `event.detail` object contains the data of the affected node.
- **`webexpress.webui.Event.MOVE_EVENT`**: Fired after a node has been successfully moved via drag-and-drop. The `event.detail` object contains `source` (ID of the moved node), `target` (ID of the target node), and `position` (`'before'`, `'after'`, or `'over'`).

```javascript
const element = document.getElementById('file-explorer');

element.addEventListener(webexpress.webui.Event.MOVE_EVENT, (event) => {
    console.log('Node moved:', event.detail);
    // e.g., { source: 'file-1a', target: 'folder-2', position: 'over' }
});
```

## Use Case Example

```html
<!--
    Host element for a movable tree.
    The framework will automatically initialize this as a TreeCtrl.
-->
<div id="file-explorer"
     class="wx-webui-tree"
     data-movable="true">

    <!-- Root node, initially expanded -->
    <div id="folder-1" class="wx-tree-node" data-label="Project Files" data-icon="fas fa-folder" data-expand="true">
        <!-- Child nodes -->
        <div id="file-1a" class="wx-tree-node" data-label="index.html" data-icon="fas fa-file-code"></div>
        <div id="file-1b" class="wx-tree-node" data-label="styles.css" data-icon="fas fa-file-alt"></div>
    </div>

    <!-- Another root node -->
    <div id="folder-2" class="wx-tree-node" data-label="Documents" data-icon="fas fa-folder"></div>
</div>
```