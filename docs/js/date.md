![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# DateCtrl

The `DateCtrl` component is used for selecting a single date through an interactive user interface. It combines a text input field with a calendar icon, which, when activated, displays a calendar pop-up for date selection. This allows the user to either enter a date directly by manual input or select it visually from the calendar. The component is configured declaratively via `data-` attributes, enabling seamless integration into HTML forms.

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

| Attribute | Description | Example |
| :--- | :--- | :--- |
| `data-range` | Activates the date range selection mode when set to `"true"`. | `data-range="true"` |
| `data-value` | Sets the initial value. In range mode, a string like `"YYYY-MM-DD - YYYY-MM-DD"` is expected. | `data-value="2025-07-01"` |
| `data-format` | Defines the date format for manual input, display in the text field, and the value in the hidden input field. | `data-format="YYYY-MM-DD"` |
| `data-holidays`| A comma-separated list of holidays in `"YYYY-MM-DD"` format, which are visually highlighted in the calendar pop-up. | `data-holidays="2025-12-25,2025-12-26"` |
| `placeholder` | The text displayed in the input field as long as no date is selected. | `placeholder="Select a date..."` |
| `name` | The name for the hidden input field that contains the formatted date value for form submissions. | `name="start_date"` |

## Features

The `DateCtrl` component offers a dual interaction model and a rich visual presentation.

- **Hybrid Input**: Users can enter a date either by direct text input into the field or by clicking the component to open a calendar pop-up and selecting a date from there.
- **Live Validation**: During manual input, the value is validated in real-time. Invalid formats are indicated by a visual marking of the input field (e.g., with the CSS class `is-invalid`).
- **Calendar Pop-up**: The pop-up provides a full month view with navigation elements for months and years.
- **Visual Highlighting**: Within the calendar, the currently selected date, weekends, and defined holidays are color-coded for better orientation.
- **ISO Week Numbers**: For improved planning, the calendar weeks according to the ISO 8601 standard are displayed in a separate column.
- **"Today" Button**: A button at the bottom of the pop-up allows for the quick selection of the current date.

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
    // Get the current value, which is a Date object or null
    const selectedDate = dateCtrl.value;

    // Set a new date. This updates the input field and the hidden value.
    dateCtrl.value = new Date('2025-08-15');
}
```

### Manual Instantiation

A `DateCtrl` component can also be created entirely programmatically. This is useful for dynamic UI scenarios where the configuration is determined at runtime.

```javascript
// find the container element for the dynamic date picker
const container = document.getElementById('dynamic-date-container');

// create a new instance of DateCtrl manually
const dynamicDateCtrl = new webexpress.webui.DateCtrl(container);
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
     class="wx-webui-date"
     name="delivery_date"
     data-value="2025-07-01"
     data-format="YYYY-MM-DD"
     data-holidays="2025-12-25,2025-12-26"
     placeholder="Select delivery date">
</div>
```