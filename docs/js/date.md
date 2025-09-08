![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# DateCtrl

The `DateCtrl` component serves as a simple, read-only display for a date or date range. It is primarily used to present date values in a consistent and visually distinct manner, typically accompanied by a calendar icon. Unlike input controls, this component does not allow for user interaction to change the value.

```
   [#] 2025-09-08
```

## Configuration

The component is configured declaratively. The value to be displayed is taken directly from the text content of the host element.

| Attribute | Description | Example
|-----------|-------------|--------
|           |             |        

The text content of the element itself is used as the initial value to be displayed.

## Functionality

The core purpose of `DateCtrl` is the static display of a date string.

- **DOM Structure**: During initialization, the component wraps the provided text value in a `<span>` and prepends a calendar icon (`fa-solid fa-calendar-days`) for uniform styling.
- **Read-Only**: The component is designed for display purposes only and does not offer any user interaction for changing the date.
- **Form Support**: If a `name` attribute is present, a hidden input field (`<input type="hidden">`) is automatically generated to hold the value for form submission.
- **Dynamic Updates**: The displayed value can be updated programmatically via the `value` property of the controller instance.

## Programmatic Control

While the component is read-only for the end-user, its value can be manipulated via JavaScript.

### Accessing an Automatically Created Instance

For a declaratively defined component, the instance is retrieved using the `getInstanceByElement` method.

```javascript
// find the host element in the DOM
const element = document.getElementById('my-date-display');

// retrieve the controller instance
const dateCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (dateCtrl) {
    // get the current raw value as a string
    const currentValue = dateCtrl.value;

    // set a new value, which updates the displayed text and the hidden input
    dateCtrl.value = '2025-12-31';
}
```

### Manual Instantiation

The component can also be created entirely dynamically in JavaScript.

```javascript
// find the container element
const container = document.getElementById('dynamic-date-display');

// create a new instance of DateCtrl
const dynamicDateCtrl = new webexpress.webui.DateCtrl(container);

// set the value to be displayed
dynamicDateCtrl.value = '2025-08-15';
```

## Events

- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`**: This event is fired whenever the `value` property of the component is changed programmatically and results in a different displayed text.

## Use Case Example

The following HTML example shows a simple declarative integration of the `DateCtrl` component.

```html
<!--
    The host element for the date display control.
    The text content '2025-09-08' will be used as the initial value.
-->
<div id="my-date-display" class="wx-webui-date">
    2025-09-08
</div>
```

# InputDateCtrl

The `InputDateCtrl` component is used for selecting a single date or a date range through an interactive user interface. It combines a text input field with a calendar icon, which, when activated, displays a calendar pop-up for date selection. This allows the user to either enter a date directly by manual input or select it visually from the calendar. The component is configured declaratively via `data-` attributes, enabling seamless integration into HTML forms.

```
   ┌───────────────────────────┐
   │ 2025-07-01             [#]│
   └─┬─────────────────────────┘
   ┌─┴─────────────────────────┐
   │ << <    July 2025    > >> │
   │  WK Mo Tu We Th Fr Sa Su  │
   │  27  1  2  3  4  5  6  7  │
   │ ...                       │
   │         [ Today ]         │
   └───────────────────────────┘
```

## Configuration

The initialization and behavior of the component are managed through `data-` attributes on the host element. The placeholder text is defined using the standard `placeholder` attribute.

| Attribute      | Description                                                                                                         | Example
|----------------|---------------------------------------------------------------------------------------------------------------------|---------
| `data-range`   | Activates the date range selection mode when set to `"true"`.                                                       | `data-range="true"`
| `data-value`   | Sets the initial value. In range mode, a string like `"YYYY-MM-DD - YYYY-MM-DD"` is expected.                       | `data-value="2025-07-01"`
| `data-format`  | Defines the date format for manual input, display in the text field, and the value in the hidden input field.       | `data-format="YYYY-MM-DD"`
| `data-holidays`| A comma-separated list of holidays in `"YYYY-MM-DD"` format, which are visually highlighted in the calendar pop-up. | `data-holidays="2025-12-25,2025-12-26"`
| `placeholder`  | The text displayed in the input field as long as no date is selected.                                               | `placeholder="Select a date..."`
| `name`         | The name for the input field that contains the formatted date value for form submissions.                           | `name="start_date"`

## Features

The `InputDateCtrl` component offers a dual interaction model and a rich visual presentation.

- **Hybrid Input**: Users can enter a date either by direct text input into the field or by clicking the component to open a calendar pop-up and selecting a date from there.
- **Live Validation**: During manual input, the value is validated in real-time. Invalid formats are indicated by a visual marking of the input field (e.g., with the CSS class `is-invalid`).
- **Calendar Pop-up**: The pop-up provides a full month view with navigation elements for months and years.
- **Visual Highlighting**: Within the calendar, the currently selected date or range, weekends, and defined holidays are color-coded for better orientation.
- **ISO Week Numbers**: For improved planning, the calendar weeks according to the ISO 8601 standard are displayed in a separate column.
- **"Today" Button**: A button at the bottom of the pop-up allows for the quick selection of the current date.
- **Range Selection**: In `range` mode, users can select a start and end date. During selection, the prospective range is visually previewed.

## Programmatic Control

After initialization, the selected date can also be set or retrieved programmatically via JavaScript.

### Accessing an Automatically Created Instance

For components defined declaratively in HTML, the associated instance is retrieved via the `getInstanceByElement(element)` method of the central `webexpress.webui.Controller`.

```javascript
// find the host element in the DOM
const element = document.getElementById('my-date-picker');

// retrieve the controller instance associated with the element
const dateCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (dateCtrl) {
    // Get the current value, which is a Date object or an object {start, end}
    const selectedValue = dateCtrl.value;

    // Set a new date. This updates the input field and the hidden value.
    dateCtrl.value = new Date('2025-08-15');
}
```

### Manual Instantiation

An `InputDateCtrl` component can also be created entirely programmatically. This is useful for dynamic UI scenarios where the configuration is determined at runtime.

```javascript
// find the container element for the dynamic date picker
const container = document.getElementById('dynamic-date-container');

// create a new instance of InputDateCtrl manually
const dynamicDateCtrl = new webexpress.webui.InputDateCtrl(container);
```

## Events

The component dispatches several events to enable interaction with the application.

- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`**: Fired when a valid date is selected or cleared. The `detail` object contains the new value as a string in the defined format.
- **`webexpress.webui.Event.DROPDOWN_SHOW_EVENT`**: Fired when the calendar pop-up is opened.
- **`webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT`**: Fired when the calendar pop-up is closed.

## Use Case Example

The following HTML example shows the declarative configuration of a date selection field with a predefined value, a placeholder, and holidays.

```html
<!--
    The main container for the date control.
    It is configured with an initial value, a specific format,
    a placeholder, and highlighted holidays.
-->
<div id="my-date-picker"
     class="wx-webui-input-date"
     name="delivery_date"
     data-value="2025-07-01"
     data-format="YYYY-MM-DD"
     data-holidays="2025-12-25,2025-12-26"
     placeholder="Select delivery date">
</div>
```

# InputCalendarCtrl

The `InputCalendarCtrl` component renders an always-visible calendar widget that, depending on its configuration, allows for either single-date or date-range selection. The entire user interface, including the month view and its associated tools, is integrated directly into the parent element without using a pop-up. Configuration is handled declaratively through `data-` attributes, allowing for straightforward integration into existing HTML structures.

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

| Attribute      | Description                                                                                             | Example
|----------------|---------------------------------------------------------------------------------------------------------|---------------------
| `data-range`   | Activates the date range selection mode when set to `"true"`.                                           | `data-range="true"`
| `data-value`   | Sets the initial value. In range mode, a string like `"YYYY-MM-DD - YYYY-MM-DD"` is expected.           | `data-value="2025-07-01"`
| `data-format`  | Defines the date format for value processing and display.                                               | `data-format="YYYY-MM-DD"`
| `data-holidays`| A comma-separated list of holidays in `"YYYY-MM-DD"` format, which will be highlighted in the calendar. | `data-holidays="2025-12-25,2025-12-26"`
| `placeholder`  | The text that is displayed when no date is selected.                                                    | `placeholder="Select a date..."`
| `name`         | The name for the hidden input field that holds the value for form submissions.                          | `name="selected_date"`

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
const inputCalendarCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (inputCalendarCtrl) {
    // Get the current value
    // For single-date mode, this returns a Date object or null.
    // For range mode, this returns an object: { start: Date, end: Date } or { start: null, end: null }.
    const currentValue = inputCalendarCtrl.value;

    // Set a new value for range mode
    inputCalendarCtrl.value = {
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

// create a new instance of InputCalendarCtrl manually
const dynamicInputCalendarCtrl = new webexpress.webui.InputCalendarCtrl(container);
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
     class="wx-webui-input-calendar"
     name="event_dates"
     data-range="true"
     data-value="2025-07-01 - 2025-07-15"
     data-format="YYYY-MM-DD"
     data-holidays="2025-12-24,2025-12-25,2025-12-26,2026-01-01">
</div>
```