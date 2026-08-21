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
| `data-icon` | A CSS class for an icon. | `data-icon="user"` |
| `data-image` | The URL of an image for the tile header. | `data-image="/path/to/icon.png"` |
| `data-color-css` | A CSS class for color styling. | `data-color-css="bg-primary"` |
| `data-visible` | Determines if the tile is initially visible. | `data-visible="false"` |
| `data-badge` | A kicker shown above the title, naming the kind the tile belongs to. `data-badge-color-css` / `data-badge-color-style` colour its marker. | `data-badge="Incident"` |
| `data-chip` | A short qualifier shown at the trailing end of the kicker row. | `data-chip="Recommended"` |
| `innerHTML` | The HTML content of the tile body. | `<div>Additional details...</div>` |
| `.wx-tile-card-footer` | A child element whose content is rendered as a metadata footer below the body instead of inside it. | `<div class="wx-tile-card-footer"><span>9 fields</span></div>` |

A tile card is therefore laid out as kicker, title, body and footer, so the kind a card
belongs to reads before its name and its metadata after its description. The same anatomy
is used by the tile picker form control (`wx-webui-input-tile`), which additionally
supports a search box (`data-searchable`, `data-search-placeholder`), a fixed number of
tiles per row (`data-columns`), narrowing the visible tiles to the value of another input
(`data-filter-source` on the picker, `data-filter-value` on the tile), and projecting
values out of the selected tile (`data-wx-bind-*`, see below).

A tile marked `data-always-visible="true"` is exempt from both the filter and the search.
Use it for the entry that must never fall away because it is the way on — an "add new" or
a "none of these" card.

### Selection

The picker marks the chosen tile with the class `wx-tile-card-selected` and with
`aria-selected`, and adds a check badge (`wx-tile-card-check`) in its corner. The state is
therefore carried by the frame, the ground and a glyph together rather than by colour
alone. Because the base rule of a tile card declares `border` and `box-shadow` as
shorthands from a descendant selector, the stylesheet writes the selected state with a
selector that outranks it; a single-class rule would be overridden and the frame would
silently disappear.

### Bound values

A tile of the picker may carry `data-wx-bind-{name}` attributes. When the tile is
selected, each value is written to the form control of that name, to the text of any
element carrying `data-wx-bind-text="{name}"`, and toggles the visibility of any element
carrying `data-wx-bind-visible="{name}"`. This lets a card stand for more than its label —
the references it selects, or a note about what it implies — without a bespoke script.

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
    icon: 'plus'
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
    <div class="wx-tile-card" data-id="profile" data-icon="user" data-label="Profile">
        View your user profile.
    </div>

    <!-- A tile that is initially hidden -->
    <div class="wx-tile-card" data-id="settings" data-icon="cog" data-label="Settings" data-visible="false">
        Adjust application settings.
    </div>

    <!-- Another tile -->
    <div class="wx-tile-card" data-id="mail" data-icon="envelope" data-label="Messages">
        Check your inbox.
    </div>
</div>
```
