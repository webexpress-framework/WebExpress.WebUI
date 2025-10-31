![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# OverflowCtrl

The `OverflowCtrl` class manages the dynamic distribution of horizontally arranged elements and automatically moves overflowing content into an overflow menu ("More" menu) at the right edge. This ensures a flexible, width-adaptive layout, so that important controls always remain visible and less relevant elements are hidden when space is limited.

```
                                                                                        more
                                                                                         :
   ┌─────────────────────────────────────────────────────────────────────────────────────:───┐
   │  ┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐      V   │
   │  │ control ││ control ││ control ││ control ││ control ││ control ││ control │     [▼]  │
   │  └─────────┘└─────────┘└─────────┘└─────────┘└─────────┘└─────────┘└─────────┘          │
   └─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Functionality

The overflow controller monitors the width of the container and moves elements to the overflow menu when space runs out. Control is via CSS classes and `data-` attributes of the child elements. Any control element can be used, e.g. buttons, dropdowns, comboboxes, separators, or static text.

Supported types of elements:

- **Interactive elements (`.wx-toolbar-button`)**: Any button or control that triggers actions.
- **Separators (`.wx-toolbar-separator`)**: Used for visual grouping.
- **Dropdowns (`.wx-toolbar-dropdown`)**: Open a submenu for further actions or links. Internally, the `DropdownCtrl` class is used.
- **Comboboxes (`.wx-toolbar-combo`)**: Selection field for choosing a value.
- **Text elements (`.wx-toolbar-label`)**: Static text, e.g. for a status display.
- **Overflow menu ("More", `.wx-toolbar-more`)**: A special dropdown menu at the right edge, which is automatically populated.

## Settings and Attributes

The overflow logic and the behavior of individual elements are controlled by the following attributes:

| Attribute               | Description                                                                                         | Example
|-------------------------|-----------------------------------------------------------------------------------------------------|----------------------
| `data-overflow`         | Controls the behavior: `"never"` (never move), `"force"` (always in overflow), empty = automatic    |`data-overflow="force"`
| `data-overflow-cutoff`  | Activates cutoff mode: As soon as the first element is moved to overflow, all subsequent elements are also moved. Values: `"true"` or `"false"` | `data-overflow-cutoff="true"`

## Breakpoint / Cutoff

With the `data-overflow-cutoff` attribute, a breakpoint can be activated. If this is enabled (`"true"`), the controller moves, starting with the first overflowing element, all subsequent elements into the overflow menu. The visible area thus gets a clear cutoff point, after which all elements on the right are hidden. Without cutoff, elements are moved individually as space allows.

## Programmatic Control

After initialization, the instance can be obtained via `getInstanceByElement(element)` from the central `webexpress.webui.Controller` and controlled directly.

```javascript
// Find the root element
const overflowRoot = document.querySelector('.wx-overflow');

// Get the controller instance
const overflowCtrl = webexpress.webui.Controller.getInstanceByElement(overflowRoot);

// Explicitly trigger the overflow logic, e.g. after a layout change
overflowCtrl.handleOverflow();

// Restore all elements from the overflow menu
overflowCtrl.restore();

// Enable or disable automatic distribution
overflowCtrl.setAutoDistribute(true); // or false
```

## Manual Instantiation

The class can also be created entirely programmatically and assigned to any container element.

```javascript
// Find the container element
const container = document.getElementById('overflow-container');

// Create a new OverflowCtrl instance
const dynamicOverflowCtrl = new webexpress.webui.OverflowCtrl(container);

// Add elements programmatically
// ...
```

## Events

The controller triggers global events, which can be processed by other parts of the application:

- **Click events:** When clicking on interactive elements in the overflow menu.
- **Keyboard navigation:** Events for menu navigation and submenus.

## Example

A responsive layout using OverflowCtrl:

```html
<div class="wx-overflow" data-overflow-cutoff="true">
    <div class="wx-toolbar-button" data-label="Open"></div>
    <div class="wx-toolbar-button" data-label="Save"></div>
    <div class="wx-toolbar-dropdown" data-label="Options"></div>
    <div class="wx-toolbar-button" data-label="Print" data-overflow="force"></div>
</div>
```

## Best Practices

- For important actions that should always remain visible: use `data-overflow="never"`.
- For rarely used actions: use `data-overflow="force"`.
- Use the cutoff attribute to define a clear breakpoint for visibility.

## Accessibility

`OverflowCtrl` supports keyboard navigation and ARIA roles for improved accessibility. The overflow menu can be operated via keyboard and all entries are focusable.

## Summary

The `OverflowCtrl` class ensures flexible and adaptive distribution of elements in horizontal layouts. Less important elements are moved into an overflow menu when space is limited. With the cutoff attribute, a clear breakpoint can be defined, after which all further elements are hidden. Control is via HTML attributes and can also be programmatically adjusted as needed.