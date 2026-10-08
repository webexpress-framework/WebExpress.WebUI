![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# EditorCtrl

The `EditorCtrl` component provides a "What You See Is What You Get" (WYSIWYG) editor that enables the creation and editing of rich text content directly in the browser. The component is declaratively integrated into the HTML markup and initializes its content from the existing markup of the host element. For seamless integration into forms, a `name` attribute is used to automatically synchronize the editor's content with a hidden input field.

Beyond plain formatting, the editor ships with inline triggers for mentions, links, and AddOns, markdown-style auto-formatting, a floating selection toolbar, and an instruction text tool. All of these are optional and extensible through dedicated registries.

## Declarative Configuration

The editor is initialized directly in the HTML. The initial content is taken from the `innerHTML` of the host element, and the editor can be bound to a form using the `name` attribute.

|Attribute               |Description                                                                                          | Example
|------------------------|-----------------------------------------------------------------------------------------------------|-----------------
|`name`                  |Defines the name for a hidden input field that submits the editor's content with a form submission.  | `name="content"`
|`data-image-upload-uri` |Upload endpoint for image pages of other modules (`editor.imageUploadUri`). WebUI does not upload.   | `data-image-upload-uri="/api/upload"`
|`data-image-library-uri`|Image list for those pages (`editor.imageLibraryUri`). WebUI does not read it.                       | `data-image-library-uri="/api/images"`
|`data-link-library-uri` |Link target list for link pages of other modules (`editor.linkLibraryUri`). WebUI does not read it.  | `data-link-library-uri="/api/links"`
|`data-mention-uri`      |REST endpoint for the `@`-mention search. The presence of this attribute enables the mention picker. | `data-mention-uri="/api/users/search"`
|`data-fill`             |Set to `"true"` to let the writing area take the height its dialog or page has left over.            | `data-fill="true"`
|Text Content            |The initial HTML content of the editor.                                                              | `<div class="wx-webui-editor">Initial <b>text</b>.</div>`

## Filling the Available Height

An editor sized for a form among many fields is a box of a few rows. An editor that *is* the
form — an article, a page, a post — should instead take everything the surface has left over,
because on such a form every pixel that is not the writing area is overhead.

`data-fill="true"` switches the editor to that mode. The writing area then grows to the
available height and loses its resize handle, which could only make an already maximal surface
smaller by accident.

The height is a viewport calculation rather than a share of the parent, because a form does not
offer one: inside a modal the form element is laid out as `display: contents`, so a percentage
resolves to `auto` the whole way down. What stands above and below the surface is the host's to
know, so the amount subtracted is the custom property `--wx-editor-fill-offset`. Its default,
`20rem`, is the chrome of a full-screen dialog — its header, a title field, the editor toolbar
and the footer bar the submit button sits on.

```html
<div class="wx-webui-editor" name="Body" data-fill="true"
     style="--wx-editor-fill-offset: 16rem;">
</div>
```

A host that *can* offer a definite height makes the calculation unnecessary. `ModalFormCtrl`
does exactly that: a dialog whose served form carries a filling element gets the class
`wx-modal-fill` on its body, which stops the body scrolling and passes its height down, and the
writing area then ends where the dialog ends rather than where the arithmetic said. Any
container that makes the chain down to the editor a growing flex column has the same effect.

On the server the mode is declared through `ControlFormItemInputText.Fill`; it applies to the
`Wysiwyg` format only, since the other formats size themselves from `Rows`.

## Inline Triggers

The editor recognises direct triggers that map to specific actions or pickers:

|Trigger |Action
|--------|-----------------------------------------------------------
|`@`     |Opens the mention picker (only when `data-mention-uri` is set)
|`[`     |Opens the link dialog
|`{`     |Opens the AddOn library
|`//`    |Inserts a date control at the cursor
|`:`     |Opens the searchable emoji picker

Trigger handling starts at the beginning of a text token and is disabled inside code. Link, AddOn and date dialogs replace their trigger only when insertion is confirmed. Cancelling either the AddOn selection or its property dialog leaves the original text and caret intact. Mention and emoji pickers also retain their query until an item is selected, so Escape preserves the typed text.

Emoji entry uses `:` followed by an emoji name, such as `:wink`. Arrow keys choose an item and Enter inserts it. Complete emoticons such as `:)`, `:-)`, `;)`, `:(`, `:D`, `:P` and `<3` convert directly to Unicode emoji. The status shortcuts `(/)`, `(x)` and `(!)` become ✅, ❌ and ℹ️ respectively. Undo restores the original characters.

## Markdown Shortcuts

The editor auto-formats common markdown patterns inline. Block patterns fire on `Space` at the start of a line; inline patterns fire on `Space` after the closing delimiter.

### Block-level patterns

|Pattern      |Result
|-------------|---------------------
|`# `         |Heading 1
|`## `        |Heading 2
|`### `       |Heading 3
|`> `         |Block quote
|` ``` `      |Code block
|`- ` or `* ` |Bullet list
|`1. `        |Numbered list
|`--- `       |Horizontal rule

### Inline patterns

|Pattern                  |Result
|-------------------------|--------------------------
|`**bold**`               |`<strong>bold</strong>`
|`*italic*` or `_italic_` |`<em>italic</em>`
|`~~strike~~`             |`<s>strike</s>`
|`` `code` ``             |`<code>code</code>`

## Bubble Menu

When text is selected, a floating mini-toolbar appears **below** the selection with the most common formatting actions: **Bold**, *Italic*, <u>Underline</u>, ~~Strike~~, Link, Clear Format.

The toolbar is always anchored below the selection. It repositions itself on scroll and on window resize, clamps against the viewport edges, and disappears when the selection collapses, the editor loses focus, or the user clicks outside.

## Format Painter

The toolbar provides a format painter that transfers the inline formatting of one selection to another. Clicking the paint-roller button arms the painter with the formatting at the current selection; the next selection made in the editor content receives that formatting, replacing its previous inline formatting. A source selection without any inline formatting makes the painter act like *Clear Format*. Pressing `Escape`, or clicking the button again, disarms the painter without applying anything.

## Instruction Text

The editor provides a tool to insert instruction texts (Anweisungstexte) for authors via a toolbar button. Clicking the button opens a prompt asking for the text. The entered text is inserted into the editor as a highly visible, distinct block. This block is read-only (`contenteditable="false"`) to prevent accidental editing of the structure. Outside the editor context, the instruction text is hidden via CSS, making it completely invisible on the published page.

## Notes

The note add-on inserts an editable block for information that belongs in the published document. Open the add-on library from the toolbar or type `{`, then choose **Note**. The block uses a yellow background and supports paragraphs, lists, links and inline formatting through the existing editor tools. Its frame provides the standard movement and removal actions.

The document model stores notes as `note-box` container add-ons. Insertion, editing and removal use the editor history, and loading the stored JSON restores the note content. `ControlContent` displays notes by default with the same background and formatting while removing the editing frame. The `Instruction` setting does not affect notes.

## Inline Comments

The comment command attaches a plain-text annotation to selected document text. Select existing text and use **Comment** in the selection bubble. The selected text remains editable and keeps its formatting. A comment can span multiple formatted runs and paragraphs. Each text position belongs to at most one comment, so a selection overlapping a different comment must be narrowed before another annotation can be added.

The comment dialog edits the annotation when the caret is inside its text or the existing annotation is selected. Double-clicking annotated text also opens the dialog. **Remove comment** removes the annotation from all its text runs without deleting the text. Closing the dialog without saving leaves the document and selection unchanged. The removal action appears at the far left of the footer, while the standard modal close action dismisses the dialog. Adding, editing and removing comments are separate undoable transactions.

The document model stores annotations in a `comment` text mark containing `id` and `text`. Typing inside annotated text extends the annotation, while typing at either edge does not. Deleting all referenced text removes its annotation. Clearing formatting retains comments, and the format painter does not copy them. JSON persistence and HTML interchange retain comment metadata. Clipboard imports assign new identities so pasted comments can be edited independently.

## Reading view

The editor value contains the validated JSON document model. Frame titles, drag handles, column resizers and selection indicators belong to the editing view and are excluded from that value. The [content control](content.md) renders the document for reading. HTML interchange is available through `exportHtml()`, which also omits the editing controls.

```javascript
editorElement.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, (e) => {
    preview.value = JSON.stringify(e.detail.value);   // preview is a ContentCtrl
});
```

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

|Field         |Type   |Description
|--------------|-------|---------------------------------------------------------
|`id`          |string |**Required.** Stored as `data-id` on the inserted mention.
|`label`       |string |Display text. Falls back to `name`, then `id`.
|`image`       |string |Optional avatar URL.
|`uri`         |string |Optional link target.
|`description` |string |Optional secondary line in the picker.

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

|Event                |Description                                                                                    |
|---------------------|----------------------------------------------------------------------------------------------|
|`change_value_event` |Dispatched whenever the editor content changes. The event detail contains the current content. |

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

|Shortcut                      | Action
|------------------------------|---------------------------
|`Ctrl+B` / `⌘+B`             |Bold
|`Ctrl+I` / `⌘+I`             |Italic
|`Ctrl+U` / `⌘+U`             |Underline
|`Ctrl+Z` / `⌘+Z`             |Undo
|`Ctrl+Y` / `⌘+Y`             |Redo
|`Ctrl+Shift+Z` / `⌘+Shift+Z` |Redo
|`@`                           |Open mention picker (when `data-mention-uri` is set)
|`[`                           |Open link dialog
|`{`                           |Open AddOn library
|`:`                           |Open the emoji picker
|`//`                          |Insert date control
|`Tab` (in list)               |Indent list item
|`Shift+Tab` (in list)         |Outdent list item

### Deletion Behavior

Backspace/Delete remove typed whitespace first and only remove adjacent non-editable blocks when the caret is truly at the block boundary (word-processor-like behavior).

### Formatting and selection

Inline commands operate on the selected text, including partial selections inside
nested formatting. Clearing formatting keeps links, list structure, table cells
and non-editable widgets intact. Editable table cells and add-on bodies remain
formatable inside their non-editable frames. Block changes preserve the selected
text; headings in list items leave nested lists in place.

With a collapsed caret, inline commands set the formatting for the next input.
An active format can be switched off before typing, including by keyboard.
Typing and the following formatting command are separate undo steps. Undo
restores the selection used for the command; operations without content changes
preserve redo.

### Editing regions

The Regions dropdown contains Add region, Split region and Delete region. Adding creates a row below the current row, splitting adds an empty region beside the selected region, and deletion removes the selected region with its content. The final region cannot be deleted. A document with one region has no region border, label or drag handle. These indicators appear when the document contains multiple regions and follow loading, deletion and undo.

The region handle `⠿` moves a complete region with its content and relative width. Dropping near the left or right side of another region places it before or after that region in the same row. Dropping near the upper or lower edge creates a separate row above or below the target. Empty source rows are removed. A row accepts at most six regions, and each completed move is one undoable transaction.

### Pasting content

The clipboard import removes text, paragraph and table background colors together with foreign font families and font sizes. Unsupported presentation falls back to the editor styles. Supported headings, lists, links, alignment, text colors and inline emphasis remain available. Equivalent HTML and CSS formatting becomes native editor marks, including bold, italic, underline, strikethrough, code, superscript and subscript.

The cleanup applies to clipboard HTML and external HTML drops. Loading a saved document and calling `insertHtmlAtCursor()` retain supported explicit formatting, including highlights. A paste is one undoable transaction, so undo and redo restore the complete content change.

### Editing tables

The table frame uses the same `⠿` movement handle as block add-ons. Its title remains outside the editable cells. A toolbar inside the frame exposes row and column insertion, headers, merging, splitting, deletion and cell background colors. These actions replace the cell context menu. Tables can be moved between blocks and regions without losing cells, formatting or column widths. Frames and toolbars are recreated after loading or undo and are excluded from the exported table HTML.

Drag from one cell into another, or Shift-click another cell, to select a rectangle.
Dragging within a single cell still selects text. The rectangle remains selected
when using the toolbar or opening its color picker. Existing row and column spans expand the selection
to include each affected cell completely.

Merge combines the selected rectangle in reading order, including vertical spans;
it requires at least two cells within the same row group. Split restores every
covered row and column position. Lists and indentation stay inside the affected
cells, and cell background colors apply to the entire rectangle. Structural edits
and colors update the form value and undo history. Selection highlighting is never
stored in the value or history.

Toolbar availability follows the selected cells within each table. Cell actions are disabled when the selection is outside that table. Merge requires a complete rectangle within one row group. Split requires one cell spanning multiple rows or columns. The table deletion action remains available for its own frame. The background color picker uses `InputColorCtrl`, shows the common selected color and can remove backgrounds from mixed selections.

### Editing links

The link dialog adds a destination to the selected text. If the text field is left
unchanged, only the link is applied, so formatting, paragraphs, images and mentions in
the selection stay intact. Entering a different text replaces the selection. With a
selected image, the dialog links the image itself.

Addresses are kept as entered unless they name a bare host: `example.com/a` becomes
`https://example.com/a` and `a@b.de` becomes `mailto:a@b.de`. Relative, query and
fragment addresses such as `page.html`, `../docs`, `?tab=2` or `#top` stay relative, so
internal links keep pointing into the site. Spaces are percent-encoded. An address the
document does not accept, such as `javascript:`, is reported in the dialog.

"Open in a new tab" follows the address for a new link (checked for `http(s)` addresses)
until it is changed by hand. Existing links keep their own setting. Edit Link and
Remove Link in the context menu cover the whole link, including runs with different
formatting. Removing the link from an image keeps the image.

### Editing images

Click an image to select it and display the floating popover used for contextual
editing. Its edit button opens the image dialog; the actions menu offers
left, center, right and inline alignment, 25%, 50%, 100% and original size, and
removal. Double-clicking an image also opens the dialog.

The dialog supports changing the source, alternative text, width and height.
Dimensions accept positive pixel or percentage values; a number without a unit
means pixels. Leave a dimension empty for automatic sizing, for example to
preserve the aspect ratio while changing only the width.

Changes update the existing image, preserving its position, surrounding link and
unrelated attributes. Image addresses follow the same rules as links, except that
`data:` and `mailto:` addresses are rejected with a message, so an invalid source never
removes an existing image. Saving without changes closes the dialog. Cancelling leaves
the image unchanged. Image edits, alignment, resizing and removal participate in undo/redo.

WebUI only offers the address page. Pages that pick images from a site library or upload
them belong to the modules that own those files (see below).

### Link and image pages from other modules

The link and image dialogs show every page registered under the `editor-link` and
`editor-image` keys of `webexpress.webui.DialogPanels`. A module adds a page, for example
a page picker or an image library, by registering it while its script loads. Each editor
gets its own dialog when the dialog is first opened, with the pages registered until then.
A page with an `available(editor)` member is only added if that returns `true`, for example
only for editors that name an upload address.

On every opening, the dialog carries a context in `modal.editorDialog`:

|Member           |Description
|-----------------|------------------------------------------------------------------------------------------------
|`editor`         |The editor the dialog was opened for.
|`mode`           |`"insert"` or `"edit"`.
|`prefill`        |Link: `url`, `text`, `newTab` (`null` for a new link), `image` (the link belongs to an image). Image: `url`, `alt`, `width`, `height`.
|`address(value)` |Returns the address as the document will store it, or `""` if the document rejects it.
|`apply(values)`  |Link: `{ href, text?, newTab? }`. Image: `{ src, alt?, width?, height? }`. Returns `false` for a rejected address or size.

`apply()` inserts at the caret the dialog was opened for, or changes the link or image being
edited, as one undoable step. Link text left empty keeps the selected text, and an omitted
`newTab` opens only `http(s)` addresses in a new tab. An omitted image dimension keeps the
current one.

The dialog validates and submits only the active page and closes after `onSubmit`. A page
therefore implements `validate` and `onSubmit` and needs no button wiring. If `onSubmit` throws,
the dialog stays open and shows the error. `render` runs once per editor and can read
`modal.editorDialog.editor`. Read everything else in `onShow`, `validate` and `onSubmit`,
because it changes with each opening.

```javascript
webexpress.webui.DialogPanels.register("editor-image", {
    id: "myapp-image-library",
    title: "Library",
    iconClass: "image",
    render(container, modal) {
        // build the library list; store the chosen file on modal._library
    },
    validate(modal) {
        return modal._library?.src ? true : { valid: false, message: "Please choose an image." };
    },
    onSubmit(modal) {
        if (!modal.editorDialog.apply({ src: modal._library.src, alt: modal._library.name })) {
            throw new Error("The image address is not supported.");
        }
    }
});
```

### Regression checks

Run `node --test` in `src/WebExpress.WebUI.Test/JsTest`. The shared editor, table and image
cases are also available in `editor.browser.html` in that directory. Serve the
repository through a local HTTP server that serves `.mjs` as JavaScript and open
that page in Chromium and Firefox.
It includes controller integration checks and a playground for native keyboard
input, cell selection and image popover interaction; the Node DOM stub alone does not verify
browser layout, focus or composition behavior.

## Extending the Editor

The editor exposes registry-style extension points. Each registry is a singleton on the `webexpress.webui` namespace and follows the same shape used elsewhere in the framework.

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

The numeric position (default `10`) controls the order of toolbar groups. The bubble menu, placeholder, and other core features are themselves plugins registered at positions 50–70.

### AddOns

Rich embeddable blocks register with `webexpress.webui.EditorAddOns`:

```javascript
webexpress.webui.EditorAddOns.register("alert-box", {
    label: "Alert",
    icon: "triangle-exclamation",
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

AddOns appear in the AddOn picker (opened via `{`, or the toolbar button). When the AddOn has `properties`, a property dialog opens before insertion. A property with a fixed set of values declares `type: "select"` and lists them as `options` of `{ value, label }` pairs; every other `type` becomes an input of that type.

Semantic containers include Info, Warning, Error and Success. Their bodies support ordinary text editing, paragraphs, formatting and nested content. The `bodyClass` definition supplies presentation classes shared by the editor and reading view, keeping the alert appearance separate from authored text. The former Card Container is no longer offered in the catalog.

Box properties include layout, label and border color. The `borderColor` value persists with the document and changes the frame in both editing and reading views without recoloring its text.
Inside the editor such an add-on keeps the generic card frame with the header that names it, and that frame carries the persisted properties as `data-*` attributes — which is what a stylesheet keys a preview on. The box stylesheet names the body of a frame with a given `data-layout` in every frame rule, so the author sees the frame the reader will get. See [Box](box.md).

## Use Case Examples

### Form with mentions

```html
<form action="/submit-comment" method="post">
    <div class="wx-webui-editor"
         name="comment"
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

## Editing Controls

Frame controls use theme colors and compact headers for tables and block AddOns. Table frames expose their actions in a dedicated toolbar. AddOn headers expose an ellipsis menu without a caret, providing properties when available and removal for every block AddOn. The drag handle moves an AddOn into a table cell or between cells, including empty cell space. Moves retain the AddOn identity and configuration and participate in undo and redo. A container cannot move into its own descendants.

Instruction editing starts with a click on the instruction. The bubble provides editing and removal actions, and a double click opens the instruction dialog directly. Delete or Backspace removes the selected instruction through the document model. Cancelling the dialog preserves the instruction, and committed edits and removals support undo.

Color attributes use `webexpress.webui.InputColorCtrl` for text colors, highlights, cell backgrounds and AddOn properties. The shared control provides a compact toolbar presentation, the same native dropdown pattern as the other toolbar controls and a custom color picker. A separate indicator beneath each light icon reflects the color at the active caret or selection endpoint. The removal action clears only the corresponding text color or highlight mark, retaining other formatting. The indicators also update after loading, undo and redo. Selection changes synchronize the picker silently and never create an edit.

The editor includes comment removal in its existing document editing permission. It does not require or evaluate `data-delete-comments`. The separate `DeleteComments` permission and its data attribute apply only to the reading surface provided by `ControlContent`. Disabled editors continue to reject editing and comment removal.
