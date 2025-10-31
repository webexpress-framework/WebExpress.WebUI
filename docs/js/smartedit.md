![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# SmartEditCtrl

The `SmartEditCtrl` is a versatile control for in-line editing of values directly within HTML elements. It extends the functionality of conventional display elements with the ability to edit these values comfortably and without changing the editing context. When hovering over a target element with the mouse, a pencil icon appears to the right of the content, which serves as an edit button. A click on the pencil opens an editor form at that exact position, allowing the values to be edited. The input can either be accepted and saved or canceled. The choice of editor is flexible and can be customized, allowing for the use of simple text fields or specialized components like a code editor.

```
   ┌──────────────────────────────────────────┐
   │ [Value]                           [Edit] │
   └──────────────────────────────────────────┘
```

Configuration is done declaratively via `data-*` attributes on the HTML element.

| Attribute          | Description
|--------------------|--------------------------------------------------------------------------
| `data-object-id`   | The ID of the data object being edited.
| `data-object-name` | The name of the data object being edited.
| `data-form-action` | The URL to which the form data is sent upon saving.
| `data-form-method` | The HTTP method for the request (e.g., `PUT`, `POST`). Defaults to `PUT`.

### Functionality

The control operates autonomously and manages the entire editing workflow:

- **Dynamic DOM Manipulation**: Upon initialization, the target element is equipped with mouse events, so the pencil icon is shown on mouseover and removed on mouseout. A double-click also initiates editing.
- **Editor Integration**: After clicking the pencil, the original display content is temporarily replaced by a form containing the editor and control buttons (Save, Cancel). The editor component is the first child element of the `wx-webui-smart-edit` container, allowing for flexible integration of different editor types.
- **State Management and Events**: During editing, the element is protected by the internal reference `_activeEdit`, ensuring that only one edit can be active at a time. After editing is complete—whether by saving or canceling—the original display is restored, and corresponding events are dispatched.
- **Application Integration**: Changes are communicated to the application via a `fetch` request to the configured endpoint. The control dispatches the following global custom events on the `document`:
    - `webexpress.webui.Event.START_INLINE_EDIT_EVENT`: Fired when editing begins.
    - `webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT`: Fired when a value is successfully saved.
    - `webexpress.webui.Event.END_INLINE_EDIT_EVENT`: Fired when editing finishes (regardless of save or cancel).

### Programmatic Control

The component supports full control via JavaScript after initialization.

#### Accessing an Automatically Generated Instance

For controls defined declaratively in HTML, a central `webexpress.webui.Controller` instance is created automatically. Use `getInstanceByElement(element)` for access.

```javascript
const element = document.getElementById('my-editable-text');
const smartEditCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (smartEditCtrl) {
    // Programmatically interact with the instance, e.g., read the value
    console.log('Current value:', smartEditCtrl.getValue(element));
}
```

#### Manual Instantiation

A `SmartEditCtrl` can also be created programmatically, for example, when content is loaded at runtime.

```javascript
const container = document.getElementById('dynamic-edit-container');
// Ensure the container has the required structure (e.g., an editor element as a child).
const dynamicEditCtrl = new webexpress.webui.SmartEditCtrl(container);
```

### Event Handling

The `SmartEditCtrl` component emits global events for user interactions and state changes.

- **`webexpress.webui.Event.START_INLINE_EDIT_EVENT`**: Fired when editing begins. `event.detail` contains the sender and the current value.
- **`webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT`**: Fired after a value has been successfully saved via the API.
- **`webexpress.webui.Event.END_INLINE_EDIT_EVENT`**: Fired when editing is finished.

```javascript
document.addEventListener(webexpress.webui.Event.START_INLINE_EDIT_EVENT, (e) => {
    console.log(`Editing started for element #${e.detail.id} with value:`, e.detail.value);
});

document.addEventListener(webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT, (e) => {
    console.log(`Element #${e.detail.id} was saved.`);
    // A notification could be shown to the user here, for example.
});
```

### HTML Usage Example

To use the control, wrap your editor element within a container and assign it the class `wx-webui-smart-edit`.

```html
<!--
    An element that can be edited with SmartEditCtrl.
    The inner `div` with a `data-controller-class` will be used as the editor.
-->
<div id="my-editable-text"
     class="wx-webui-smart-edit"
     data-form-action="/api/update/item"
     data-form-method="PUT"
     data-object-id="123">
    <div data-controller-class="wx-webui-EditorCtrl">
        <!-- Initial value displayed to the user -->
        This is the editable value.
    </div>
</div>
```

This control provides an efficient, user-friendly inline editing experience in web applications.