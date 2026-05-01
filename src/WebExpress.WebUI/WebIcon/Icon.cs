using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon that can be rendered in either the default (FontAwesome) theme
    /// or the lightweight SVG-based <see cref="TypeIconTheme.Light"/> theme.
    /// </summary>
    public abstract class Icon : IIcon
    {
        /// <summary>
        /// Gets the theme that was selected for this icon instance. The theme is fixed
        /// at construction time and chooses between the FontAwesome glyph
        /// (<see cref="TypeIconTheme.Default"/>) and the lightweight SVG variant
        /// (<see cref="TypeIconTheme.Light"/>).
        /// </summary>
        public TypeIconTheme Theme { get; }

        /// <summary>
        /// Gets the CSS class associated with the icon for the currently selected theme.
        /// Subclasses return the FontAwesome class here; classes that ship a dedicated
        /// light variant override this property to switch on <see cref="Theme"/>.
        /// </summary>
        public abstract string Class { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="Icon"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        protected Icon()
            : this(TypeIconTheme.Default)
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="Icon"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        protected Icon(TypeIconTheme theme)
        {
            Theme = theme;
        }

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
