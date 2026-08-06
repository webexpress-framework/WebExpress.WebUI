using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a battery-full.
    /// </summary>
    public class IconBatteryFull : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconBatteryFull"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconBatteryFull()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconBatteryFull"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconBatteryFull(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-battery-full"
            : "fas fa-battery-full";
    }
}
