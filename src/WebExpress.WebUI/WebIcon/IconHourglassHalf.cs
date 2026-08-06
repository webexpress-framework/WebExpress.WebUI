using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a hourglass-half.
    /// </summary>
    public class IconHourglassHalf : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconHourglassHalf"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconHourglassHalf()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconHourglassHalf"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconHourglassHalf(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-hourglass-half"
            : "fas fa-hourglass-half";
    }
}
