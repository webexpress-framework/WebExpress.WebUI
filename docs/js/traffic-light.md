![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# TrafficLightCtrl

The `TrafficLightCtrl` family visualizes a status by lighting one of three lamps — red, yellow or green. It comes in two client-side flavours that share the same markup and lamp tokens:

- **`TrafficLightCtrl`** (`wx-webui-traffic-light`) — a read-only indicator for displaying a state.
- **`InputTrafficLightCtrl`** (`wx-webui-input-traffic-light`) — an interactive form input that lets the user pick a state and submits it through a hidden field.

A third, server-side companion, the `traffic-light` table template, renders either variant inside a table cell.

```
   ┌─────┐
   │  ●  │   red
   │  ○  │   yellow
   │  ○  │   green
   └─────┘
```

## Values

Both controls operate on a small, culture-independent set of lamp tokens:

| Token     | Meaning
|-----------|------------------------------------------------
| `off`     | No lamp is lit (the control is dark).
| `red`     | Stop, error or critical state.
| `yellow`  | Warning or transitional state.
| `green`   | Ok or ready state.

Unknown or empty tokens are normalized to `off`, so a malformed value never throws.

## Configuration

Initialization is handled declaratively through `data-` attributes on the host element.

| Attribute          | Applies to      | Description
|--------------------|-----------------|------------------------------------------------------------------------------
| `data-value`       | both            | The initial lamp token (`off`, `red`, `yellow`, `green`).
| `data-orientation` | both            | (Optional) `vertical` (default) stacks the lamps; `horizontal` lines them up.
| `data-tooltip`     | read-only       | (Optional) Native tooltip describing the current state.
| `data-allow-off`   | input           | (Optional) `false` prevents clearing back to `off`; defaults to `true`.

- **Size**: The lamps are scaled through a single `--wx-tl-size` custom property. The default is intentionally compact; the `ControlTrafficLight.Size` property (and its WebApp / template counterparts) emit one of the modifier classes `.wx-traffic-light-xs`, `.wx-traffic-light-sm`, `.wx-traffic-light-lg` or `.wx-traffic-light-xl`.
- **Theme**: The housing is bright in light mode and switches to the classic dark casing under `[data-bs-theme="dark"]`, so the control follows the page theme automatically.
- **CSS Classes**: Both controls add the class `.wx-traffic-light` to the host element; the horizontal layout adds `.wx-traffic-light-horizontal`.
- **Accessibility**: The read-only control exposes `role="img"`, `aria-readonly="true"` and a generated `aria-label`. The input control exposes the lamps as a `radiogroup` with `aria-checked` state and roving `tabindex`.

## Functionality

- **Read-Only Display**: `TrafficLightCtrl` renders a housing with three lamps and lights the one matching the current value. There is no interaction.
- **Interactive Selection**: `InputTrafficLightCtrl` lets the user pick a lamp by mouse or keyboard. Clicking the lit lamp clears the selection when `data-allow-off` is not `false`.
- **Keyboard Support**: `ArrowUp`/`ArrowDown` (and `ArrowLeft`/`ArrowRight`) move focus between lamps, `Home`/`End` jump to the first/last lamp, `Enter`/`Space` select the focused lamp, and `Escape` clears the selection when clearing is allowed.
- **Form Submission**: The input writes the selected token to a hidden input; `off` is submitted as an empty string.
- **Events**: The input control dispatches `webexpress.webui.Event.CHANGE_VALUE_EVENT` whenever the value changes.

## Programmatic Control

The value of either control can be read and written through its JavaScript instance.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('build-status');

// retrieve the controller instance associated with the element
const trafficLight = webexpress.webui.Controller.getInstanceByElement(element);

if (trafficLight) {
    // read the current state
    const state = trafficLight.value; // e.g. "green"

    // set a new state; the matching lamp lights up immediately
    trafficLight.value = "red";
}
```

### Manual Instantiation

```javascript
// find the container element
const container = document.getElementById('dynamic-status');

// configure the initial state before instantiation
container.dataset.value = "yellow";
container.dataset.orientation = "horizontal";

// create a read-only traffic light manually
const trafficLight = new webexpress.webui.TrafficLightCtrl(container);

// update the value later
trafficLight.value = "green";
```

## Use Case Example

The following example declares a read-only traffic light showing a green status.

```html
<!--
    The host element defines the traffic light control.
    It will display three lamps with the green lamp lit.
-->
<div id="build-status"
     class="wx-webui-traffic-light"
     data-value="green">
</div>
```

And the interactive input variant, used inside a form:

```html
<div id="severity"
     class="wx-webui-input-traffic-light"
     name="severity"
     data-value="yellow">
</div>
```
