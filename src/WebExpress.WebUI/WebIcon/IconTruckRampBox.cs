using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a truck-ramp-box.
    /// </summary>
    public class IconTruckRampBox : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconTruckRampBox"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconTruckRampBox()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconTruckRampBox"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconTruckRampBox(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-truck-ramp-box"
            : "fas fa-truck-ramp-box";
    }
}
