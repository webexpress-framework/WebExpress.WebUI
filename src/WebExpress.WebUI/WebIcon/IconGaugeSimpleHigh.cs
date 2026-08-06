using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a gauge-simple-high.
    /// </summary>
    public class IconGaugeSimpleHigh : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconGaugeSimpleHigh"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconGaugeSimpleHigh()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconGaugeSimpleHigh"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconGaugeSimpleHigh(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-gauge-simple-high"
            : "fas fa-gauge-simple-high";
    }
}
