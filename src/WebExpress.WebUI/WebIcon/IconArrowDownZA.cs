using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a arrow-down-z-a.
    /// </summary>
    public class IconArrowDownZA : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconArrowDownZA"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconArrowDownZA()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconArrowDownZA"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconArrowDownZA(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-arrow-down-z-a"
            : "fas fa-arrow-down-z-a";
    }
}
