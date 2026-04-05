![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# ColorCtrl

The `ColorCtrl` component provides a read-only color display that renders a color swatch and an optional tooltip. It is intended solely for visualization of color values defined via dataset attributes on the host element. The implementation is intentionally minimal and does not provide selection or editing capabilities, making the control suitable for design previews, read-only form views, and style guides.

```
   ┌─────┐
   │ Red │
   └─────┘
```

## Configuration

Configuration is performed via dataset attributes on the host element:

|Attribute      |Description                                                                                    
|---------------|-----------------------------------------------------------------------------------------------
|`data-value`   |Initial color value as a hex string (for example `#ff0000`). Default is `#000000`.
|`data-tooltip` |Optional tooltip text that will be used as the `title` attribute on the swatch.

The host element automatically receives the CSS class `wx-color`. Visual appearance and sizing are controlled by external stylesheets targeting `.wx-color` and its child DIV.

## Functionality

The control renders a single DIV whose background color reflects the current color value. If a tooltip is configured, it is applied as the DIV title. The control is strictly presentational and handles no user-driven color changes. Programmatic updates applied via the API are reflected immediately in the rendered swatch.

Main behaviors:
- initial read of `data-value` / `data-color` and optional `data-tooltip`
- rendering of a single swatch DIV with the configured color
- immediate visual update when `value` or `tooltip` is changed programmatically

## Programmatic Control

The component exposes a small, explicit API for reading and updating the displayed color and tooltip.

### Accessing an Automatically Created Instance

When the framework instantiates the controller automatically, the instance can be retrieved via the framework registry and read or updated using vanilla JavaScript:

```javascript
// find the host element
var el = document.getElementById('color1');

// retrieve the controller instance created by the framework
var ctrl = webexpress.webui.Controller.getInstanceByElement(el);

// read current value
var current = ctrl ? ctrl.value : null;

// set new value and tooltip
if (ctrl) {
    ctrl.value = '#ff5722';
    ctrl.tooltip = 'Warning color';
}
```

### Manual Instantiation

Manual instantiation is supported for direct programmatic use:

```javascript
var el = document.getElementById('color-manual');
var ctrl = new webexpress.webui.ColorCtrl(el);

// update value programmatically
ctrl.value = '#1e90ff';
ctrl.tooltip = 'Primary color';
```

## Events

The ColorCtrl does not dispatch custom DOM or framework events when its value changes. Consumers can observe changes by directly querying the controller instance (`ctrl.value`) or by implementing an external observer pattern if event-driven notifications are required.

## Use Case Example

Static usage inside HTML:

```html
<div id="color1" class="wx-webui-color" data-value="#1e90ff" data-tooltip="Primary color"></div>
```

Programmatic control example:

```javascript
var el = document.getElementById('color1');
var ctrl = new webexpress.webui.ColorCtrl(el);
ctrl.value = '#ff8a65';
ctrl.tooltip = 'Accent color';
```

# InputColorCtrl

The `InputColorCtrl` component implements a compact color picker presented as a dropdown with a visual preview. In collapsed state only a color preview box is shown. The opened dropdown contains a grid of predefined colors plus an embedded native color input for custom selection. A hidden input element is created for form submission, making the control suitable for form scenarios while keeping the UI compact.

```
   ┌───────────────────────────────┐
   │ Red                          ▼│  // Display area with selected color chips
   └───────────────────────────────┘
   ┌───────────────────────────────┐
   │ [■] Red        [■] Coral      │  // palette
   │ [■] Green      [■] Yellow     │
   │ [■] Indigo     [■] DodgerBlue │  // native color picker integrated
   │ [ color picker ]              │  
   └───────────────────────────────┘
```

## Configuration

The control is configured through attributes and dataset entries on the host element:

|Attribute      |Description                                                                                    
|---------------|-----------------------------------------------------------------------------------------------
|`name`         |Used for the created hidden input so the selected value is submitted with forms.
|`data-value`   |Initial hex color value (e.g. `#00ff00`). If omitted, the default `#000000` is used.
|`disabled`     |When present, interaction is blocked and relevant UI elements are visually disabled.
|`data-palette` |Optional JSON string representing an array of hex color strings to override the default palette (for example `data-palette='["#ff0000","#00ff00"]'`). Invalid JSON is ignored and the default palette remains in use.

Relevant CSS classes set by the control: `wx-color-input` (host), `wx-color-trigger` (dropdown trigger), `wx-color-preview-box` (preview), `wx-color-dropdown` (dropdown container), `wx-color-palette-grid` (palette grid), and `wx-native-color-picker` (native color input).

## Functionality

The component presents a preview and dropdown containing selectable color swatches and a native color input. Interaction model and behavior:

- Clicking the preview toggles the dropdown unless the control is disabled.
- The dropdown shows a grid of predefined color swatches. Clicking a swatch sets the value and closes the dropdown.
- The final grid item hosts a native `<input type="color">` picker. `input` events update the preview live; `change` closes the dropdown.
- A hidden input element with the configured `name` holds the current hex value for form submission.
- The palette can be customized with `data-palette`; invalid JSON is logged and ignored.
- Validation accepts hex formats `#RGB` and `#RRGGBB`. Short form `#RGB` is expanded to `#RRGGBB` before being applied to the native picker.

Disabled state:
- When `disabled` is present on the host element, interactive elements (palette buttons, native picker) are disabled and the dropdown will not open.

## Programmatic Control

The control exposes `value` as a get/set property and a `render()` method that synchronizes UI with internal state. Value changes trigger a framework change event.

### Accessing an Automatically Created Instance

When instantiated by the framework, the instance can be accessed and controlled with vanilla JavaScript:

```javascript
// find the host element
var el = document.getElementById('color-input-1');

// retrieve the controller instance created by the framework
var ctrl = webexpress.webui.Controller.getInstanceByElement(el);

// read current color
var current = ctrl ? ctrl.value : null;

// set new color (must be valid hex)
if (ctrl) {
    ctrl.value = '#00bcd4';
}
```

### Manual Instantiation

Manual creation and configuration example:

```javascript
var el = document.getElementById('color-input-manual');
var ctrl = new webexpress.webui.InputColorCtrl(el);

// set color programmatically
ctrl.value = '#ffeb3b';

// force re-render if required
ctrl.render();
```

## Events

The control dispatches both native and framework-specific events:

- `webexpress.webui.Event.CHANGE_VALUE_EVENT` — emitted after the value changes; payload conventionally contains `{ value: '#rrggbb' }`.
- `webexpress.webui.Event.DROPDOWN_SHOW_EVENT` — emitted when the dropdown is shown.
- `webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT` — emitted when the dropdown is hidden.

Additionally, the dropdown element emits native `show` and `hide` events when opening and closing.

Example listener for value changes:

```javascript
var el = document.getElementById('color-input-1');
el.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, function (e) {
    var newVal = e.detail && e.detail.value ? e.detail.value : (webexpress.webui.Controller.getInstanceByElement(el) || {}).value;
    console.log('color changed to', newVal);
});
```

## Use Case Example

Form integration with a custom palette:

```html
<form action="/save" method="post">
  <div id="favColor"
       class="wx-webui-input-color"
       name="favoriteColor"
       data-value="#ff8a65"
       data-palette='["#ff0000","#00ff00","#0000ff","#ff8a65","#1e90ff"]'></div>

  <button type="submit">Save</button>
</form>
```

Minimal standalone example:

```html
<div id="color-input-1" class="wx-webui-input-color" data-value="#00bcd4"></div>
<script>
  var el = document.getElementById('color-input-1');
  var ctrl = webexpress.webui.Controller.getInstanceByElement(el);
  el.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, function (e) {
      console.log('selected color changed', e.detail ? e.detail.value : ctrl.value);
  });
</script>
```