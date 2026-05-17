```markdown
![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# DateCtrl

The `DateCtrl` component serves as a robust, read-only display for single dates or date ranges. It is specifically designed to present chronological data in a consistent and visually distinct manner without allowing user interaction. During initialization, the component automatically parses the text content of its host element, normalizes the value, and wraps it in a structured DOM element that includes a leading calendar icon. It gracefully handles single dates, date ranges, and custom formatting, making it ideal for displaying event dates, deadlines, or logging timestamps.

```text
   [#] 2025-09-08
   [#] 2025-09-08 – 2025-09-10
```

## Configuration

The component is configured declaratively using `data-` attributes. The initial value to be displayed is taken directly from the text content of the host element. During initialization, the control parses this text content, recognizes single dates or ranges (separated by `-`, `–`, `;`, or `bis`), and applies the specified visual configurations. 

| Attribute          | Description                                                                                                                                      | Example                                 |
|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| `data-format`      | Defines the output format for the date. Supports custom token patterns like `YYYY-MM-DD`, `DD.MM.YYYY`, or `mmmm DD, YYYY`.                      | `data-format="DD.MM.YYYY"`              |
| `data-separator`   | Defines the string used to separate the start and end dates when displaying a date range. Defaults to ` – `.                                     | `data-separator=" to "`                 |
| `data-color-css`   | A specific CSS class name that will be applied to the inner text wrapper, allowing you to easily colorize the date display (e.g., for statuses). | `data-color-css="text-danger"`          |
| `data-color-style` | Inline CSS styles applied directly to the inner text wrapper.                                                                                    | `data-color-style="color: #ff0000;"`    |
| `lang`             | The language attribute. Used as a fallback for internal localization (e.g., rendering localized month names).                                    | `lang="en-US"`                          |

## Functionality

The core purpose of the `DateCtrl` is the static, standardized presentation of date strings, completely abstracted from input mechanics.

- **DOM Structuring**: Upon initialization, the component clears its host element, adds the `wx-date` class, and injects a neatly structured `<span>`. This wrapper contains a FontAwesome calendar icon (`fa-solid fa-calendar-days`) followed by the formatted date text.
- **Smart Parsing**: The component intelligently parses its initial text content or programmatically assigned values. It can detect single dates or date ranges provided as objects, arrays, or delimited strings (using semicolons or dashes). 
- **Range Handling**: If a valid start and end date are detected, they are rendered using the configured `data-separator`. If the start and end dates fall on the exact same calendar day, the component smartly collapses the display to show just the single date.
- **Read-Only**: The component is strictly for display purposes. It does not spawn hidden input fields for forms and does not trigger user interaction events.

## Programmatic Control

While the component is read-only for the end-user, its value and formatting can be manipulated dynamically via JavaScript. The component automatically re-renders the display whenever these properties are updated.

### Accessing an Automatically Created Instance

For a declaratively defined component, the instance is retrieved using the `getInstanceByElement` method from the central controller registry.

```javascript
// find the host element in the DOM
const element = document.getElementById('my-date-display');

// retrieve the controller instance associated with the element
const dateCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (dateCtrl) {
    // get the current normalized value (returns a Date, a {start, end} object, or null)
    const currentValue = dateCtrl.value;

    // set a new single date using a string
    dateCtrl.value = '2025-12-31';

    // set a new date range using an object
    dateCtrl.value = {
        start: new Date('2025-08-01'),
        end: new Date('2025-08-15')
    };

    // change the display format dynamically
    dateCtrl.format = 'mmmm DD, YYYY';
}
```

### Manual Instantiation

The component can also be instantiated entirely programmatically, which is useful when rendering dynamic data grids or UI cards.

```javascript
// find the container element
const container = document.getElementById('dynamic-date-display');

// create a new instance of DateCtrl
const dynamicDateCtrl = new webexpress.webui.DateCtrl(container);

// set the value and format to be displayed
dynamicDateCtrl.format = 'YYYY-MM-DD';
dynamicDateCtrl.value = '2025-08-15 - 2025-08-20';
```

## Use Case Examples

The following HTML examples show how to integrate the `DateCtrl` component declaratively, utilizing both single dates and date ranges with custom styling.

### Standard Single Date

```html
<!--
    The text content '2025-09-08' will be parsed as the initial value.
-->
<div id="my-single-date" class="wx-webui-date" data-format="mmmm DD, YYYY">
    2025-09-08
</div>
```

### Styled Date Range

```html
<!--
    Parses a range, applies a custom separator, and colors the text red.
-->
<div id="my-range-date" 
     class="wx-webui-date" 
     data-format="DD.MM.YYYY" 
     data-separator=" bis "
     data-color-css="text-danger">
    2025-01-01 - 2025-01-14
</div>
```

# InputDateCtrl

The `InputDateCtrl` component provides a highly interactive and versatile date picker for forms, combining a manual text input field with a Popper.js-powered calendar dropdown. It is designed to handle both single dates and date ranges gracefully. Users can type dates directly into the input field—benefiting from real-time format validation—or open the calendar pop-up to visually select days. The component supports advanced features such as ISO week numbers, visual highlighting for weekends and custom holidays, and interactive hover previews during range selection. 

```text
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

The initialization and behavior of the component are managed purely declaratively via `data-` attributes on the host element. During setup, the component reads these attributes, cleans the host element, and dynamically constructs the input field and the calendar pop-up DOM structure.

| Attribute      | Description                                                                                                         | Example
|----------------|---------------------------------------------------------------------------------------------------------------------|-----------------------------------
| `data-range`   | Activates the date range selection mode when set to `"true"`. Changes interaction and validation logic accordingly. | `data-range="true"`
| `data-value`   | Sets the initial value. In range mode, a string formatted like `"YYYY-MM-DD - YYYY-MM-DD"` is expected.             | `data-value="2025-07-01"`
| `data-format`  | Defines the strict date format for manual input parsing, field display, and internal value representation.          | `data-format="YYYY-MM-DD"`
| `data-holidays`| A comma-separated list of holidays in strict `"YYYY-MM-DD"` format, which will be highlighted in red in the calendar.| `data-holidays="2025-12-25,2025-12-26"`
| `placeholder`  | The placeholder text displayed inside the text input when no date is selected.                                      | `placeholder="Select a date..."`
| `name`         | The name attribute applied to the dynamically generated text input field, ensuring proper form submission.          | `name="delivery_date"`

## Functionality

The `InputDateCtrl` acts as a hybrid input control, meaning the state is perfectly synchronized between the text input and the visual calendar. 

- **Hybrid Input & Live Validation**: Users can type the date manually. As they type, the component validates the input against the configured `data-format`. If the input is incomplete or incorrectly formatted, an `is-invalid` class is immediately applied to the text field. Once a valid date is detected, the calendar view synchronizes automatically.
- **Interactive Calendar Pop-up**: Clicking the input field or the calendar icon reveals the dropdown menu. This menu utilizes the `PopperCtrl` foundation to ensure it is always positioned correctly on the screen without being clipped by overflow containers.
- **Range Selection & Preview**: When `data-range="true"` is set, the user first clicks a start date and then an end date. While moving the mouse between the first click and the second, the calendar provides a live visual preview of the selected range, highlighting the start, middle, and end segments.
- **Visual Highlighting**: To aid navigation, weekends and explicitly defined holidays are highlighted with a distinct red style (`wx-calendar-red`). Days outside the currently viewed month are grayed out.
- **ISO Week Numbers**: For business planning contexts, ISO 8601 calendar weeks are displayed continuously in a dedicated leftmost column.
- **"Today" Action**: A dedicated "Today" button at the bottom of the pop-up allows users to instantly jump to and select the current date.

## Programmatic Control

The selected date can be fully managed via JavaScript. The component normalizes various input types (Strings, Dates, Arrays, Objects) automatically and updates both the input field and the calendar visual state.

### Accessing an Automatically Created Instance

For components initialized via HTML classes, you can retrieve the instance using the central controller registry.

```javascript
// find the host element in the DOM
const element = document.getElementById('my-date-picker');

// retrieve the controller instance associated with the element
const dateCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (dateCtrl) {
    // Get the current value
    // Returns a Date object for single selection, or { start: Date, end: Date } for ranges
    const selectedValue = dateCtrl.value;

    // Set a new single date using a string
    dateCtrl.value = '2025-08-15';

    // Set a new date range using an object or an array
    dateCtrl.value = { start: new Date('2025-09-01'), end: new Date('2025-09-10') };
}
```

### Manual Instantiation

You can dynamically spawn an `InputDateCtrl` inside any container element using JavaScript, which is highly beneficial for dynamically generated form rows.

```javascript
// find the container element for the dynamic date picker
const container = document.getElementById('dynamic-date-container');

// create a new instance of InputDateCtrl manually
const dynamicDateCtrl = new webexpress.webui.InputDateCtrl(container);

// set properties programmatically
dynamicDateCtrl.format = 'DD.MM.YYYY';
dynamicDateCtrl.value = new Date();
```

## Events

The component integrates deeply with the WebExpress event system, dispatching events to allow external scripts to react to state changes and UI interactions.

- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`**: Dispatched whenever a valid date (or range) is successfully selected via the calendar or confirmed via valid manual text input. The `detail.value` property contains the newly formatted date string.
- **`webexpress.webui.Event.DROPDOWN_SHOW_EVENT`**: Fired exactly when the calendar pop-up opens and becomes visible to the user.
- **`webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT`**: Fired when the calendar pop-up is closed, either by finishing a selection, clicking outside the component, or pressing Escape.

## Use Case Examples

### Single Date Selection

The following example configures a standard date picker with a predefined value, format, and highlighting for specific holidays.

```html
<div id="delivery-date"
     class="wx-webui-input-date"
     name="delivery_date"
     data-value="2025-07-01"
     data-format="YYYY-MM-DD"
     data-holidays="2025-12-25,2025-12-26"
     placeholder="Select delivery date...">
</div>
```

### Date Range Selection

By adding `data-range="true"`, the exact same component transforms into a range picker. The `data-value` is structured to include both the start and end dates separated by a dash.

```html
<div id="vacation-dates"
     class="wx-webui-input-date"
     name="vacation_period"
     data-range="true"
     data-value="2025-08-01 - 2025-08-14"
     data-format="YYYY-MM-DD"
     placeholder="Select start and end date...">
</div>
```
