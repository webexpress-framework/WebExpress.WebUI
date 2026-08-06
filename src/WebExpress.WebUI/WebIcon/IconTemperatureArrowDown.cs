using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a temperature-arrow-down.
    /// </summary>
    public class IconTemperatureArrowDown : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconTemperatureArrowDown"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconTemperatureArrowDown()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconTemperatureArrowDown"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconTemperatureArrowDown(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-temperature-arrow-down"
            : "fas fa-temperature-arrow-down";
    }
}
