![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# ContentCtrl

The `ContentCtrl` is the reading view of stored text. It is display only: it never edits, never submits and never dispatches an edit lifecycle event.

Its server-side counterpart `ControlContent` always takes the value the [editor](editor.md) stores, and `Format` decides what the reader is shown of it:

| Format | What is shown | Where it happens |
|--------|---------------|------------------|
| `TypeFormatContent.RichText` (default) | the document | this control, on the client |
| `TypeFormatContent.Markdown` | the Markdown source of that same document | the server, through `EditorContent` and the Markdown renderer; presented as source by `ControlCode` |

The Markdown view is for handing a value on in a portable form - into a README, an export, a ticket. It never reaches `ContentCtrl`: the control renders a code block instead.

For rich text, the editor does not store a document — it stores its whole **working surface**. An add-on is persisted inside the card frame that names it, moves it and opens its settings; a table is persisted framed and with the column resizers in its header cells; every block that must not be typed into carries `contenteditable="false"` and is fenced by the empty paragraphs the caret needs to get past it. Publishing that value as it stands shows the reader the scaffolding instead of the document.

`ContentCtrl` removes the scaffolding and leaves the document, which lets one stored value serve both the author and the reader instead of forcing a second, hand-maintained representation.

## What the conversion does

| Editor markup | Reading view |
|---------------|--------------|
| `.wx-addon-frame` (card, header, drag handle, settings button) | `div.wx-content-addon` holding only what the add-on renders |
| `.wx-addon-inline-frame` (draggable, tooltip naming the type) | `span.wx-content-inline` holding only the inline markup |
| Framed table with `.wx-col-resizer` handles and `.wx-native-table` | `table.wx-content-table`, column widths kept |
| `.wx-editor-instruction` (a note to whoever edits) | dropped, unless instruction texts are requested |
| `.wx-editor-placeholder`, `[data-wx-caret]`, `.wx-drop-marker` | dropped |
| `contenteditable`, `draggable`, `spellcheck`, `data-wx-focus-new` | dropped |
| `<p><br></p>` guard paragraphs around a non-editable block, and at the edges | dropped |
| `<a target="_blank">` without a `rel` | `rel="noopener noreferrer"` added |
| any inline `on…` handler that reached the value from outside | dropped |

An empty paragraph *between* two paragraphs of text was typed by the author and survives — only the guards the editor itself inserts are removed.

Persisted add-on configuration (`data-*` on the frame) is carried onto the reading element, and the rendered result is handed back to `webexpress.webui.Controller.createInstances`, so an add-on that persists as the markup of a control (a chart, a date, a game board) comes to life in the reading view too.

## Declarative Configuration

| Attribute          | Description                                                                                                   | Example
|--------------------|---------------------------------------------------------------------------------------------------------------|-----------------
| `data-base64`      | The content is transported base64 encoded. This is how the server-side `ControlContent` delivers it, so the browser never lays out the editing markup before the reading view replaces it. | `data-base64="true"`
| `data-placeholder` | Text shown when there is no content. Without it an empty value renders nothing at all.                        | `data-placeholder="No description yet"`
| `data-instruction` | Keeps the author's instruction texts in the reading view. They are dropped by default.                        | `data-instruction="true"`
| Text content       | The raw editor value, either base64 encoded or as markup.                                                     | `<div class="wx-webui-content"><p>Hello <b>World</b></p></div>`

```html
<div id="article" class="wx-webui-content" data-placeholder="No description yet">
    <p>Hello <b>World</b></p>
</div>
```

## Programmatic Control

```javascript
const element = document.getElementById("article");
const content = webexpress.webui.Controller.getInstanceByElement(element);

// the raw value, exactly as the editor stores it
const stored = content.value;

// replacing it rebuilds the reading view
content.value = "<p>New <b>content</b></p>";

// the reading text, for an excerpt, a tooltip or a sort key
const excerpt = content.text.slice(0, 140);
```

| Member         | Description
|----------------|--------------------------------------------------------------------------
| `value`        | Gets or sets the content in the raw format the editor stores. Setting it rebuilds the view.
| `text`         | Gets the reading text of the converted content — the raw value would answer with its markup.
| `render()`     | Rebuilds the reading view from the current value.

## Converting without the control

The conversion itself is a static class, so a host that already owns its container can use it directly:

```javascript
// returns a DocumentFragment holding the reading view
const fragment = webexpress.webui.ContentFormat.toFragment(value, { instruction: false });

// true when there is nothing a reader would see - an image or an add-on counts
// as content even though it contributes no text
if (!webexpress.webui.ContentFormat.isEmpty(fragment)) {
    container.appendChild(fragment);
}
```

## Where it is used

- [SmartEdit](smartedit.md) shows it in place of the editor while the pen is untouched, so the value reads as a document instead of as editor markup. The SmartEdit placeholder is passed through, so an unset value still names the field.
- The `editor` cell template of the [table](table.md) shows it in a column that is not `Editable`.
- A page shows it wherever stored rich text is published — the server-side counterpart is `ControlContent`.

## Server-side counterpart

```csharp
// the document
new ControlContent()
{
    Content = _ => article.Description,
    Placeholder = _ => "No description yet"
}

// the same value, as markdown source
new ControlContent()
{
    Content = _ => article.Description,
    Format = _ => TypeFormatContent.Markdown
}
```

| Property | Description |
|----------|-------------|
| `Content` | The value in the raw format the editor stores it in. |
| `Format` | `RichText` (default) shows the document, `Markdown` shows its source. |
| `Placeholder` | Stands in for a value that is not set. Without it an empty value renders nothing. |
| `Instruction` | Keeps the author's instruction texts. The Markdown source never carries them. |

## Reading a stored value on the server

Away from a browser - converting a stored value to Markdown, indexing it, mailing it - there is no client to build the reading view. `EditorContent` applies the same rules on the server:

```csharp
var markdown = EditorContent.ConvertToMarkdown(article.Description);
var nodes = EditorContent.ReadDocument(article.Description);
```

The two implementations are held together by a shared fixture rather than by shared code: `Data/editor-content.fixture.json` is read by the C# tests and by `content.scaffolding.test.mjs`, so a rule added on one side and forgotten on the other fails on the other side. See the [Markdown guide](../md-guide.md) for the conversion itself.

`ControlContent` encodes the markup and emits the host element; the reading-view conversion happens on the client. It is display only and never contributes a value to a form — the editing side is `ControlFormItemInputText` with `Format = _ => TypeEditTextFormat.Wysiwyg`.
