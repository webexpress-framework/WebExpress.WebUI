using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a car-tunnel.
    /// </summary>
    public class IconCarTunnel : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconCarTunnel"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconCarTunnel()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconCarTunnel"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconCarTunnel(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-car-tunnel"
            : "fas fa-car-tunnel";
    }
}
