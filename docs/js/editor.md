![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# EditorCtrl

The `EditorCtrl` component provides a "What You See Is What You Get" (WYSIWYG) editor that enables the creation and editing of rich text content directly in the browser. The component is declaratively integrated into the HTML markup and initializes its content from the existing markup of the host element. For seamless integration into forms, a `name` attribute is used to automatically synchronize the editor's content with a hidden input field.

## Declarative Configuration

The editor is initialized directly in the HTML. The initial content is taken from the `innerHTML` of the host element, and the editor can be bound to a form using the `name` attribute.

| Attribute    | Description                                                                                         | Example
|--------------|-----------------------------------------------------------------------------------------------------|-----------------
| `name`       | Defines the name for a hidden input field that submits the editor's content with a form submission. | `name="content"`
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

// get or set the content programmatically
if (editorCtrl) {
    const currentContent = editorCtrl.getValue();
    editorCtrl.setValue('<p>New content that replaces the old one.</p>');
}
```

### Manual Instantiation

An editor can also be created entirely programmatically and attached to a host element, which is useful in dynamic UI scenarios.

```javascript
// find the container element for the dynamic editor
const container = document.getElementById('editor-container');

// create a new instance of EditorCtrl manually
const dynamicEditorCtrl = new webexpress.webui.EditorCtrl(container);

// set initial content
dynamicEditorCtrl.setValue('<p>Dynamically created editor.</p>');
```

## Events

The `EditorCtrl` component itself does not dispatch specific, public events. Interactions within the editor, such as clicking buttons in the toolbar, are handled internally to format the content. Synchronization with a form occurs automatically on the `submit` event of the enclosing form.

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