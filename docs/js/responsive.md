![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# ResponsiveCtrl

The `ResponsiveCtrl` component provides a flexible way to dynamically show or hide panels in a container depending on its width. This enables adaptive layouts that respond to breakpoints, ensuring optimal content display across various device sizes.

```
   ┌─────────────────────────────┐
   │ [Panel ≥ 900px]             │
   └─────────────────────────────┘
   ┌─────────────────────────────┐
   │ [Panel ≥ 600px]             │
   └─────────────────────────────┘
   ┌─────────────────────────────┐
   │ [Panel ≥ 300px]             │
   └─────────────────────────────┘
   ┌─────────────────────────────┐
   │ [Fallback Panel < 300px]    │
   └─────────────────────────────┘
```

## Configuration

Initialization is declarative via child elements and `data-breakpoint` attributes on each panel. The component recognizes the following child element types:

| Element Class                   | Description
|---------------------------------|-------------------------------------------------------------
| `.wx-responsive-panel`          | A panel that is shown when its breakpoint is matched or exceeded
| `.wx-responsive-panel-fallback` | A fallback panel shown if no breakpoint matches

Each responsive panel must set the `data-breakpoint` attribute to define the minimum container width (in pixels) at which it becomes visible.

## Functionality

The component automatically manages which panel is visible, based on the container's current width:

- **Breakpoint Matching:** For each resize, the component checks all defined breakpoints. The panel with the largest matching breakpoint (less than or equal to the container width) is shown.
- **Fallback Panel:** If no breakpoint matches (the container is smaller than all defined breakpoints), the fallback panel is displayed if present.
- **Dynamic Observation:** The component observes container size changes using the ResizeObserver API and updates panel visibility in real-time.
- **Event Handling:** When the displayed panel changes due to a breakpoint switch, the `webexpress.webui.Event.BREAKPOINT_CHANGE_EVENT` is triggered. The event includes the active breakpoint value (or `null` if fallback is shown).

## Programmatic Control

The control exposes simple programmatic methods for integration:

- `refresh()`: Forces a re-evaluation of the container size and updates panel visibility.
- `destroy()`: Disconnects the ResizeObserver and cleans up resources.

Example for programmatic usage:

```javascript
const responsiveElement = document.getElementById('my-responsive-container');
const responsiveCtrl = webexpress.webui.Controller.getInstanceByElement(responsiveElement);

if (responsiveCtrl) {
    // manually refresh panel visibility
    responsiveCtrl.refresh();

    // cleanup when no longer needed
    responsiveCtrl.destroy();
}
```

## Use Case Example

The following example shows a responsive container with three panels for different breakpoints and a fallback panel:

```html
<div id="my-responsive-container" class="wx-webui-responsive">
    <div class="wx-responsive-panel" data-breakpoint="900">
        Content for large screens (≥ 900px)
    </div>
    <div class="wx-responsive-panel" data-breakpoint="600">
        Content for medium screens (≥ 600px)
    </div>
    <div class="wx-responsive-panel" data-breakpoint="300">
        Content for small screens (≥ 300px)
    </div>
    <div class="wx-responsive-panel-fallback">
        Fallback content for very small screens
    </div>
</div>
```

## Events

The ResponsiveCtrl component triggers the following event:

- **BREAKPOINT_CHANGE_EVENT:** Fired whenever the visible panel changes due to a breakpoint switch. The event payload contains the current breakpoint value or `null` when the fallback panel is shown.

## Summary

ResponsiveCtrl enables adaptive layouts by conditionally showing panels based on container width breakpoints. It supports fallback panels, real-time observation of size changes, and programmatic control, making it ideal for responsive interfaces in modern web applications.