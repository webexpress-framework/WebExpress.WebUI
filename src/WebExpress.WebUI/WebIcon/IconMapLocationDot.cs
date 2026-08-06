using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a map-location-dot.
    /// </summary>
    public class IconMapLocationDot : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconMapLocationDot"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconMapLocationDot()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconMapLocationDot"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconMapLocationDot(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-map-location-dot"
            : "fas fa-map-location-dot";
    }
}
