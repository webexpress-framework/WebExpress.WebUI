using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an HTML control that renders HTML markup.
    /// </summary>
    /// <remarks>
    /// The markup is passed through <see cref="HtmlSanitizer"/> unless <see cref="Trusted"/> is
    /// set: a value built from data - a name, a comment, a field of a record - put into the markup
    /// ran as script in every visitor's browser. Set <see cref="Trusted"/> only for markup that
    /// contains nothing a user wrote, and encode what it does contain (<see cref="HtmlText"/>).
    /// </remarks>
    public class ControlHtml : Control
    {
        /// <summary>
        /// Gets or sets the html source code.
        /// </summary>
        public Func<IRenderControlContext, string> Html { get; set; }

        /// <summary>
        /// Gets or sets whether the markup is emitted as it stands - scripts, event handlers and
        /// all - instead of being sanitized.
        /// </summary>
        public bool Trusted { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlHtml(string id = null)
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
            var markup = Html?.Invoke(renderContext);
            var html = new HtmlRaw
            {
                Html = Trusted || string.IsNullOrEmpty(markup) ? markup : HtmlSanitizer.Sanitize(markup)
            };

            return html;
        }
    }
}
