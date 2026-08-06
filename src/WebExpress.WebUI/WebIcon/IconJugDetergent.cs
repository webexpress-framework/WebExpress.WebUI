using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a jug-detergent.
    /// </summary>
    public class IconJugDetergent : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconJugDetergent"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconJugDetergent()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconJugDetergent"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconJugDetergent(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-jug-detergent"
            : "fas fa-jug-detergent";
    }
}
