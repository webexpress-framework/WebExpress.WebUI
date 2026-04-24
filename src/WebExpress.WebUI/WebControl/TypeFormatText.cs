namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The text formats
    /// </summary>
    public enum TypeFormatText
    {
        /// <summary>
        /// The default text format.
        /// </summary>
        Default,

        /// <summary>
        /// Marks the content as a paragraph.
        /// </summary>
        Paragraph,

        /// <summary>
        /// Represents a section of text that is set off from the rest of the content and typically displayed in italic type, without conveying any special importance or emphasis. This could be a taxonomic designation, a technical term, an idiomatic expression, a thought, or the name of a ship.
        /// </summary>
        Italic,

        /// <summary>
        /// Represents a section of text that is set off from the rest of the content and typically displayed in bold type, without conveying any special importance or emphasis. This could be a keyword or product name in a product review.
        /// </summary>
        Bold,

        /// <summary>
        /// Represents a section of text that is set off from the rest of the content and typically displayed with an underline, without conveying any special importance or emphasis. This could be a proper name in Chinese or a section of text that is often misspelled.
        /// </summary>
        Underline,

        /// <summary>
        /// Used for content that is no longer accurate or relevant. Typically displayed with a strikethrough.
        /// </summary>
        StruckOut,

        /// <summary>
        /// Marks the title of a work.
        /// </summary>
        Cite,

        /// <summary>
        /// Marks a top-level heading.
        /// </summary>
        H1,

        /// <summary>
        /// Marks a second-level heading.
        /// </summary>
        H2,

        /// <summary>
        /// Marks a third-level heading.
        /// </summary>
        H3,

        /// <summary>
        /// Marks a fourth-level heading.
        /// </summary>
        H4,

        /// <summary>
        /// Marks a fifth-level heading.
        /// </summary>
        H5,

        /// <summary>
        /// Marks a sixth-level heading.
        /// </summary>
        H6,

        /// <summary>
        /// Marks a general section of text.
        /// </summary>
        Span,

        /// <summary>
        /// Represents the "fine print" of a document, such as disclaimers, copyright notices, or other things that are not essential to understanding the document.
        /// </summary>
        Small,

        /// <summary>
        /// Marks a particularly important (strongly emphasized) text.
        /// </summary>
        Strong,

        /// <summary>
        /// Centers the text.
        /// </summary>
        Center,

        /// <summary>
        /// Marks a piece of programming code.
        /// </summary>
        Code,

        /// <summary>
        /// Marks the output of a program or computer.
        /// </summary>
        Output,

        /// <summary>
        /// Marks a value that specifies a date and time.
        /// </summary>
        Time,

        /// <summary>
        /// Marks subscript text.
        /// </summary>
        Sub,

        /// <summary>
        /// Marks superscript text.
        /// </summary>
        Sup,

        /// <summary>
        /// Represents text that is highlighted for reference purposes, i.e., text that is relevant in another context.
        /// </summary>
        Mark,

        /// <summary>
        /// Marks highlighted text.
        /// </summary>
        Highlight,

        /// <summary>
        /// Represents a term whose definition is contained in the nearest ancestor element.
        /// </summary>
        Definition,

        /// <summary>
        /// Marks an abbreviation or acronym.
        /// </summary>
        Abbreviation,

        /// <summary>
        /// Marks user input.
        /// </summary>
        Input,

        /// <summary>
        /// Marks a quotation.
        /// </summary>
        Blockquote,

        /// <summary>
        /// Marks the caption of a figure.
        /// </summary>
        Figcaption,

        /// <summary>
        /// Marks content as preformatted, meaning that the formatting should be preserved.
        /// </summary>
        Preformatted,

        /// <summary>
        /// Marks text as Markdown, which is converted to HTML.
        /// </summary>
        Markdown
    }
}
