![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# TagCtrl

The `TagCtrl` component provides an interactive interface for displaying and managing a list of tags. Users can add and remove tags dynamically. Configuration and initial data are read from HTML attributes, allowing for fully declarative setup and ARIA-compliant operation. The tags are visually displayed, each with a remove icon, and the input field for new tags follows directly after the existing tags.

```
   ┌─────────────────────────────────────────────┐
   │ Tag 1 x  Tag 2 x [Input field for new tags] │
   └─────────────────────────────────────────────┘
```

## Declarative Configuration

Configuration is solely managed through `data-` attributes on the host element.

**Supported Host Element Attributes:**

| Attribute           | Description
|---------------------|--------------------------------------------------------------------
| `data-name`         | Name of the hidden field where the tags are stored.
| `data-tags`         | Semicolon-separated list of initial tags.
| `data-placeholder`  | Placeholder text for the input field.
| `data-color-css`    | CSS class for tag appearance (applied to all tags).
| `data-color-style   | Style for tag appearance (applied to all tags).

The tag list is created directly in the host element. New tags are added via the input field, which uses the `data-placeholder` text if provided. Each tag can be removed by clicking the remove icon (`&times;`). The appearance of tags can be customized via `data-color`.

## Architecture and Functionality

`TagCtrl` is designed to be reactive and independent.

- **Dynamic DOM Construction**: On initialization, the tag list is read from the data attributes and rendered as a `<ul>` with `<li>` elements. The host element is cleared and rebuilt including the tag structure, input field, and hidden field.
- **State-driven Rendering**: The display of tags is a direct reflection of the internal tag array. Any change (such as adding or removing a tag) triggers a complete update.
- **Interaction Model**:   
    - **Add Tag**: Enter a new tag in the input field and confirm with a comma, semicolon, or space.
    - **Remove Tag**: Any tag can be deleted by clicking its remove icon (`&times;`).
- **ARIA Compliance**: The input field and tag list include ARIA attributes for accessibility.

## Programmatic Control

The component supports full control via JavaScript after initialization.

### Accessing an Automatically Generated Instance

For tag controls defined declaratively in HTML, a central `webexpress.webui.Controller` instance is created automatically. Use `getInstanceByElement(element)` for access.

```javascript
const element = document.getElementById('my-taglist');
const tagCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (tagCtrl) {
    // Programmatically control the instance
    tagCtrl.tags = ["html", "css", "javascript"];
    tagCtrl.clear();
}
```

### Manual Instantiation

A tag control can also be created programmatically, for example when data is loaded at runtime.

```javascript
const container = document.getElementById('dynamic-tag-container');
const dynamicTagCtrl = new webexpress.webui.TagCtrl(container);
dynamicTagCtrl.tags = ["api", "accessibility"];
```

## Event Handling

The `TagCtrl` component emits global events for user interactions and state changes.

- **`webexpress.webui.Event.ADD_EVENT`**: Fired when a tag is added. `event.detail` contains the new tag.
- **`webexpress.webui.Event.REMOVE_EVENT`**: Fired when a tag is removed. `event.detail` contains the removed tag.

```javascript
const element = document.getElementById('my-taglist');

element.addEventListener(webexpress.webui.Event.TAG_ADD_EVENT, (event) => {
    console.log('Tag added:', event.detail);
});

element.addEventListener(webexpress.webui.Event.TAG_REMOVE_EVENT, (event) => {
    console.log('Tag removed:', event.detail);
});
```

## Example Usage

```html
<!--
    Host element for a tag list.
    The framework automatically initializes this element as TagCtrl.
-->
<div id="my-taglist"
     class="wx-webui-tag"
     data-name="skills"
     data-tags="HTML;CSS;JavaScript"
     data-placeholder="Add a skill..."
     data-color="wx-tag-primary">
</div>
```