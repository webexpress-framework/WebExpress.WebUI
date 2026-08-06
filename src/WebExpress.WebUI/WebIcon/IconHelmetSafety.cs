using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a helmet-safety.
    /// </summary>
    public class IconHelmetSafety : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconHelmetSafety"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconHelmetSafety()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconHelmetSafety"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconHelmetSafety(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-helmet-safety"
            : "fas fa-helmet-safety";
    }
}
