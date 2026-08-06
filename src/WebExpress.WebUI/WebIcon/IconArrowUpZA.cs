using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a arrow-up-z-a.
    /// </summary>
    public class IconArrowUpZA : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconArrowUpZA"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconArrowUpZA()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconArrowUpZA"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconArrowUpZA(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-arrow-up-z-a"
            : "fas fa-arrow-up-z-a";
    }
}
