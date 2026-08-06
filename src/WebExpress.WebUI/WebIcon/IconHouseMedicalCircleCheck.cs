using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a house-medical-circle-check.
    /// </summary>
    public class IconHouseMedicalCircleCheck : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconHouseMedicalCircleCheck"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconHouseMedicalCircleCheck()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconHouseMedicalCircleCheck"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconHouseMedicalCircleCheck(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-house-medical-circle-check"
            : "fas fa-house-medical-circle-check";
    }
}
