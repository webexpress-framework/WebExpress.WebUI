![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# SmartViewCtrl

The `SmartViewCtrl` is a display-only component that acts as a read-only wrapper around other form controls or simple markup. Its primary purpose is to extract the value from an inner element (like an editor, a select dropdown, or an input field) and render a static, non-interactive representation of that value.

This control is ideal for "summary" or "review" pages where you want to display the data that a user has entered in a form, using the same rendering logic as the original control but without the editing capabilities.

## Functionality

- **Value Extraction**: On initialization, `SmartViewCtrl` inspects its child element to determine the best way to extract its value. It can intelligently pull data from:
    - Other WebExpress WebUI controls (e.g., `EditorCtrl`, `SelectionCtrl`, `TagCtrl`).
    - Standard HTML form elements (`<input>`, `<textarea>`, `<select>`).
    - Elements with a `data-value` attribute.
    - As a last resort, the `textContent` of the child element.
- **Read-Only Rendering**: The component replaces its content with a clone of its child element, effectively presenting a static snapshot. It does not provide any inline editing capabilities or dispatch events related to editing.
- **Programmatic Updates**: While the view is read-only for the user, the displayed value can be updated programmatically by setting the `value` property on the `SmartViewCtrl` instance. When the value is set, the component attempts to update the underlying control (if it's a known WebUI control) before re-rendering its view.

## Configuration

The `SmartViewCtrl` is configured by wrapping it around the element you wish to display. There are no specific `data-` attributes for the wrapper itself; its behavior is determined entirely by its child content.

## Programmatic Control

The value of the `SmartViewCtrl` can be accessed and modified through its JavaScript instance.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-smart-view');

// retrieve the controller instance associated with the element
const smartViewCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (smartViewCtrl) {
    // get the extracted value
    const currentValue = smartViewCtrl.value;

    // set a new value programmatically
    // this will update the inner control (if possible) and re-render the view
    smartViewCtrl.value = 'New value to display';
}
```

## Use Case Example

Imagine you have a form with a `SelectionCtrl` for picking a category. On a confirmation page, you can use `SmartViewCtrl` to display the selected category without making it editable.

**Form Page (Interactive):**
```html
<div id="category-selector" class="wx-webui-input-selection" name="category">
    <div id="cat-1" class="wx-selection-item">Category 1</div>
    <div id="cat-2" class="wx-selection-item">Category 2</div>
</div>
```

**Confirmation Page (Read-Only Display):**
```html
<!--
    The SmartViewCtrl wraps the same control definition.
    It will automatically extract the value ("cat-1" or "cat-2")
    and display the corresponding read-only selection tag.
-->
<div id="category-display" class="wx-webui-smart-view">
    <div class="wx-webui-selection" data-value="cat-2">
        <div id="cat-1" class="wx-selection-item">Category 1</div>
        <div id="cat-2" class="wx-selection-item">Category 2</div>
    </div>
</div>
```