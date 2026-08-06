using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a arrows-up-to-line.
    /// </summary>
    public class IconArrowsUpToLine : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconArrowsUpToLine"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconArrowsUpToLine()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconArrowsUpToLine"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconArrowsUpToLine(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-arrows-up-to-line"
            : "fas fa-arrows-up-to-line";
    }
}
