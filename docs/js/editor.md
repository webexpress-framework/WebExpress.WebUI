![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# EditorCtrl

The `EditorCtrl` component provides a "What You See Is What You Get" (WYSIWYG) editor that enables the creation and editing of rich text content directly in the browser. The component is declaratively integrated into the HTML markup and initializes its content from the existing markup of the host element. For seamless integration into forms, a `name` attribute is used to automatically synchronize the editor's content with a hidden input field.

## Declarative Configuration

The editor is initialized directly in the HTML. The initial content is taken from the `innerHTML` of the host element, and the editor can be bound to a form using the `name` attribute.

| Attribute    | Description                                                                                         | Example
|--------------|-----------------------------------------------------------------------------------------------------|-----------------
| `name`       | Defines the name for a hidden input field that submits the editor's content with a form submission. | `name="content"`
| `data-image-upload-uri` | The URI endpoint for image uploads. | `data-image-upload-uri="/api/upload"`
| `data-image-base-uri` | The base URI for resolving image paths. | `data-image-base-uri="/images/"`
| Text Content | The initial HTML content of the editor.                                                             | `<div class="wx-webui-editor">Initial <b>text</b>.</div>`

## Programmatic Control

After initialization, the editor's instance can be controlled programmatically to read or modify its content.

### Accessing an Automatically Created Instance

For an editor defined declaratively in HTML, the associated instance is retrieved via the `getInstanceByElement(element)` method of the central `webexpress.webui.Controller`.

```javascript
// find the host element in the DOM
const editorElement = document.getElementById('myEditor');

// retrieve the controller instance associated with the element
const editorCtrl = webexpress.webui.Controller.getInstanceByElement(editorElement);

// get or set the content programmatically using the value property
if (editorCtrl) {
    const currentContent = editorCtrl.value;
    editorCtrl.value = '<p>New content that replaces the old one.</p>';
}
```

### Manual Instantiation

An editor can also be created entirely programmatically and attached to a host element, which is useful in dynamic UI scenarios.

```javascript
// find the container element for the dynamic editor
const container = document.getElementById('editor-container');

// create a new instance of EditorCtrl manually
const dynamicEditorCtrl = new webexpress.webui.EditorCtrl(container);

// set initial content using the value property
dynamicEditorCtrl.value = '<p>Dynamically created editor.</p>';
```

## Events

The `EditorCtrl` dispatches a change event whenever its content is modified, enabling external components to react to content updates.

| Event                 | Description                                                                                   |
|-----------------------|-----------------------------------------------------------------------------------------------|
| `change_value_event`  | Dispatched whenever the editor content changes. The event detail contains the current content. |

```javascript
const editorElement = document.getElementById('myEditor');
const editorCtrl = webexpress.webui.Controller.getInstanceByElement(editorElement);

editorCtrl.on(webexpress.webui.Event.CHANGE_VALUE_EVENT, (e) => {
    console.log('Content changed:', e.detail.value);
});
```

Synchronization with a form occurs automatically on the `submit` event of the enclosing form.

## Keyboard Shortcuts

The editor supports the following keyboard shortcuts:

| Shortcut           | Action          |
|--------------------|-----------------|
| `Ctrl+B` / `⌘+B`  | Bold            |
| `Ctrl+I` / `⌘+I`  | Italic          |
| `Ctrl+U` / `⌘+U`  | Underline       |
| `Ctrl+Z` / `⌘+Z`  | Undo            |
| `Ctrl+Y` / `⌘+Y`  | Redo            |
| `Ctrl+Shift+Z` / `⌘+Shift+Z` | Redo |

## Use Case Examples

The following example shows the declarative configuration of an editor within a form.

```html
<form action="/submit-content" method="post">
    <div id="my-editor" class="wx-webui-editor" name="article_content">
        <h2>Article Title</h2>
        <p>This is the initial <b>content</b> of the editor. It can be <i>formatted</i>.</p>
        <ul>
            <li>List item 1</li>
            <li>List item 2</li>
        </ul>
    </div>
    <button type="submit">Submit</button>
</form>
```