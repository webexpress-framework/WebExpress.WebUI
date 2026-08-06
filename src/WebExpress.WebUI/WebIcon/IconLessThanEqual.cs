using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a less-than-equal.
    /// </summary>
    public class IconLessThanEqual : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconLessThanEqual"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconLessThanEqual()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconLessThanEqual"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconLessThanEqual(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-less-than-equal"
            : "fas fa-less-than-equal";
    }
}
