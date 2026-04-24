![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# TileCtrl

The `TileCtrl` is a component for managing an interactive tile collection. It facilitates parsing tiles from HTML markup, reordering them via drag-and-drop, toggling their visibility, searching, sorting, and persisting their state (order and visibility). Configuration is done declaratively using `data-` attributes, which promotes simple integration and clean code.

```
   ┌─────────────────────────────┐
   │ ┌───────────┐ ┌───────────┐ │
   │ │ [Tile 1]  │ │ [Tile 2]  │ │
   │ └───────────┘ └───────────┘ │
   │ ┌───────────┐ ┌───────────┐ │
   │ │ [Tile 3]  │ │ [Tile 4]  │ │
   │ └───────────┘ └───────────┘ │
   └─────────────────────────────┘
```

## Declarative Configuration

The initial state and behavior of the tile container are defined via `data-` attributes on the host element. The individual tiles are defined as direct child elements with the class `.wx-tile-card`.

### Container Attributes

| Attribute           | Description                                                         | Example
|---------------------|---------------------------------------------------------------------|------------------------------------
| `data-movable`      | Allows reordering of tiles via drag-and-drop.                       | `data-movable="true"`
| `data-allow-remove` | Allows hiding or removing tiles.                                    | `data-allow-remove="true"`
| `data-persist-key`  | A unique key to save the order and visibility of tiles in a cookie. | `data-persist-key="dashboard-tiles"`

### Tile Attributes

Each tile is defined by an element with the class `.wx-tile-card`.

| Attribute | Description | Example |
| :--- | :--- | :--- |
| `data-id` | A unique ID for the tile. | `data-id="tile-profile"` |
| `data-label` | The title of the tile. | `data-label="User Profile"` |
| `data-icon` | A CSS class for an icon. | `data-icon="fas fa-user"` |
| `data-image` | The URL of an image for the tile header. | `data-image="/path/to/icon.png"` |
| `data-color-css` | A CSS class for color styling. | `data-color-css="bg-primary"` |
| `data-visible` | Determines if the tile is initially visible. | `data-visible="false"` |
| `innerHTML` | The HTML content of the tile body. | `<div>Additional details...</div>` |

## Programmatic Control

Once initialized, the tile collection can be programmatically controlled via its controller instance. Methods like `insertTile`, `searchTiles`, or `orderTiles` automatically trigger a redraw of the view.

### Accessing an Automatically Created Instance

For tile containers defined declaratively in HTML, the associated instance is retrieved via the `getInstanceByElement(element)` method of the central `webexpress.webui.Controller`.

```javascript
// find the host element in the DOM
const tileContainer = document.getElementById('myTileContainer');

// retrieve the controller instance associated with the element
const tileCtrl = webexpress.webui.Controller.getInstanceByElement(tileContainer);

// programmatically search for tiles
if (tileCtrl) {
    tileCtrl.searchTiles('Profile');
}
```

### Manual Instantiation

A tile collection can also be created entirely programmatically and attached to a host element.

```javascript
// find the container element for the dynamic tiles
const container = document.getElementById('tile-container');

// create a new instance of TileCtrl manually
const dynamicTileCtrl = new webexpress.webui.TileCtrl(container);

// add a new tile
dynamicTileCtrl.insertTile({
    id: 'new-tile',
    label: 'Newly Added Tile',
    html: '<p>This tile was added via code.</p>',
    icon: 'fas fa-plus'
});
```

## Events

The component dispatches standardized events to inform the application about interactions.

- **`webexpress.webui.Event.MOVE_EVENT`**: Fired after a tile has been moved.
- **`webexpress.webui.Event.CHANGE_VISIBILITY_EVENT`**: Fired when a tile is shown or hidden.
- **`webexpress.webui.Event.TILE_SEARCH_EVENT`**: Fired after a search, containing the search term and the found tiles.
- **`webexpress.webui.Event.TILE_SORT_EVENT`**: Fired after a sort, containing the sort property and direction.

## Use Case Examples

The following example shows the declarative configuration of a tile container.

```html
<!-- Container that enables drag-and-drop and persistence -->
<div id="dashboard" class="wx-webui-tile" data-movable="true" data-persist-key="dashboard-state" data-allow-remove="true">

    <!-- A tile with an icon and title -->
    <div class="wx-tile-card" data-id="profile" data-icon="fas fa-user" data-label="Profile">
        View your user profile.
    </div>

    <!-- A tile that is initially hidden -->
    <div class="wx-tile-card" data-id="settings" data-icon="fas fa-cog" data-label="Settings" data-visible="false">
        Adjust application settings.
    </div>

    <!-- Another tile -->
    <div class="wx-tile-card" data-id="mail" data-icon="fas fa-envelope" data-label="Messages">
        Check your inbox.
    </div>
</div>
```
