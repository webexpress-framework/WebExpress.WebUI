using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a arrow-rotate-left.
    /// </summary>
    public class IconArrowRotateLeft : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconArrowRotateLeft"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconArrowRotateLeft()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconArrowRotateLeft"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconArrowRotateLeft(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-arrow-rotate-left"
            : "fas fa-arrow-rotate-left";
    }
}
