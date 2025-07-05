![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# CalendarCtrl

The `CalendarCtrl` component renders an always-visible calendar widget that, depending on its configuration, allows for either single-date or date-range selection. The entire user interface, including the month view and its associated tools, is integrated directly into the parent element without using a pop-up. Configuration is handled declaratively through `data-` attributes, allowing for straightforward integration into existing HTML structures.

```
   ┌─────────────────────────────────────────────────────────┐
   │ ┌───────────────────────────┐ ┌───────────────────────┐ │
   │ │ 2025-07-01 - 2025-07-15   │ │  [Today][Clear][Copy] │ │
   │ └───────────────────────────┘ └───────────────────────┘ │
   ├─────────────────────────────────────────────────────────┤
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ << <                  July 2025               >  >> │ │
   │ │  WK  Mo  Tu  We  Th  Fr  Sa  Su                     │ │
   │ │  27   1   2   3   4   5   6   7                     │ │
   │ │  28   8   9  10  11  12  13  14                     │ │
   │ │ ...                                                 │ │
   │ └─────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────┘
```

## Configuration

The initialization and behavior of the component are managed via `data-` attributes on the host element.

| Attribute | Description | Example |
| :--- | :--- | :--- |
| `data-range` | Activates the date range selection mode when set to `"true"`. | `data-range="true"` |
| `data-value` | Sets the initial value. In range mode, a string like `"YYYY-MM-DD - YYYY-MM-DD"` is expected. | `data-value="2025-07-01"` |
| `data-format` | Defines the date format for value processing and display. | `data-format="YYYY-MM-DD"` |
| `data-holidays`| A comma-separated list of holidays in `"YYYY-MM-DD"` format, which will be highlighted in the calendar. | `data-holidays="2025-12-25,2025-12-26"` |
| `placeholder` | The text that is displayed when no date is selected. | `placeholder="Select a date..."` |
| `name` | The name for the hidden input field that holds the value for form submissions. | `name="selected_date"` |

## Features

The component provides a comprehensive set of features for date interaction.

- **Display Modes**: Two primary modes are supported: single-date selection (default) and date-range selection.
- **Persistent Visibility**: The calendar is always visible and is not toggled by a click.
- **Interaction Preview**: Hovering over days in the calendar displays a visual preview of the selection (either a single date or a range) without requiring manual input.
- **Integrated Toolbar**: To the right of the date display, a toolbar provides buttons for common actions:
    - **Today**: Selects the current date.
    - **Clear**: Clears the current selection.
    - **Copy**: Copies the selected date or range to the clipboard.
- **Highlighting**: Weekends and holidays defined via `data-holidays` are visually highlighted for better orientation.
- **ISO Week Numbers**: The calendar weeks, according to the ISO 8601 standard, are displayed in a dedicated column on the left side of the calendar.

## Programmatic Control

After initialization, the component's value can be accessed and modified programmatically.

### Accessing an Automatically Created Instance

For calendars defined declaratively in HTML, the associated instance is retrieved via the `getInstanceByElement(element)` method of the central `webexpress.webui.Controller`.

```javascript
// find the host element in the DOM
const element = document.getElementById('my-calendar');

// retrieve the controller instance associated with the element
const calendarCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (calendarCtrl) {
    // Get the current value
    // For single-date mode, this returns a Date object or null.
    // For range mode, this returns an object: { start: Date, end: Date } or { start: null, end: null }.
    const currentValue = calendarCtrl.value;

    // Set a new value for range mode
    calendarCtrl.value = {
        start: new Date('2025-09-01'),
        end: new Date('2025-09-05')
    };
}
```

### Manual Instantiation

A calendar can also be created entirely programmatically. This is useful for dynamic UI scenarios where the configuration is determined at runtime.

```javascript
// find the container element for the dynamic calendar
const container = document.getElementById('dynamic-calendar-container');

// create a new instance of CalendarCtrl manually
const dynamicCalendarCtrl = new webexpress.webui.CalendarCtrl(container);
```

## Events

The component dispatches a central event to react to value changes.

- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`**: This event is fired whenever the user selects a date or date range, or clears the selection. The `detail` object of the event contains the new value as a string, formatted according to the `data-format` attribute.

## Use Case Example

The following HTML example demonstrates the declarative configuration of a calendar in range mode with pre-defined values and holidays.

```html
<!--
    The main container for the calendar control.
    It is configured for range selection, with a pre-selected range,
    a specific date format, and highlighted holidays.
-->
<div id="my-calendar"
     class="wx-webui-calendar"
     name="event_dates"
     data-range="true"
     data-value="2025-07-01 - 2025-07-15"
     data-format="YYYY-MM-DD"
     data-holidays="2025-12-24,2025-12-25,2025-12-26,2026-01-01">
</div>
```