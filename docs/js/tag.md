![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# TagCtrl

The `TagCtrl` component is a read-only control designed to display a static list of tags. Unlike its interactive counterpart, `InputTagCtrl`, this component does not provide any user interface for adding or removing tags. It is purely for presentation.

The tags are rendered inside a `<ul>` element, making it an ideal choice for displaying data such as keywords associated with an article or labels on an item in a non-editable format.

```
   ┌──────────────────────────────────┐
   │ ┌────────┐ ┌────────┐            │
   │ │  tag1  │ │  tag2  │            │
   │ └────────┘ └────────┘            │
   └──────────────────────────────────┘
```

## Configuration

The component is configured via `data-` attributes on the host element.

| Attribute          | Description                                                   | Example
|--------------------|---------------------------------------------------------------|-----------------------------------------------
| `data-value`       | A semicolon-separated string of tags to be displayed.         | `data-value="html;css;js"`
| `data-color-css`   | A CSS class to be applied to all tag elements for styling.    | `data-color-css="bg-info"`
| `data-color-style` | An inline CSS style string to be applied to all tag elements. | `data-color-style="background-color: #28a745;"`

If neither `data-color-css` nor `data-color-style` is provided, a default class `wx-tag-primary` is applied to each tag.

## Functionality

- **Static Display**: Renders a list of tags based on the provided `data-value`.
- **Read-Only**: The component is for display purposes only. It does not include an input field or remove buttons.
- **Styling**: The appearance of the tags can be customized globally for the component using either a CSS class or an inline style.
- **Programmatic Updates**: The list of tags can be updated programmatically by setting the `value` property of the component's instance.

## Programmatic Control

The tags displayed by the component can be managed via its JavaScript instance after initialization.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-tag-display');

// retrieve the controller instance associated with the element
const tagCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (tagCtrl) {
    // get the current tags as a semicolon-separated string
    const currentTags = tagCtrl.value;

    // set new tags to be displayed using a string
    tagCtrl.value = 'react;vue;angular';

    // or set new tags using an array
    tagCtrl.value = ['Svelte', 'SolidJS'];
}
```

## Use Case Example

The following HTML demonstrates how to display a static list of tags with a custom background color.

```html
<!--
    A read-only display of tags.
    The tags will have a custom green background color.
-->
<div id="article-tags"
     class="wx-webui-tag"
     data-value="WebExpress;WebUI;JavaScript"
     data-color-style="background-color: #28a745; color: white;">
</div>
```

# InputTagCtrl

The `InputTagCtrl` component provides a user-friendly interface for entering and managing a list of tags. Users can add tags by typing and using separators (comma, semicolon, space) and remove them either by clicking a button on the tag itself or by using the backspace key in an empty input field.

The component is designed to look and feel like a standard form input while offering enhanced functionality. The resulting tags are stored in a hidden input field, ensuring seamless integration with HTML forms.

```
   ┌──────────────────────────────────────────────────┐
   │ ┌────────┐ ┌────────┐                            │
   │ │ tag1 x │ │ tag2 x │ [Input field for new tags] │
   │ └────────┘ └────────┘                            │
   └──────────────────────────────────────────────────┘
```

## Configuration

The component is configured via `data-` attributes on the host element.

| Attribute          | Description                                                    | Example
|--------------------|----------------------------------------------------------------|-----------------------------------------------
| `name`             | The name for the hidden input field, used for form submission. | `name="keywords"`
| `data-value`       | A semicolon-separated string of initial tags.                  | `data-value="html;css;js"`
| `placeholder`      | The placeholder text shown when no tags are present.           | `placeholder="Add tags..."`
| `data-color-css`   | A CSS class to be applied to all tag elements for styling.     | `data-color-css="bg-secondary"`
| `data-color-style` | An inline CSS style string to be applied to all tag elements.  | `data-color-style="background-color: #007bff;"`

If neither `data-color-css` nor `data-color-style` is provided, a default class `wx-tag-primary` is applied.

## Functionality

- **Tag Input**: Users can type into the input field to create new tags.
- **Separator-Based Adding**: Tags are automatically created from the input's content when a separator (`,`, `;`, or space) is typed.
- **Duplicate Prevention**: The component automatically prevents duplicate tags from being added.
- **Tag Removal**:
    - Each tag has a close button (`×`) to remove it individually.
    - Pressing `Backspace` or `Delete` in the empty input field removes the last tag in the list.
- **Form Integration**: The list of tags is automatically synchronized to a hidden input field as a semicolon-separated string.
- **Styling**: The appearance of the tags can be customized globally using either a CSS class or an inline style.

## Programmatic Control

The component's value can be accessed and modified programmatically after initialization.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-tag-input');

// retrieve the controller instance associated with the element
const tagCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (tagCtrl) {
    // get the current tags as a semicolon-separated string
    const currentTags = tagCtrl.value;

    // set new tags using a string
    tagCtrl.value = 'react;vue;angular';

    // or set new tags using an array
    tagCtrl.value = ['Svelte', 'SolidJS'];
}
```

## Events

- `webexpress.webui.Event.ADD_EVENT`: Fired when a new tag is added. The `detail` property of the event contains the tag string.
- `webexpress.webui.Event.REMOVE_EVENT`: Fired when a tag is removed. The `detail` property contains the tag string that was removed.

## Use Case Example

```html
<!--
    A tag input for blog post keywords, pre-filled with two tags.
    The tags will have a custom blue background color.
-->
<div id="blog-keywords"
     class="wx-webui-input-tag"
     name="keywords"
     data-value="WebExpress;WebUI"
     data-color-style="background-color: #007bff; color: white;"
     placeholder="Enter keywords...">
</div>
```