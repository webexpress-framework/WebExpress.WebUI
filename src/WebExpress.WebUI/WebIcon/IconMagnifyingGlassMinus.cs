using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a magnifying-glass-minus.
    /// </summary>
    public class IconMagnifyingGlassMinus : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconMagnifyingGlassMinus"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconMagnifyingGlassMinus()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconMagnifyingGlassMinus"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconMagnifyingGlassMinus(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-magnifying-glass-minus"
            : "fas fa-magnifying-glass-minus";
    }
}
