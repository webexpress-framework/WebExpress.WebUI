using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Converts stored text - the value behind a <see cref="ControlContent"/> - into a
    /// <see cref="PdfDocument"/>.
    /// <para>
    /// It is the server side twin of the reading view: the same value, in the same two
    /// formats, ends up in a file instead of on a page. A
    /// <see cref="TypeFormatContent.RichText"/> value is the working surface of the editor;
    /// <see cref="EditorContent.ReadDocument"/> removes the add-on frames, column resizers,
    /// instruction texts and guard paragraphs first - the rules the client applies in the
    /// reading view - and <see cref="PdfRendererHtml"/> converts what is left. A
    /// <see cref="TypeFormatContent.Markdown"/> value is parsed by the
    /// <see cref="WebMarkdown.MarkdownParser"/> and converted by
    /// <see cref="PdfRendererMarkdown"/>.
    /// </para>
    /// </summary>
    public static class PdfRendererContent
    {
        /// <summary>
        /// Converts a stored value into a PDF document.
        /// </summary>
        /// <param name="content">The value in the format it is stored in.</param>
        /// <param name="format">How the value is written.</param>
        /// <returns>The PDF document, ready to be configured and saved.</returns>
        public static PdfDocument ConvertToPdf(string content, TypeFormatContent format = TypeFormatContent.RichText)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return new PdfDocument();
            }

            return format == TypeFormatContent.Markdown
                ? PdfRendererMarkdown.ConvertMarkdownToPdf(content)
                : EditorContent.ReadDocument(content).ConvertToPdf();
        }

        /// <summary>
        /// Converts the content a <see cref="ControlContent"/> shows into a PDF document. The
        /// control is evaluated in the given context, so a value that depends on the request
        /// - the record of the current page, the language of the user - is the one the user
        /// sees. An empty value yields its placeholder, as on the page.
        /// </summary>
        /// <param name="control">The control.</param>
        /// <param name="renderContext">The context the control is evaluated in.</param>
        /// <returns>The PDF document, ready to be configured and saved.</returns>
        public static PdfDocument ConvertToPdf(this ControlContent control, IRenderControlContext renderContext)
        {
            ArgumentNullException.ThrowIfNull(control);

            var content = control.Content?.Invoke(renderContext);
            var format = control.Format?.Invoke(renderContext) ?? TypeFormatContent.RichText;
            var document = ConvertToPdf(content, format);

            if (!document.Elements.GetEnumerator().MoveNext())
            {
                var placeholder = control.Placeholder?.Invoke(renderContext);

                if (!string.IsNullOrWhiteSpace(placeholder))
                {
                    document.Add(new PdfBlockElementParagraph(I18N.Translate(renderContext, placeholder), new PdfTextStyle
                    {
                        Italic = true,
                        Color = new PdfColor(108, 117, 125)
                    }));
                }
            }

            return document;
        }
    }
}
