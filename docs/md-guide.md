![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

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

```
Markdown is a simple markup language that allows text to be formatted quickly and legibly.

It is often used in documentation, blogs, or readme files because it remains easily readable even without special tools.
```

### Header
Headings structure a document hierarchically. Markdown offers six levels (# to ######), with # being the highest level. They are essential for structuring and facilitate navigation as well as the automatic creation of tables of contents.

```
# Title 1
## Title 2
### Title 3
```

### Horizontal Line
A horizontal line serves as a visual separator between content, e.g., between two topic blocks or as the end of a section. It consists of three or more dashes.

```
---
```

### Quote
Block quotes start with a > sign and indicate inserted or referenced text. Multiple > signs can represent nested quotes.

```
> This is a simple quote.
> > This is a nested quote.
```

### List
Lists are a structured way to present several related items. Unordered lists use -, * or +, ordered lists use numeric prefixes.

```
- Point A
- Point B

1. First
2. Second
```

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

```
    One tab or four spaces equals one indentation.
```

### Callout
Callouts are extended block elements for displaying contextual information. Depending on the prefix, they convey different meanings.

```
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














