using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a hand-holding-medical.
    /// </summary>
    public class IconHandHoldingMedical : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconHandHoldingMedical"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconHandHoldingMedical()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconHandHoldingMedical"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconHandHoldingMedical(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-hand-holding-medical"
            : "fas fa-hand-holding-medical";
    }
}
