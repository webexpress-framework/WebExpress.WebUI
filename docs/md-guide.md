![WebExpress-Framework](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# Markdown
Markdown is a widely used markup language known for its simple and intuitive syntax. Whether for documentation, blogs, or technical reports, Markdown enables quick structuring of text with formatting such as headings, lists, tables, and links.
To process Markdown files and convert them into other formats like HTML or PDF, a Markdown parser is required. This parser analyzes the Markdown text, recognizes its structural elements, and transforms them into an appropriate representation.
The following explains the basic concepts, the architecture of a parser, and the concrete implementation steps. The goal is to develop a powerful and extensible parser that reliably interprets the Markdown syntax and is flexibly adaptable.

# Language
Markdown is an easy-to-understand markup language developed to format text content simply and clearly — without relying on complicated syntax. It is often used in software development, for example in readme files, on GitHub, in blogs, or for documentation. The aim of Markdown is to make content readable for both humans and machines.

## Blocks
A block can span one or more lines and represents a structural unit within the document. Block elements always stand alone on a line or are separated by blank lines. They define the outer framework of a document and influence its visual structure.

### Paragraph
A normal text section without special formatting. It represents the basic form of running text. Paragraphs are separated from the previous or next paragraph by at least one blank line.

```markdown
Markdown is a simple markup language that allows text to be formatted quickly and legibly.

It is often used in documentation, blogs, or readme files because it remains easily readable even without special tools.
```

### Header
Headings structure a document hierarchically. Markdown offers six levels (# to ######), with # being the highest level. They are essential for structuring and facilitate navigation as well as the automatic creation of tables of contents.

```markdown
# Title 1
## Title 2
### Title 3
```

### Horizontal Line
A horizontal line serves as a visual separator between content, e.g., between two topic blocks or as the end of a section. It consists of three or more dashes.

```markdown
---
```

### Quote
Block quotes start with a > sign and indicate inserted or referenced text. Multiple > signs can represent nested quotes.

```markdown
> This is a simple quote.
> > This is a nested quote.
```

### List
Lists are a structured way to organize multiple related items clearly and efficiently. They make information easier to digest and are ideal for workflows, enumerations, or grouped content.

Markdown supports two primary types of lists:  
- **Unordered lists**: no specific sequence  
- **Ordered lists**: items are arranged in a defined 

#### Unordered Lists
These are used when the sequence of items doesn't matter. They use simple symbols:

```markdown
- Point A
* Point B
+ Point B
```
All variations produce the same output. The choice of symbol is stylistic.

#### Ordered Lists
Used for processes or prioritized content. Various list types are possible depending on formatting:

|Type                     Syntax |Example  |Output
|-------------------------|------|---------|----------------
|Decimal numbers          |1.    |Step one |1. Step one
|Lowercase letters        |a.    |Option A |a. Option A
|Uppercase letters        |A.    |Option A |A. Option A
|Lowercase Roman numerals |i.    |Detail i |i. Detail i
|Uppercase Roman numerals |I.    |Detail I |I. Detail I

#### Nested Lists
Sub-lists enable hierarchical structures within a main list. Indentation is done using spaces or tabs.

```markdown
- Main item
  - Sub-item
    - Deeper sub-item
```

#### Continuing Numbering
When creating ordered lists in Markdown, items are usually prefixed with numbers (e.g., `1.`, `2.`, `3.`) to establish a clear sequence. In simple cases, Markdown can automatically increment the numbering regardless of the numeric values written—making it easy to reorder items or add new ones without manually updating each line.

However, this automatic behavior only works when list items appear directly one after another, without interruptions.

Once a list is broken by another block element—such as a paragraph, image, or code snippet—Markdown no longer tracks or continues the sequence. In such cases, numbering must be maintained manually to preserve clarity and logical progression:

```markdown
1. Start point

This paragraph provides more context before continuing.

2. Follow-up point
```
The numbering must be written accurately by hand to appear in the correct order.

### Table
Tables provide a structured representation of tabular data. Cells are separated by |. The separator line of dashes under the header defines the column alignment:
- `:--- left-aligned`
- `:---: centered`
- `---: right-aligned`

```
| Name   | Age | City         |
|:-------|:---:|-------------:|
| Mario  | 40  | Mushroom     |>>
|        |     | Kingdom      |
| Peach  | 38  | Royal Castle |
```

### Indent
Markdown uses indentation for certain block elements such as code blocks or list nesting.

- A tab or four spaces correspond to one indentation level.
- Multiple indentations create nested content or structure multi-level lists.

```markdown
    One tab or four spaces equals one indentation.
```

### Callout
Callouts are extended block elements for displaying contextual information. Depending on the prefix, they convey different meanings.

```markdown
>? This is a helpful hint.
>! Attention: This is a warning!
>!! Error: Something went wrong.
>* Success: Process completed.
```

## Inline Elements
Inline elements are within a paragraph and only change the marked word or part of a sentence. They can be combined and placed freely in the text.

|Formatting                     |Syntax                       |Example
|-------------------------------|-----------------------------|----------
|Italic:                        |`*text*`                     |*text*
|Bold                           |`**text**`                   |**text**
|Bold and italic                |`***text***`                 |***text*** 
|Underlined                     |`_text_`                     |_text_  
|Underlined and bold            |`__text__`                   |__text__
|Underlined, bold and italic    |`___text___`                 |___text___
|Strikethrough                  |`~text~` or `~~text~~`       |~~text~~
|Strikethrough and bold         |`~~~text~~~`                 |~~~text~~~
|Highlighted                    |`==text==`                   |==text==
|Code                           |`Code`                       |`Code`
|Url                            |`URL`                        |http://example.com
|Link                           |`[Text](URL)`                |
|Image                          |`![Alt-Text](Image-URL)`     |
|Html                           |`<span style="color: red;">` | <span style="color: red;">red</span>
|Checkbox                       |`[X]`                        |[X]
|Footnote                       |`[^1]`                       |Text[^1]
|Inline Plugin                  |`{{name param="val"}}`       |{{my_plugin}}

## Plugins
Plugins extend the Markdown syntax with additional semantic constructs, formatting options, and functional modules. They are treated as first-class elements of the Markdown syntax with full support for parameters, content, and nesting.

### Inline Plugins
Inline plugins are placed within a paragraph and behave like other inline elements. They use double curly braces with an identifier and optional key-value parameters.

```markdown
This text contains {{my_plugin}} an inline plugin reference.
```

Inline plugins can include parameters:

```markdown
{{video src="example.mp4" width="640"}}
{{chart type="bar" data="sales"}}
```

**Syntax:** `{{plugin_name param1="value1" param2="value2"}}`

- The plugin name must start with a letter or underscore and may contain letters, digits, and underscores.
- Parameters are optional and use the format `key="value"`.
- Multiple parameters are separated by spaces.

### Block Plugins
Block plugins wrap content and support nested Markdown inside. They use `{{% ... %}}` delimiters with an opening and closing tag.

```markdown
{{% note %}}
This is a note. It can contain **bold**, *italic*, and other Markdown.
{{% /note %}}
```

Block plugins can include parameters:

```markdown
{{% alert type="warning" title="Caution" %}}
Be careful with this operation.
{{% /alert %}}
```

**Syntax:**
```
{{% plugin_name param1="value1" %}}
Content (supports full Markdown syntax)
{{% /plugin_name %}}
```

- The opening tag contains the plugin name and optional parameters.
- The closing tag contains only `/plugin_name`.
- Content between the tags is parsed as standard Markdown and may include any block or inline elements.
- Block plugins are block-level elements and are separated from surrounding content by blank lines.

## Markdown Conversion (Round-Trip)
The parser supports bidirectional conversion between Markdown and its internal AST representation:

- **Markdown → AST:** `MarkdownParser.Parse(markdownText)` parses Markdown text into a `MarkdownDocument` AST.
- **AST → HTML:** `document.ConvertToHtml(renderContext)` converts the AST to an HTML tree.
- **AST → Markdown:** `document.ConvertToMarkdown()` converts the AST back to valid Markdown text.
- **HTML → AST:** `nodes.ConvertToDocument()` maps a parsed HTML tree onto the AST.
- **HTML → Markdown:** `nodes.ConvertToMarkdown()` does both steps at once.

This enables a complete round-trip: Markdown can be parsed, transformed, and then serialized back to Markdown while preserving all structural elements including plugin syntax.

### HTML to Markdown

The way back from HTML is `MarkdownRendererHtmlToMarkdown`. The HTML itself is read by `HtmlParser`, which maps every known tag to its own node class; the renderer matches on those classes and builds the AST, so all decisions about escaping, list indentation, numbering and table alignment stay in the Markdown renderer that already makes them.

```csharp
// read the html, then render the nodes as markdown
var markdown = new HtmlParser().Parse(html).ConvertToMarkdown();

// or in one step
var markdown = MarkdownRendererHtmlToMarkdown.ConvertHtmlToMarkdown(html);

// the ast is available too, for a caller that wants to transform before serializing
var document = new HtmlParser().Parse(html).ConvertToDocument();
```

What is mapped:

| HTML | Markdown |
|------|----------|
| `h1` ... `h6` | `#` ... `######` |
| `p` | paragraph - one holding nothing but `<br>` is dropped |
| `hr` | `---` |
| `blockquote` | `>` |
| `ul` / `ol` / `li` | list, a list nested in an item is indented |
| `table`, `tr`, `th`, `td` | table - a table without a header row is given its first row as one |
| `pre` / `code` | fenced block, language taken from a `language-x` class |
| `strong`, `b` | `**bold**` |
| `em`, `i` | `*italic*` |
| `u` | `_underline_` |
| `s`, `del` | `~~strikethrough~~` |
| `mark` | `==marked==` |
| `code` | `` `code` `` |
| `a`, `img` | `[text](url)`, `![alt](url)` |
| `br` | hard line break |
| anything else | transparent: the wrapper is dropped, the content is kept |

Markup Markdown has no notation for - a coloured span, an inline style - loses the wrapper and keeps its text. That is deliberate: the point of converting to Markdown is a portable document, and carrying the markup along as raw HTML would only defer the question.

The renderer knows nothing about the editor. The value the WYSIWYG editor stores is a working surface, not a document: it carries add-on frames with their labels and drag handles, and instruction texts addressed to the author. All of that is ordinary markup to this renderer, so a stored editor value is read by `EditorContent` first:

```csharp
// a stored editor value as a portable document
var markdown = EditorContent.ConvertToMarkdown(article.Description);

// or the document nodes, to render or index them
var nodes = EditorContent.ReadDocument(article.Description);
```

`EditorContent` applies the same rules the client applies in `ContentFormat`: it drops the instruction texts, placeholder hints, drop and caret markers, column resizers, drag handles and settings buttons, unwraps add-on frames to what the add-on renders, and removes the empty guard paragraphs around a non-editable block while keeping a blank line the author typed.

The two implementations cannot share code - one walks a DOM in the browser and builds a fragment, the other walks an `IHtmlNode` tree on the server and builds Markdown - so they share their cases instead: `Data/editor-content.fixture.json` is read by `UnitTestEditorContent.cs` and by `content.scaffolding.test.mjs`. A rule added on one side and forgotten on the other fails on the other side.

Two limits are worth knowing. An attribute written with an empty value (`data-wx-caret=""`) does not survive parsing, because the HTML element model treats an empty value as unset; only the valueless form is visible on the server. And `EditorContent` returns nodes rather than markup, because serializing a parsed tree back is lossy: `HtmlElementTableTable` renders from its own `Rows` collection and not from the children a parser gives it, so a parsed table would come back empty.
