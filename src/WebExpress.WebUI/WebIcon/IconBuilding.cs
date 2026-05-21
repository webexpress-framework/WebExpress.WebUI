using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a building.
    /// </summary>
    public class IconBuilding : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconBuilding"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconBuilding()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconBuilding"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconBuilding(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-building"
            : "fas fa-building";
    }
}
