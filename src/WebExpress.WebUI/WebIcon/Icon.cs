using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon that aligns content to the center.
    /// </summary>
    public abstract class Icon : IIcon
    {
        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public abstract string Class { get; }

        /// <summary>
        /// Converts the icon to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the icon is rendered.</param>
        /// <param name="visualTree">The visual tree representing the icon's structure.</param>
        /// <param name="id">The id attribute of the HTML element.</param>
        /// <param name="description">The description of the icon.</param>
        /// <param name="css">The CSS class of the HTML element.</param>
        /// <param name="style">The inline style of the HTML element.</param>
        /// <param name="role">The ARIA role of the HTML element.</param>
        /// <returns>An HTML node representing the rendered icon.</returns>
        public IHtmlNode Render(IRenderContext renderContext, IVisualTree visualTree, string id = null, string description = null, string css = null, string style = null, string role = null)
        {
            var html = new HtmlElementTextSemanticsI()
            {
                Id = id,
                Class = Css.Concatenate([Class, css]),
                Style = style,
                Role = role
            };

            html.AddUserAttribute("title", description);

            return html;
        }
    }
}
