![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# InputEstimateCtrl

The `InputEstimateCtrl` component is an interactive form input for effort estimation. It renders a configurable scale of values as selectable chips and lets the user pick a single estimate. Unlike a free-form number field, it constrains the input to a known scale, which keeps estimates consistent across a team. The default scale is a rounded Fibonacci sequence, the established scale for agile story-point estimation.

The control owns a hidden input that carries the value back to the surrounding form, supports full keyboard navigation, and exposes its value programmatically.

```
   ┌─────────────────────────────────────────────┐
   │  ( 0 ) ( 1 ) ( 2 ) (·3·) ( 5 ) ( 8 ) ( 13 )  │
   └─────────────────────────────────────────────┘
```

## Configuration

Initialization is handled declaratively through `data-` attributes on the host element.

| Attribute          | Description
|--------------------|--------------------------------------------------------------------------------------
| `data-scale`       | (Optional) The comma-separated scale of non-negative integers, e.g. `1,2,3,5,8`. Defaults to the rounded Fibonacci sequence `0,1,2,3,5,8,13,20,40,100`.
| `data-value`       | (Optional) The initial estimate. Omit it to start with no chip selected.
| `data-allow-clear` | (Optional) When `true`, re-selecting the active chip clears the estimate.
| `data-colors-css`   | (Optional) The per-chip system colors as a pipe-separated, index-aligned list of CSS classes, e.g. `bg-success\|\|bg-danger`.
| `data-colors-style` | (Optional) The per-chip user colors as a pipe-separated, index-aligned list of inline styles, e.g. `\|background:#ffcc00;\|`.
| `name`             | The form field name written to the hidden input.

- **CSS Classes**: The component adds the class `.wx-estimate` to the host element and renders the chips inside a `.wx-estimate-container` radiogroup; each chip is a `.wx-estimate-chip`, and the active one carries `.active`. When per-chip colors are supplied the container also carries `.wx-estimate-colored`, which switches the active chip from a filled accent to a ring so the chip keeps its own color.
- **Accessibility**: The container is a `radiogroup`; each chip is a `radio` with `aria-checked`, and a roving `tabindex` makes the group a single tab stop.

## Functionality

- **Scale rendering**: One chip is rendered per scale value; an out-of-scale current value simply leaves no chip active until the user picks one.
- **Value normalization**: Values are parsed as non-negative integers. An empty or malformed value means no estimate (`null`).
- **Keyboard**: Arrow keys (and Home/End) move the focus across the chips, Enter or Space selects, and Escape clears when `allow-clear` is set.
- **Reactive updates**: Setting `value` programmatically moves the active chip, updates the hidden input and dispatches `webexpress.webui.Event.CHANGE_VALUE_EVENT`.

## Programmatic Control

The control's value can be read and written via its JavaScript instance.

### Accessing an Automatically Created Instance

```javascript
const element = document.getElementById('effort');
const ctrl = webexpress.webui.Controller.getInstanceByElement(element);

if (ctrl) {
    const current = ctrl.value;   // the selected estimate, or null
    ctrl.value = 8;               // select the "8" chip
}
```

### Manual Instantiation

```javascript
const container = document.getElementById('dynamic-estimate');
container.dataset.scale = "1,2,3,5,8,13";
container.dataset.value = "5";

const ctrl = new webexpress.webui.InputEstimateCtrl(container);
ctrl.value = 13;
```

## Authoring in C\#

The control is authored server-side through `ControlFormItemInputEstimate`, which emits the host element and its `data-` attributes. The `Scale` property is optional; omit it to use the Fibonacci default.

```csharp
new ControlFormItemInputEstimate("effort")
{
    Label = _ => "Story points",
    Scale = _ => [1, 2, 3, 5, 8, 13, 20, 40],
    AllowClear = _ => true,
    // one color per scale value, e.g. a green-to-red effort heat scale
    Colors = _ =>
    [
        new PropertyColorBackground(TypeColorBackground.Success),
        new PropertyColorBackground(TypeColorBackground.Info),
        new PropertyColorBackground("#ffcc00"),
        new PropertyColorBackground(TypeColorBackground.Warning),
        new PropertyColorBackground(TypeColorBackground.Danger)
    ]
};
```

The `Colors` are emitted as the two index-aligned `data-colors-*` lists above: a system color (such as `TypeColorBackground.Success`) becomes a CSS class, a user-defined color (such as `#ffcc00`) an inline style — exactly like the bar colors of the velocity chart.

## Use Case Example

The following example declares an estimate input with a custom scale and an initial estimate of 3.

```html
<!--
    The host element defines the estimate control.
    It offers the scale 1, 2, 3, 5, 8, 13 with 3 pre-selected.
-->
<div id="effort"
     class="wx-webui-input-estimate"
     name="effort"
     data-scale="1,2,3,5,8,13"
     data-value="3">
</div>
```
