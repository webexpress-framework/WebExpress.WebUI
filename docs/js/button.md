![WebExpress-Framework](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# ButtonCtrl

The `ButtonCtrl` component represents a foundational UI component that renders a versatile button. It supports text labels, icons, and images, allowing for a wide range of visual representations. The component is designed for declarative initialization directly within the HTML markup, using `data-` attributes for configuration. This approach simplifies integration and promotes clean, readable code. By utilizing standard class names for styling, such as for color and size, it integrates seamlessly with CSS frameworks.

```
   ┌────────────────┐
   │ [icon] [label] │
   └────────────────┘
```

## Declarative Configuration

The initial state and appearance of the button are defined using standard HTML attributes and `data-` attributes on the host element (e.g., `<button>` or `<a>`). The text for the button is taken from the element's inner content.

| Attribute    | Description                                                                        | Example
|--------------|------------------------------------------------------------------------------------|---------------------------------
| `data-icon`  | Specifies the CSS class for an icon to be displayed on the button.                 | `data-icon="fas fa-save"`
| `data-image` | Provides the URL for an image to be displayed on the button.                       | `data-image="/path/to/icon.png"`
| `data-color` | Applies a color-related CSS class, typically from a framework.                     | `data-color="btn-primary"`
| `data-size`  | Applies a size-related CSS class.                                                  | `data-size="btn-sm"`
| `disabled`   | A standard boolean attribute to render the button in a disabled state.             | `<button disabled>...</button>`
| Text Content | The text label for the button is defined by the inner content of the HTML element. | `<button>Click Me</button>`

Icons, images, and text labels can be used in any combination to achieve the desired appearance.

## Programmatic Control

Once initialized, the properties of the button can be accessed and modified programmatically through its controller instance. Changes to properties like `label`, `icon`, or `color` will automatically trigger a re-render of the component.

### Accessing an Automatically Created Instance

For buttons defined declaratively in HTML, the associated instance is retrieved via the `getInstanceByElement(element)` method of the central `webexpress.webui.Controller`.

```javascript
// find the host element in the DOM
const buttonElement = document.getElementById('myButton');

// retrieve the controller instance associated with the element
const buttonCtrl = webexpress.webui.Controller.getInstanceByElement(buttonElement);

// change the label and icon programmatically
if (buttonCtrl) {
    buttonCtrl.label = 'Updated Label';
    buttonCtrl.icon = 'fas fa-check';
}
```

### Manual Instantiation

A button can also be created entirely programmatically and attached to a host element. This is useful for dynamic UI scenarios.

```javascript
// find the container element for the dynamic button
const container = document.getElementById('button-container');

// create a new instance of ButtonCtrl manually
const dynamicButtonCtrl = new webexpress.webui.ButtonCtrl(container);
```

## Events

The component dispatches a single, standardized event to notify the application of user interaction.

- **`webexpress.webui.Event.CLICK_EVENT`**: This event is fired when the user clicks the button. The event `detail` object contains a reference to the sender element.

## Use Case Examples

The following examples illustrate the declarative configuration for various button styles.

```html
<!-- A standard button with an icon and text -->
<button id="save-button" class="wx-webui-button" data-icon="fas fa-save" data-color="btn-primary">
    Save
</button>

<!-- A button with an icon only, useful for toolbars -->
<button id="settings-button" class="wx-webui-button" data-icon="fas fa-cog" data-size="btn-sm" title="Settings">
</button>

<!-- A disabled button -->
<button id="disabled-button" class="wx-webui-button" data-icon="fas fa-trash" disabled>
    Delete
</button>
```