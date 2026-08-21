using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Base class for the stroke icons shipped with the framework. A subclass contributes
    /// nothing but its symbolic name; turning that name into css classes happens here, so
    /// the mapping can later move to a registry of icon sets without touching any of the
    /// icon classes.
    /// </summary>
    public abstract class Icon : IIcon
    {
        /// <summary>
        /// The css class prefix the light set publishes its icons under. The light set is
        /// currently the only set the framework ships, which is why the prefix is a
        /// constant here rather than something resolved per render.
        /// </summary>
        private const string Prefix = "wx-icon-light";

        /// <summary>
        /// Gets the symbolic name of the icon, such as "anchor". It matches the file name
        /// of the svg under Assets/icons and the css class that masks it, which is what
        /// keeps a missing drawing detectable instead of silently rendering nothing.
        /// </summary>
        public abstract string Symbol { get; }

        /// <summary>
        /// Gets the css classes that render the icon: the prefix carries the mask geometry
        /// and the sizing, the second class selects the drawing.
        /// </summary>
        public virtual string Class => $"{Prefix} {Prefix}-{Symbol}";

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
