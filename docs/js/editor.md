![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# EditorCtrl

The `EditorCtrl` component provides a "What You See Is What You Get" (WYSIWYG) editor that enables the creation and editing of rich text content directly in the browser. The component is declaratively integrated into the HTML markup and initializes its content from the existing markup of the host element. For seamless integration into forms, a `name` attribute is used to automatically synchronize the editor's content with a hidden input field.

Beyond plain formatting, the editor ships with a slash-command palette, inline triggers for mentions, links, and AddOns, markdown-style auto-formatting, a floating selection toolbar, and a contextual placeholder. All of these are optional and extensible through dedicated registries.

## Declarative Configuration

The editor is initialized directly in the HTML. The initial content is taken from the `innerHTML` of the host element, and the editor can be bound to a form using the `name` attribute.

| Attribute               | Description                                                                                          | Example
|-------------------------|------------------------------------------------------------------------------------------------------|-----------------
| `name`                  | Defines the name for a hidden input field that submits the editor's content with a form submission.  | `name="content"`
| `data-image-upload-uri` | The URI endpoint for image uploads.                                                                  | `data-image-upload-uri="/api/upload"`
| `data-image-base-uri`   | The base URI for resolving image paths.                                                              | `data-image-base-uri="/images/"`
| `data-placeholder`      | Hint shown in empty blocks. Defaults to *"Type / for commands"* (translated through I18N).           | `data-placeholder="Write something…"`
| `data-mention-uri`      | REST endpoint for the `@`-mention search. The presence of this attribute enables the mention picker. | `data-mention-uri="/api/users/search"`
| Text Content            | The initial HTML content of the editor.                                                              | `<div class="wx-webui-editor">Initial <b>text</b>.</div>`

## Slash Command Palette

Typing `/` at the start of an empty block (or any empty line) opens a searchable command palette anchored to the caret. The palette lists every entry registered with `webexpress.webui.EditorShortcuts`, grouped by category, with descriptions and icons.

The palette is navigated with arrow keys; `Enter` runs the highlighted command, `Esc` dismisses it. Typing into the palette's search field filters by label, id, description, or keywords (case-insensitive).

Ships with the following defaults:

| Category | Command            | Effect
|----------|--------------------|----------------------------------------------
| Text     | Paragraph          | Convert current block to `<p>`
| Text     | Heading 1 / 2 / 3  | Convert to `<h1>` / `<h2>` / `<h3>`
| Text     | Quote              | Convert to `<blockquote>`
| Text     | Code Block         | Convert to `<pre>`
| List     | Bullet             | Toggle unordered list
| List     | Numbered list      | Toggle ordered list
| Insert   | Date               | Insert today's date in the active locale
| Insert   | Date & time        | Insert current date + time
| Insert   | Horizontal Rule    | Insert `<hr>` and a fresh paragraph
| Insert   | Insert Link        | Open the link dialog
| Insert   | Insert Image       | Open the image dialog
| Insert   | Insert AddOn       | Open the AddOn library
| Format   | Clear Format       | Strip formatting from the selection

## Inline Triggers

Beyond the slash menu, the editor recognises three direct triggers that map to specific pickers:

| Trigger | Action
|---------|---------------------------------------------------------------
| `@`     | Opens the mention picker (only when `data-mention-uri` is set)
| `[[`    | Opens the link dialog
| `{{`    | Opens the AddOn library

The double-character triggers (`[[`, `{{`) consume both characters; the surface document never contains the literal trigger.

## Markdown Shortcuts

The editor auto-formats common markdown patterns inline. Block patterns fire on `Space` at the start of a line; inline patterns fire on `Space` after the closing delimiter.

### Block-level patterns

| Pattern        | Result
|----------------|---------------------
| `# `           | Heading 1
| `## `          | Heading 2
| `### `         | Heading 3
| `> `           | Block quote
| ` ``` `        | Code block
| `- ` or `* `   | Bullet list
| `1. `          | Numbered list
| `--- `         | Horizontal rule

### Inline patterns

| Pattern                 | Result
|-------------------------|--------------------------
| `**bold**`              | `<strong>bold</strong>`
| `*italic*` or `_italic_`| `<em>italic</em>`
| `~~strike~~`            | `<s>strike</s>`
| `` `code` ``            | `<code>code</code>`

## Bubble Menu

When text is selected, a floating mini-toolbar appears above the selection with the most common formatting actions: **Bold**, *Italic*, <u>Underline</u>, ~~Strike~~, Link, Clear Format.

The toolbar repositions itself on scroll and on window resize, and disappears when the selection collapses, the editor loses focus, or the user clicks outside.

## Placeholder

Empty blocks render a low-contrast placeholder hint inside the editor. By default the hint is shown on the very first block always (so an empty document is never visually blank) and on whichever block currently holds the caret. Non-editable embeds (AddOn frames, tables) are excluded.

The text comes from `data-placeholder` on the host element, falling back to the I18N key `webexpress.webui:editor.placeholder`.

## Mentions API

When `data-mention-uri` is set, pressing `@` opens a search dropdown that calls the configured endpoint.

### Request

The editor performs a `GET` to the configured URI, appending a `q` query parameter:

```http
GET /api/users/search?q=anna
Accept: application/json
```

The query is debounced (~180 ms) so rapid typing won't flood the backend.

### Response

The endpoint must respond with a JSON array of mention candidates:

```json
[
  {
    "id": "u123",
    "label": "Anna Müller",
    "image": "/avatars/u123.png",
    "uri": "/profile/u123",
    "description": "Engineering"
  }
]
```

| Field         | Type   | Description
|---------------|--------|---------------------------------------------------------
| `id`          | string | **Required.** Stored as `data-id` on the inserted mention.
| `label`       | string | Display text. Falls back to `name`, then `id`.
| `image`       | string | Optional avatar URL.
| `uri`         | string | Optional link target.
| `description` | string | Optional secondary line in the picker.

When the user picks an entry, the editor inserts:

```html
<a class="wx-mention" data-id="u123" href="/profile/u123" contenteditable="false">@Anna Müller</a>
```

Mention nodes are `contenteditable="false"` and act as atomic units: a single `Backspace` removes the whole mention.

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

### Inserting Content at the Caret

For custom commands or AddOn integrations, content can be inserted at the current cursor position without disturbing the surrounding markup.

```javascript
editorCtrl.insertHtmlAtCursor('<strong>Inserted at caret</strong>&nbsp;');
```

Input HTML is sanitized through the editor's allow-list before insertion. Unknown tags are unwrapped; unsafe attributes (event handlers, `javascript:` URLs, dangerous `style` values) are stripped.

## Events

The `EditorCtrl` dispatches a change event whenever its content is modified, enabling external components to react to content updates.

| Event                 | Description                                                                                    |
|-----------------------|------------------------------------------------------------------------------------------------|
| `change_value_event`  | Dispatched whenever the editor content changes. The event detail contains the current content. |

```javascript
const editorElement = document.getElementById('myEditor');
const editorCtrl = webexpress.webui.Controller.getInstanceByElement(editorElement);

editorElement.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, (e) => {
    console.log('Content changed:', e.detail.value);
});
```

Synchronization with a form occurs automatically on the `submit` event of the enclosing form.

## Keyboard Shortcuts

The editor supports the following keyboard shortcuts:

| Shortcut                     | Action
|------------------------------|---------------------------
| `Ctrl+B` / `⌘+B`             | Bold
| `Ctrl+I` / `⌘+I`             | Italic
| `Ctrl+U` / `⌘+U`             | Underline
| `Ctrl+Z` / `⌘+Z`             | Undo
| `Ctrl+Y` / `⌘+Y`             | Redo
| `Ctrl+Shift+Z` / `⌘+Shift+Z` | Redo
| `/`                          | Open slash command palette (at start of an empty block)
| `@`                          | Open mention picker (when `data-mention-uri` is set)
| `[[`                         | Open link dialog
| `{{`                         | Open AddOn library
| `↑` / `↓` (popup)            | Navigate menu items
| `Enter` (popup)              | Activate highlighted item
| `Esc` (popup)                | Close popup
| `Tab` (in list)              | Indent list item
| `Shift+Tab` (in list)        | Outdent list item

## Extending the Editor

The editor exposes three registry-style extension points. Each registry is a singleton on the `webexpress.webui` namespace and follows the same shape used elsewhere in the framework.

### Slash Commands

Register custom commands via `webexpress.webui.EditorShortcuts`:

```javascript
webexpress.webui.EditorShortcuts.register({
    id: "insert.signature",
    label: "Signature",
    description: "Insert my email signature",
    icon: "fas fa-signature",
    category: "Insert",
    keywords: ["sig", "signatur"],
    execute: (editor) => {
        editor.insertHtmlAtCursor("<p>— Best regards,<br>Anna</p>");
    }
});
```

A shortcut definition has the following fields:

| Field         | Type     | Description
|---------------|----------|---------------------------------------------------------
| `id`          | string   | **Required.** Unique identifier. Re-registering with the same id replaces the entry.
| `label`       | string   | **Required.** Shown in the menu.
| `description` | string   | Optional secondary line.
| `icon`        | string   | FontAwesome class. Defaults to `fas fa-bolt`.
| `category`    | string   | Group header in the menu. Defaults to *General*.
| `keywords`    | string[] | Additional search terms.
| `execute`     | function | Handler called with `(editor)`.
| `tag`         | string   | Alternative: applies `formatBlock(<tag>)`.
| `cmd`         | string   | Alternative: runs `execCommand(cmd)`.
| `html`        | string   | Alternative: calls `insertHtmlAtCursor(html)`.

Exactly one of `execute`, `tag`, `cmd`, or `html` should be provided. Definitions can also be registered in bulk by passing an array.

The full registry API:

| Method                     | Description
|----------------------------|-----------------------------------------------
| `register(def)`            | Registers one definition or an array of them.
| `unregister(id)`           | Removes a shortcut by id.
| `get(id)`                  | Returns a single definition.
| `getAll()`                 | Returns every registered definition.
| `search(query)`            | Returns definitions matching the query.
| `clear()`                  | Removes everything (useful for tests).

### Plugins

Toolbar buttons, context menu items, and behavior plugins register with `webexpress.webui.EditorPlugins`:

```javascript
webexpress.webui.EditorPlugins.register("my-plugin", 80, {
    init: (editor) => { /* called once per editor */ },
    createToolbar: (editor) => { /* return an HTMLElement or null */ },
    getContextMenuItems: (editor, target) => [ /* menu items */ ],
    onContentChange: (editor) => { /* called when value is set externally */ }
});
```

The numeric position (default `10`) controls the order of toolbar groups. The shortcut palette, bubble menu, and placeholder are themselves plugins registered at positions 50–70.

### AddOns

Rich embeddable blocks register with `webexpress.webui.EditorAddOns`:

```javascript
webexpress.webui.EditorAddOns.register("alert-box", {
    label: "Alert",
    icon: "fas fa-exclamation-triangle",
    type: "block",
    category: "Widgets",
    isContainer: false,
    properties: [
        { name: "variant", label: "Style", type: "text", default: "info" },
        { name: "title", label: "Title", type: "text", default: "Note" }
    ],
    renderer: (data) => `
        <div class="alert alert-${data.variant}">
            <strong>${data.title}:</strong> Your text here.
        </div>`
});
```

AddOns appear in the AddOn picker (opened via `{{`, the toolbar button, or the *Insert AddOn* slash command). When the AddOn has `properties`, a property dialog opens before insertion.

## Use Case Examples

### Form with mentions and custom placeholder

```html
<form action="/submit-comment" method="post">
    <div class="wx-webui-editor"
         name="comment"
         data-placeholder="Write a comment…"
         data-mention-uri="/api/users/search">
    </div>
    <button type="submit">Post</button>
</form>
```

### Declarative configuration of a rich-content editor

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

### Custom slash command — deadline (+7 days)

```javascript
webexpress.webui.EditorShortcuts.register({
    id: "insert.deadline",
    label: "Deadline (+7 days)",
    description: "Insert a due-date one week from today",
    icon: "fas fa-flag",
    category: "Insert",
    keywords: ["due", "deadline", "termin"],
    execute: (editor) => {
        const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const formatted = d.toLocaleDateString();
        editor.insertHtmlAtCursor(`<strong>Due: ${formatted}</strong>&nbsp;`);
    }
});
```

### Replacing default shortcuts

Removing or substituting a default works through the same registry:

```javascript
// remove the built-in date command
webexpress.webui.EditorShortcuts.unregister("insert.date");

// register a replacement with ISO format
webexpress.webui.EditorShortcuts.register({
    id: "insert.date",
    label: "Date (ISO)",
    icon: "fas fa-calendar-day",
    category: "Insert",
    execute: (editor) => {
        editor.insertHtmlAtCursor(new Date().toISOString().slice(0, 10) + "&nbsp;");
    }
});
```

### Reacting to content changes

```javascript
const editorElement = document.getElementById('my-editor');

editorElement.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, (e) => {
    document.getElementById('preview').innerHTML = e.detail.value;
});
```

### Programmatic insertion of an AddOn

```javascript
const ctrl = webexpress.webui.Controller.getInstanceByElement(
    document.getElementById('my-editor')
);

ctrl.insertHtmlAtCursor(`
    <div class="wx-addon-frame card my-3 shadow-sm"
         contenteditable="false"
         data-addon-id="game-of-life">
        <div class="card-body p-2 wx-addon-body-widget" contenteditable="false">
            <div class="wx-webui-gameoflife"
                 style="width:100%;height:300px"
                 data-cell-size="12"></div>
        </div>
    </div>
`);
```
