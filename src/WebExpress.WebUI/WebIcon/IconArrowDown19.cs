using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a arrow-down-1-9.
    /// </summary>
    public class IconArrowDown19 : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconArrowDown19"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconArrowDown19()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconArrowDown19"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconArrowDown19(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-arrow-down-1-9"
            : "fas fa-arrow-down-1-9";
    }
}
