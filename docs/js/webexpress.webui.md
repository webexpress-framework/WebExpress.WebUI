![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# webexpress.webui.js

The file `webexpress.webui.js` is the core of the WebExpress.WebUI JavaScript framework. It defines the central infrastructure for managing UI controls, registering actions, handling events, and providing shared services such as internationalization and syntax highlighting. All classes and singletons live under the `webexpress.webui` namespace.

## Overview

| Class / Singleton                     | Type      | Description
|---------------------------------------|-----------|----------------------------------------------------------
| `webexpress.webui.Controller`         | Singleton | Central controller that monitors the DOM, manages control instances, and delegates actions.
| `webexpress.webui.FilterRegistry`     | Singleton | Manages client-side quick-filter state with group constraints and cookie persistence.
| `webexpress.webui.I18N`               | Singleton | Internationalization helper for translations with automatic language detection.
| `webexpress.webui.Syntax`             | Singleton | Registry for language-specific syntax-highlighting configurations.
| `webexpress.webui.Actions`            | Singleton | Dynamic registry for action plugins that can be extended from external files.
| `webexpress.webui.EditorPlugins`      | Singleton | Registry for WYSIWYG editor plugins with priority-based ordering.
| `webexpress.webui.EditorAddOns`       | Singleton | Registry for editor add-ons that can be inserted via the editor plugin.
| `webexpress.webui.DialogPanels`       | Singleton | Registry for modal dialog panel definitions.
| `webexpress.webui.DashboardWidgets`   | Singleton | Registry for dashboard widget definitions.
| `webexpress.webui.TableTemplates`     | Singleton | Registry for table cell renderer templates.
| `webexpress.webui.Ctrl`              | Class     | Abstract base class for all UI controls.
| `webexpress.webui.PopperCtrl`        | Class     | Base class for controls that use Popper.js for dropdown positioning.
| `webexpress.webui.Event`             | Class     | Utility class that defines all event name constants.

---

## Controller

The `Controller` is a singleton that monitors changes in the DOM via a `MutationObserver` and automatically creates instances of registered control classes when matching elements appear. It also handles the delegation of primary and secondary actions and manages fullscreen toggling.

### Methods

| Method                                                  | Description
|---------------------------------------------------------|------------------------------------------------------------------
| `registerClass(selector, ClassConstructor)`              | Registers a class constructor for a CSS selector. When the DOM contains an element with this selector as a class, an instance of the class is created automatically.
| `createInstances(element)`                               | Creates instances for new DOM elements (depth-first). Called automatically by the MutationObserver.
| `createInstanceByClassType(classType, element)`          | Creates an instance from a registered class type and binds it to the given element. Returns the instance or `null`.
| `removeInstances(element)`                               | Removes instances for removed DOM elements and their descendants.
| `getInstance(selector, ClassConstructor?)`               | Retrieves an instance by CSS selector. Optionally restricts to a specific class constructor.
| `getInstanceByElement(element, ClassConstructor?)`       | Retrieves an instance by DOM element reference.
| `getClosestInstance(element, ClassConstructor?)`          | Traverses up the DOM tree from the given element and returns the closest control instance.
| `toggleFullscreen(el)`                                   | Toggles CSS-based fullscreen state for the provided element.
| `toggleNativeFullscreen(el)`                             | Toggles native browser fullscreen for the provided element.

### Declarative Action Binding

HTML elements can trigger registered actions via `data-wx-primary-action` (click) and `data-wx-secondary-action` (dblclick) attributes. The Controller resolves the action name from the `webexpress.webui.Actions` registry and invokes the corresponding `execute` callback. Additional parameters are passed through arbitrary `data-wx-{prefix}-*` attributes.

```html
<!-- primary action triggers on click -->
<button data-wx-primary-action="modal"
        data-wx-primary-target="#myModal"
        data-wx-primary-uri="/api/data"
        data-wx-primary-size="lg">
    Open Modal
</button>

<!-- secondary action triggers on double-click -->
<tr data-wx-secondary-action="frame"
    data-wx-secondary-target="#detailFrame"
    data-wx-secondary-uri="/details/42">
    ...
</tr>
```

### Dismiss Actions

Dismiss actions are handled directly by the Controller, independently of the Actions registry:

| Attribute                              | Description
|----------------------------------------|----------------------------------------------------------
| `data-wx-dismiss="fullscreen"`         | Exits CSS-based fullscreen on click.
| `data-wx-dismiss="native-fullscreen"`  | Exits native browser fullscreen on click.

### Data Binding

The `data-wx-bind` attribute connects a UI element to event-driven data sources:

| Bind Type  | Description
|------------|------------------------------------------------------------
| `search`   | Listens for `CHANGE_FILTER_EVENT` on the source element and calls `instance.search(query, searchType)`.
| `paging`   | Listens for `CHANGE_PAGE_EVENT` on the source element and calls `instance.paging(page)`.
| `filter`   | Listens for global `CHANGE_FILTER_EVENT` and calls `instance.filter(activeFilters)`.

```html
<div id="myTable"
     class="wx-webui-table"
     data-wx-bind="search, filter"
     data-wx-source-search="#searchBox">
</div>
```

---

## Actions

The `Actions` singleton provides a dynamic registry for action plugins. Actions are loaded from external files (e.g., `action/default.js`) and can be freely extended without modifying the framework core.

### Methods

| Method                          | Description
|---------------------------------|--------------------------------------------------------------
| `register(name, definition)`    | Registers an action under the given name. The definition must contain an `execute` function.
| `get(name)`                     | Returns the action definition for the given name, or `null`.
| `has(name)`                     | Returns `true` if an action is registered under the given name.
| `getAll()`                      | Returns an array of all registered action names.
| `unregister(name)`              | Removes the action registered under the given name.
| `clear()`                       | Removes all registered actions.

### Action Definition Contract

```javascript
webexpress.webui.Actions.register("my-action", {
    /**
     * Called when the action is triggered (click for primary, dblclick for secondary).
     * @param {HTMLElement} element - The element that triggered the action.
     * @param {string} prefix - "primary" or "secondary".
     * @param {object} controller - The Controller singleton.
     * @param {Event} event - The original DOM event.
     */
    execute: function (element, prefix, controller, event) {
        // action logic
    },

    /**
     * Optional one-time initialization hook, called once per element binding.
     * @param {HTMLElement} element - The bound element.
     * @param {string} prefix - "primary" or "secondary".
     * @param {object} controller - The Controller singleton.
     */
    init: function (element, prefix, controller) {
        // setup logic (e.g., aria attributes)
    }
});
```

### Built-in Actions

The following actions are registered in `action/default.js`:

| Action Name          | Description                                                         | Supported Attributes
|----------------------|---------------------------------------------------------------------|-------------------------------------
| `modal`              | Shows a modal dialog instance.                                      | `target`, `uri`, `size`
| `frame`              | Sets the URI on a frame control instance.                           | `target`, `uri`
| `split`              | Toggles the side pane of a split control.                           | `target`
| `fullscreen`         | Toggles CSS-based fullscreen for the target element.                | `target`
| `native-fullscreen`  | Toggles native browser fullscreen for the target element.           | `target`
| `filter`             | Toggles a quick-filter in the `FilterRegistry`.                     | _(uses element ID)_

### Example: Registering a Custom Action

```javascript
// file: action/custom.js
webexpress.webui.Actions.register("redirect", {
    execute: function (element, prefix, controller, event) {
        event.preventDefault();
        const uri = element.getAttribute("data-wx-" + prefix + "-uri");
        if (uri) {
            window.location.href = uri;
        }
    }
});
```

```html
<a data-wx-primary-action="redirect"
   data-wx-primary-uri="/dashboard">
    Go to Dashboard
</a>
```

---

## FilterRegistry

The `FilterRegistry` singleton manages client-side quick-filter state. It supports group constraints, exclusive filters, reset filters, and persists state to cookies.

### Methods

| Method                          | Description
|---------------------------------|--------------------------------------------------------------
| `registerFilters(filters)`      | Registers an array of filter definitions.
| `init()`                        | Initializes state from the cookie and broadcasts the initial state.
| `activate(id)`                  | Activates a filter by ID, enforcing group exclusivity constraints.
| `deactivate(id)`                | Deactivates a filter by ID.
| `toggle(id)`                    | Toggles the state of a filter.
| `clearGroup(group)`             | Clears all active filters within a specific group.
| `clearAll()`                    | Clears all currently active filters.
| `getActiveFilters()`            | Returns an array of all currently active filter IDs.
| `getFilterConfig(id)`           | Returns the configuration for a specific filter ID.
| `getAllKnownFilters()`          | Returns all registered filter configurations.

### Filter Definition

Each filter object supports the following properties:

| Property     | Type      | Description
|--------------|-----------|-----------------------------------------------
| `id`         | `string`  | Unique identifier for the filter.
| `name`       | `string`  | Display name for the filter.
| `group`      | `string`  | Optional group name for mutual exclusion.
| `exclusive`  | `boolean` | When `true`, activating this filter deactivates other filters in the same group.
| `reset`      | `boolean` | When `true`, activating this filter clears all other filters in its group.

---

## I18N

The `I18N` singleton provides internationalization support with automatic browser language detection and module-scoped translation keys.

### Methods

| Method                              | Description
|-------------------------------------|--------------------------------------------------------------
| `register(lang, module, values)`    | Registers a key-value map of translations for a language and module.
| `setLanguage(language)`             | Sets the current language code.
| `translate(key)`                    | Returns the translated text for a key. Supports `module:key` syntax with English fallback.

### Usage

```javascript
// register translations
webexpress.webui.I18N.register("en", "myapp", {
    "greeting": "Hello",
    "farewell": "Goodbye"
});

webexpress.webui.I18N.register("de", "myapp", {
    "greeting": "Hallo",
    "farewell": "Auf Wiedersehen"
});

// retrieve translation with module prefix
const text = webexpress.webui.I18N.translate("myapp:greeting"); // "Hello" or "Hallo"
```

Within controls that extend `Ctrl`, use the built-in `_i18n` helper:

```javascript
const label = this._i18n("webexpress.webui:calendar.may", "May");
```

---

## Syntax

The `Syntax` singleton manages registration and retrieval of syntax-highlighting configurations for different programming languages.

### Methods

| Method                                | Description
|---------------------------------------|--------------------------------------------------------------
| `register(language, alias, syntax)`   | Registers a syntax configuration for a language and optional alias.
| `get(language)`                       | Returns the syntax configuration for a language, or `null`.

### Usage

```javascript
webexpress.webui.Syntax.register("javascript", "js", {
    keywords: ["const", "let", "var", "function", "return"],
    types: ["string", "number", "boolean"],
    // ...
});

const config = webexpress.webui.Syntax.get("js"); // same as get("javascript")
```

---

## EditorPlugins

The `EditorPlugins` singleton is a priority-based registry for WYSIWYG editor plugins. Each plugin can provide lifecycle hooks for toolbar creation, content change handling, and context menus.

### Methods

| Method                                    | Description
|-------------------------------------------|--------------------------------------------------------------
| `register(name, definition)`              | Registers a plugin with default position (10).
| `register(name, position, definition)`    | Registers a plugin with an explicit position for ordering.
| `getAll()`                                | Returns all plugin definitions sorted by position.

### Plugin Definition

```javascript
webexpress.webui.EditorPlugins.register("my-plugin", 500, {
    init: function (editor) { },
    createToolbar: function (editor) { return document.createElement("div"); },
    onContentChange: function (editor) { },
    getContextMenuItems: function (editor, target) { return []; }
});
```

---

## EditorAddOns

The `EditorAddOns` singleton manages editor add-ons that can be inserted into content via the editor add-ons plugin.

### Methods

| Method                          | Description
|---------------------------------|--------------------------------------------------------------
| `register(id, definition)`     | Registers an add-on with properties like `label`, `icon`, `category`, and `renderer`.
| `get(id)`                      | Returns the add-on definition, or `undefined`.
| `getAll()`                     | Returns all registered add-on definitions.
| `unregister(id)`               | Removes an add-on. Returns `true` if removed.
| `clear()`                      | Clears all registered add-ons.

---

## DialogPanels

The `DialogPanels` singleton stores panel definitions by a modal key. Multiple panels can be registered under the same key.

### Methods

| Method                          | Description
|---------------------------------|--------------------------------------------------------------
| `register(modalKey, panel)`     | Registers a panel definition under a modal key.
| `get(modalKey)`                 | Returns all panel definitions for a key (shallow copies).
| `unregister(modalKey)`          | Removes all panels registered under a key.
| `clear()`                      | Clears the entire registry.

---

## DashboardWidgets

The `DashboardWidgets` singleton manages dashboard widget definitions.

### Methods

| Method                          | Description
|---------------------------------|--------------------------------------------------------------
| `register(id, definition)`     | Registers a widget with a unique ID and definition.
| `get(id)`                      | Returns the widget definition, or `null`.
| `getAll()`                     | Returns all registered widget definitions.

---

## TableTemplates

The `TableTemplates` singleton provides a central registry for table cell renderer templates. Each template is a function that receives cell data and returns a DOM node or string.

### Methods

| Method                                          | Description
|-------------------------------------------------|--------------------------------------------------------------
| `register(type, rendererFn, defaultOptions?)`   | Registers a renderer function for a cell type (e.g., `"date"`, `"currency"`).
| `get(type)`                                     | Returns `{ fn, options }` for the given type, or `null`.
| `has(type)`                                     | Returns `true` if a renderer is registered for the type.
| `unregister(type)`                              | Removes a renderer by type.
| `clear()`                                       | Clears the entire registry.

### Usage

```javascript
webexpress.webui.TableTemplates.register("currency", function (val, table, row, cell, name, opts) {
    const span = document.createElement("span");
    span.textContent = parseFloat(val).toFixed(opts.decimals || 2) + " " + (opts.symbol || "€");
    return span;
}, { decimals: 2, symbol: "€" });
```

---

## Ctrl

The `Ctrl` class is the abstract base class for all WebExpress.WebUI controls. It provides common lifecycle methods and utility functions. It cannot be instantiated directly.

### Methods

| Method                              | Description
|-------------------------------------|--------------------------------------------------------------
| `render()`                          | Renders the control. Must be implemented in the derived class.
| `update()`                          | Updates the control. By default calls `render()`.
| `destroy()`                         | Destroys the control and performs cleanup.
| `_detachElement(element)`           | Detaches an element from the DOM while preserving event listeners.
| `_dispatch(type, detail)`           | Dispatches a custom event from the control's element.
| `_i18n(key, fallback)`             | Returns the translated text for an i18n key, or the fallback.
| `_isVisible()`                      | Returns `true` if the control's element is currently visible.

### Usage

```javascript
webexpress.webui.MyCtrl = class extends webexpress.webui.Ctrl {
    constructor(element) {
        super(element);
        this.render();
    }

    render() {
        this._element.innerHTML = "<p>" + this._i18n("myapp:hello", "Hello") + "</p>";
    }
}

// register the control for automatic instantiation
webexpress.webui.Controller.registerClass("wx-webui-myctrl", webexpress.webui.MyCtrl);
```

---

## PopperCtrl

The `PopperCtrl` class extends `Ctrl` and provides base functionality for controls that use [Popper.js](https://popper.js.org/) for positioning dropdown menus.

### Methods

| Method                                              | Description
|-----------------------------------------------------|--------------------------------------------------------------
| `_initializePopper(container, dropdownmenu)`        | Initializes Popper.js for a dropdown menu. Sets up click-outside and ESC-key handlers.

The initialized dropdown menu receives `show()` and `hide()` methods for programmatic control. Events `DROPDOWN_SHOW_EVENT` and `DROPDOWN_HIDDEN_EVENT` are dispatched accordingly.

---

## Event

The `Event` class defines all event name constants used across the framework. Use these constants when dispatching or listening for events.

### Constants

| Constant                    | Value                                        | Description
|-----------------------------|----------------------------------------------|----------------------------------------------
| `CHANGE_VISIBILITY_EVENT`   | `webexpress.webui.change.visibility`         | Visibility of an element changed.
| `CLICK_EVENT`               | `webexpress.webui.click`                     | An element was clicked.
| `DOUBLE_CLICK_EVENT`        | `webexpress.webui.dbclick`                   | An element was double-clicked.
| `CHANGE_FILTER_EVENT`       | `webexpress.webui.change.filter`             | A filter state changed.
| `DROPDOWN_SHOW_EVENT`       | `webexpress.webui.dropdown.show`             | A dropdown menu was shown.
| `DROPDOWN_HIDDEN_EVENT`     | `webexpress.webui.dropdown.hidden`           | A dropdown menu was hidden.
| `CHANGE_FAVORITE_EVENT`     | `webexpress.webui.change.favorite`           | A favorite state changed.
| `COLUMN_REORDER_EVENT`      | `webexpress.webui.table.column.reorder`      | Table columns were reordered.
| `COLUMN_SEARCH_EVENT`       | `webexpress.webui.table.column.search`       | A search/filter was applied to a column.
| `ROW_REORDER_EVENT`         | `webexpress.webui.table.row.reorder`         | Table rows were reordered.
| `SELECT_ROW_EVENT`          | `webexpress.webui.table.select.row`          | A table row was selected.
| `TABLE_SORT_EVENT`          | `webexpress.webui.table.sorted`              | A table was sorted.
| `CHANGE_VALUE_EVENT`        | `webexpress.webui.change.value`              | The value of an input or control changed.
| `MOVE_EVENT`                | `webexpress.webui.move`                      | An item was moved.
| `CHANGE_PAGE_EVENT`         | `webexpress.webui.change.page`               | The page in a pagination control changed.
| `MODAL_SHOW_EVENT`          | `webexpress.webui.modal.show`                | A modal was shown.
| `MODAL_HIDE_EVENT`          | `webexpress.webui.modal.hide`                | A modal was hidden.
| `DATA_REQUESTED_EVENT`      | `webexpress.webui.data.requested`            | Data was requested.
| `DATA_ARRIVED_EVENT`        | `webexpress.webui.data.arrived`              | Requested data has arrived.
| `TASK_START_EVENT`           | `webexpress.webui.task.start`                | A task started.
| `TASK_UPDATE_EVENT`          | `webexpress.webui.task.update`               | A task was updated.
| `TASK_FINISH_EVENT`          | `webexpress.webui.task.finish`               | A task finished.
| `SIZE_CHANGE_EVENT`         | `webexpress.webui.size.change`               | The size of an element changed.
| `HIDE_EVENT`                | `webexpress.webui.hide`                      | An element was hidden.
| `SHOW_EVENT`                | `webexpress.webui.show`                      | An element was shown.
| `UPDATED_EVENT`             | `webexpress.webui.updated`                   | An element was updated.
| `ADD_EVENT`                 | `webexpress.webui.add`                       | An item was added.
| `REMOVE_EVENT`              | `webexpress.webui.remove`                    | An item was removed.
| `START_INLINE_EDIT_EVENT`   | `webexpress.webui.inlineedit.start`          | Inline editing started.
| `SAVE_INLINE_EDIT_EVENT`    | `webexpress.webui.inlineedit.save`           | Inline editing was saved.
| `END_INLINE_EDIT_EVENT`     | `webexpress.webui.inlineedit.end`            | Inline editing ended.
| `FILE_SELECTED_EVENT`       | `webexpress.webui.file.selected`             | A file was selected.
| `UPLOAD_SUCCESS_EVENT`      | `webexpress.webui.upload.success`            | A file upload completed successfully.
| `UPLOAD_ERROR_EVENT`        | `webexpress.webui.upload.error`              | A file upload failed.
| `UPLOAD_PROGRESS_EVENT`     | `webexpress.webui.upload.progress`           | Upload progress was updated.
| `TILE_SEARCH_EVENT`         | `webexpress.webui.tile.search`               | A tile search was performed.
| `TILE_SORT_EVENT`           | `webexpress.webui.tile.sort`                 | Tiles were sorted.
| `BREAKPOINT_CHANGE_EVENT`   | `webexpress.webui.breakpoint.change`         | A responsive breakpoint changed.
| `WS_OPEN_EVENT`             | `webexpress.webui.websocket.open`            | A WebSocket connection was opened.
| `WS_MESSAGE_EVENT`          | `webexpress.webui.websocket.message`         | A WebSocket message was received.
| `WS_CLOSE_EVENT`            | `webexpress.webui.websocket.close`           | A WebSocket connection was closed.
| `WS_ERROR_EVENT`            | `webexpress.webui.websocket.error`           | A WebSocket error occurred.
| `SELECT_ITEM_EVENT`         | `webexpress.webui.select.item`               | An item was selected.
| `UPDATE_PAGINATION_EVENT`   | `webexpress.webui.update.pagination`         | Pagination was updated.
| `SELECTED_TAB_EVENT`        | `webexpress.webui.tab.selected`              | A tab was selected.

### Usage

```javascript
// listen for an event
document.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, (e) => {
    console.log("Value changed:", e.detail);
});

// dispatch an event from a control
this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: selectedItem });
```
