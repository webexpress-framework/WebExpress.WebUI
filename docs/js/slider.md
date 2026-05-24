![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# InputSliderCtrl

The `InputSliderCtrl` component is a dual-handle range slider. In contrast to the single-handle `RangeCtrl` (which mirrors the native `<input type="range">`), `InputSliderCtrl` lets users pick an arbitrary sub-interval bounded by two handles. The selected interval is highlighted by a colored band that visually connects the lower and the upper handle.

The numeric scale of the slider is generic: by combining the `step` size with a unit hint (`number`, `temperature`, `percent`, `duration`, `time`, or any custom suffix) the same control supports plain numbers, temperatures, percentages, durations, and clock times.

```
   ┌──────────────────────────────────────────────────┐
   │  ---●════════════════════════════════════●------ │
   │     ↑                                    ↑       │
   │     20 °C                                72 °C   │
   └──────────────────────────────────────────────────┘
```

## Configuration

The slider configures itself entirely from `data-` attributes on the host element. The server-side `ControlFormItemInputSlider` writes these attributes during rendering; from the JavaScript side the contract is purely declarative — no init call is required.

| Attribute            | Description
|----------------------|--------------------------------------------------------------------------------------
| `data-min`           | (Optional) The lower bound of the track. Defaults to `0`.
| `data-max`           | (Optional) The upper bound of the track. Defaults to `100`. Always greater than `data-min`.
| `data-step`          | (Optional) The grid the handles snap to. Defaults to `1`. Must be greater than `0`.
| `data-value-min`     | (Optional) The initial value of the lower handle. Clamped into `[min, max]`.
| `data-value-max`     | (Optional) The initial value of the upper handle. Clamped into `[min, max]`.
| `data-unit`          | (Optional) Unit identifier used to pick a value-label formatter. Built-in: `number` (default), `temperature`, `percent`, `duration`, `time`. Anything else is treated as a literal suffix.
| `data-show-labels`   | (Optional) Set to `false` to hide the per-handle value labels.

The handle / band color is **not** set via a data attribute. It is driven by a CSS class on the host element (`.wx-slider-color-*`) that the server-side `PropertyColorSlider` produces, or by an inline `style="--wx-slider-band-bg: ...; --wx-slider-handle-bd: ...;"` for user-defined colors.

- **CSS Classes**: The host element keeps the marker class `.wx-webui-input-slider` and gets `.wx-slider` once initialized. Track elements use `.wx-slider-track`, `.wx-slider-band`, `.wx-slider-handle-min`, `.wx-slider-handle-max`, `.wx-slider-label-min`, and `.wx-slider-label-max`.
- **Hidden Input**: The control creates a single hidden `<input>` carrying the wire-format value `min;max` (invariant culture). The server-side `ControlFormInputValueDualRange` parses this back into a typed value.
- **Accessibility**: Each handle exposes `role="slider"` plus `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext` so the current range is announced by screen readers.

## Functionality

The control covers the common interactions you expect from a modern range picker — drag, keyboard navigation, value snapping, and formatted labels. Validation hooks make it suitable for production forms.

- **Dual handles with band**: Drag the lower or upper handle. The connecting band updates in real-time and never crosses (handles bump into each other but cannot swap).
- **Snapping**: Handles snap to multiples of `step`, starting from `min`. Floating-point drift is suppressed automatically based on the decimals of `step`.
- **Keyboard support**: Arrow keys move by one `step`, Page Up/Page Down by ten steps, `Home` and `End` jump to the bounding partner handle / boundary.
- **Unit formatters**: Built-in formatters produce labels like `12 °C`, `25 %`, `1h 30m`, `08:45`. Unknown unit identifiers are appended verbatim (`12 kg`).
- **Form integration**: The hidden input is named after the control, so the standard form post mechanism delivers the `min;max` payload to the server.
- **Validation**: `validate()` returns a list of localized error messages when the current range is out of bounds, inverted, or unparseable.

## Programmatic Control

Beyond the declarative `data-` setup, the slider exposes a small JavaScript surface for runtime updates and observation. This is useful when the slider participates in a wider client-side workflow (for example, a chart that reflects the currently selected range).

### Accessing an Automatically Created Instance

The framework instantiates the control automatically as soon as a matching element enters the DOM. To talk to that instance, look it up via the global `webexpress.webui.Controller` registry.

```javascript
// find the host element in the DOM
const element = document.getElementById('temperature-range');

// retrieve the controller instance associated with the element
const slider = webexpress.webui.Controller.getInstanceByElement(element);

if (slider) {
    // read the current range
    const range = slider.value; // => { min: 18, max: 24 }

    // move only the upper handle
    slider.valueMax = 26;

    // replace the whole range at once
    slider.value = { min: 19, max: 25 };
}
```

### Listening for Changes

The slider raises a standard `CHANGE_VALUE_EVENT` whenever either handle moves. Subscribe to it to keep dependent UI (charts, summaries, hidden state) in sync.

```javascript
const element = document.getElementById('temperature-range');
element.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, (e) => {
    console.log('New range', e.detail.valueMin, e.detail.valueMax);
});
```

### Manual Instantiation

When you build the host element from JavaScript (e.g. in dynamically inserted markup that bypasses the framework's mutation observer), you can construct the controller yourself. Set the `data-` attributes before calling the constructor so they are picked up during initialization.

```javascript
const container = document.getElementById('dynamic-slider');
container.dataset.min = "0";
container.dataset.max = "60";
container.dataset.step = "5";
container.dataset.valueMin = "10";
container.dataset.valueMax = "45";
container.dataset.unit = "duration";

const slider = new webexpress.webui.InputSliderCtrl(container);
```

## Use Case Example

The following example walks through a typical declaration: a temperature slider with an explicit `min`/`max`, a half-degree step, and a custom color gradient supplied via an inline CSS-variable override.

```html
<!--
    The host element defines the slider control. Server-side this is produced
    by ControlFormItemInputSlider; the data attributes shown here are what the
    JavaScript component reads at boot time. The inline style overrides the
    color CSS variables - this is what PropertyColorSlider emits for a
    user-defined color (a TypeColorSlider system color would set a
    .wx-slider-color-* class instead).
-->
<div id="thermostat"
     class="wx-webui-input-slider"
     name="thermostat"
     style="--wx-slider-band-bg:linear-gradient(90deg, #28a745 0%, #dc3545 100%);--wx-slider-handle-bd:#dc3545;"
     data-min="10"
     data-max="30"
     data-step="0.5"
     data-value-min="18"
     data-value-max="22"
     data-unit="temperature">
</div>
```
