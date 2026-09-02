using System;
using System.Text;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebMarkdown;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the reading view of stored text, in either of the two formats a value is
    /// authored in.
    /// <para>
    /// <see cref="TypeFormatContent.RichText"/> is what the editor
    /// (<see cref="ControlFormItemInputText"/> in the <see cref="TypeEditTextFormat.Wysiwyg"/>
    /// format) stores: its whole working surface rather than a document, where add-ons keep
    /// the frame that names, moves and configures them, tables keep their column resizers,
    /// and blocks that must not be typed into are fenced by the empty paragraphs the caret
    /// needs. This control hands that value to the client, which strips the editing
    /// scaffolding and renders the document itself, so one stored value serves both the
    /// author and the reader instead of a second, hand-maintained representation.
    /// </para>
    /// <para>
    /// <see cref="TypeFormatContent.Markdown"/> is for a value that is kept as plain text -
    /// a description field, an imported document, a README. It is parsed on the server by
    /// the same <see cref="WebMarkdown.MarkdownParser"/> that backs
    /// <see cref="ControlText"/>, so both controls render the same document from the same
    /// source, and the reading view stays a single client-side implementation. A value
    /// authored in the editor can be brought into this format with
    /// <see cref="EditorContent.ConvertToMarkdown"/>.
    /// </para>
    /// <para>
    /// It is display only and never contributes a value to a form. It is the read side of
    /// <see cref="ControlSmartEdit"/> and of <see cref="ControlTableTemplateEditor"/>, which
    /// build the same view on the client whenever their editor is not active.
    /// </para>
    /// </summary>
    public class ControlContent : Control
    {
        /// <summary>
        /// Gets or sets the content in the raw format it is stored in. What that format is,
        /// is decided by <see cref="Format"/>.
        /// </summary>
        public Func<IRenderControlContext, string> Content { get; set; }

        /// <summary>
        /// Gets or sets how the content is written. Markdown is turned into markup by the
        /// same parser <see cref="ControlText"/> uses, so both controls read the same
        /// document from the same source.
        /// </summary>
        public Func<IRenderControlContext, TypeFormatContent> Format { get; set; }

        /// <summary>
        /// Gets or sets the text that stands in for content that is not set. Without it an
        /// empty value renders nothing at all, which is what a display control embedded in a
        /// larger layout usually wants.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the instruction texts survive into the
        /// reading view. They address whoever edits the document, so they are dropped by
        /// default; a proof-reading view is the case for keeping them. Markdown has none.
        /// </summary>
        public Func<IRenderControlContext, bool> Instruction { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlContent(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var content = Content?.Invoke(renderContext) ?? "";
            var placeholder = Placeholder?.Invoke(renderContext);
            var instruction = Instruction?.Invoke(renderContext) ?? false;
            var format = Format?.Invoke(renderContext) ?? TypeFormatContent.RichText;

            // markdown becomes markup here rather than on the client, because the framework
            // already parses it on the server for ControlText - a second, client-side
            // implementation would be a subset of it and would drift away from it
            var markup = format == TypeFormatContent.Markdown && !string.IsNullOrEmpty(content)
                ? MarkdownParser.Parse(content).ConvertToHtml(renderContext)?.ToString() ?? ""
                : content;

            // the value is transported encoded so the browser never lays out the editing
            // markup - live contenteditable islands, add-on headers, drag handles - in the
            // moment before the reading view replaces it
            var encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(markup));

            var html = new HtmlElementTextContentDiv(new HtmlText(encoded))
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-content", GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("data-placeholder", I18N.Translate(renderContext, placeholder))
                .AddUserAttribute("data-instruction", instruction ? "true" : null)
                .AddUserAttribute("data-base64", "true");

            return html;
        }
    }
}
