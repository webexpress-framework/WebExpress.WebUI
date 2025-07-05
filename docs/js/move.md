![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# MoveCtrl

The `MoveCtrl` component is used to manage a selection of items from a predefined set. It implements the "dual list" or "list builder" pattern, where two lists are displayed side-by-side: one for the available options ("Available") and one for the already selected options ("Selected"). A central control panel with buttons allows for moving single or all items between the two lists. Additionally, interaction is supported through drag-and-drop as well as double-clicks.

The component is designed to represent a selection for a form field and stores the IDs of the selected items in a hidden input field (`<input type="hidden">`), ensuring seamless integration into standard HTML forms.

```
   ┌──────────────────────┐   ┌──────┐   ┌──────────────────────┐
   │ Header (Selected)    │   │      │   │ Header (Available)   │
   ├──────────────────────┤   │  <<  │   ├──────────────────────┤
   │                      │   │      │   │                      │
   │ - Option A           │   │  <   │   │ - Option C           │
   │ - Option B           │   │      │   │ - Option D           │
   │                      │   │  >   │   │                      │
   │                      │   │      │   │                      │
   │                      │   │  >>  │   │                      │
   │                      │   │      │   │                      │
   └──────────────────────┘   └──────┘   └──────────────────────┘
```

## Configuration

The initialization of the component is done entirely declaratively. The host element defines the overall configuration, while the individual available options are declared as child elements.

| Attribute | Description |
| :--- | :--- |
| `name` | The name for the hidden input field used in form submission. |
| `data-value` | A semicolon-separated list of IDs that defines the initial selection. |
| `data-header-selected` / `data-header-available` | The text for the headers of the two lists. |
| `data-button-*` | Defines the labels for the four move buttons (e.g., `data-button-selectall`). |

Each available option is defined by an element with the class `.wx-webui-move-option`.

- **ID**: The `id` of the element serves as the unique value of the option.
- **Text Content**: The text within the element is used as its label.
- **`data-icon` / `data-image`**: Allows assigning an icon or an image to an option.

## Functionality

The `MoveCtrl` is designed as a self-contained system that manages its state internally and re-renders its view upon any change.

- **Dynamic DOM Construction**: During initialization, the component reads all declared options and configurations from the HTML. Subsequently, the original DOM is completely removed and replaced by the programmatically created two-list structure.
- **State-Centric Architecture**: The primary source of truth is the `_values` array, which contains the IDs of the currently selected items. Every interaction that changes the selection modifies this array. Immediately after, the `render()` method is called.
- **Reactive Rendering**: The `render()` method is non-destructive to the state but completely destructive to the view. It clears both lists and rebuilds them from scratch based on the current `_values` array. In doing so, all necessary event listeners for clicks, double-clicks, and drag-and-drop are re-bound to the list items.
- **Diverse Interaction Models**: It supports interactions via buttons, drag-and-drop, mouse double-clicks, and the keyboard.
- **Form Integration**: The IDs of the selected items are stored as a semicolon-separated string in the `value` of a hidden `<input>` field, making the component compatible with standard form submissions.

## Programmatic Control

After initialization, the component can also be manipulated programmatically via its JavaScript instance.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-move-control');

// retrieve the controller instance associated with the element
const moveCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (moveCtrl) {
    // get the current selection (array of IDs)
    const currentSelection = moveCtrl.value;

    // set a new selection programmatically
    // this will trigger a re-render
    moveCtrl.value = ['id1', 'id3', 'id5'];
}
```

### Manual Instantiation

```javascript
// find the container element for the dynamic move control
const container = document.getElementById('dynamic-move-container');

// create a new instance of MoveCtrl manually
const dynamicMoveCtrl = new webexpress.webui.MoveCtrl(container);

// set the properties programmatically
dynamicMoveCtrl.name = 'dynamic-roles';
dynamicMoveCtrl.options = [
    { id: 'new1', label: 'New Option 1' },
    { id: 'new2', label: 'New Option 2', icon: 'fas fa-star' }
];
dynamicMoveCtrl.value = ['new2'];
```

## Events

The component dispatches events to inform other parts of the application about user interactions.

- **`webexpress.webui.Event.CLICK_EVENT`**: Fired when a user clicks on an item in one of the lists.
- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`**: Fired as soon as the selection of items (`value`) changes.

## Use Case Example

```html
<!--
    The host element defines the control and its configuration.
    The initial selection is 'item-2'.
-->
<div id="user-roles"
     class="wx-webui-move"
     name="roles"
     data-value="item-2"
     data-header-selected="Assigned Roles"
     data-header-available="Available Roles">

    <!-- Each option is declared as a child element. -->
    <div id="item-1" class="wx-webui-move-option" data-icon="fas fa-user-shield">Administrator</div>
    <div id="item-2" class="wx-webui-move-option" data-icon="fas fa-user-edit">Editor</div>
    <div id="item-3" class="wx-webui-move-option" data-icon="fas fa-user">Viewer</div>
</div>
```