using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for the selection control, drawn as two lists exchanging entries.
    /// </summary>
    public class IconControlSelection : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconControlSelection"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconControlSelection()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconControlSelection"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconControlSelection(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. The control icons exist
        /// only as lightweight SVG variants - FontAwesome ships no glyph for a
        /// specific framework control - so the same class is used in every theme.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-control-selection";
    }
}
