using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for the alert control, drawn as a message box with an exclamation mark.
    /// </summary>
    public class IconControlAlert : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconControlAlert"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconControlAlert()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconControlAlert"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconControlAlert(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. The control icons exist
        /// only as lightweight SVG variants - FontAwesome ships no glyph for a
        /// specific framework control - so the same class is used in every theme.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-control-alert";
    }
}
