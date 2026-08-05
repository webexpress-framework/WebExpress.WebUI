using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for the quickfilter control, drawn as filter chips followed by an add chip.
    /// </summary>
    public class IconControlQuickfilter : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconControlQuickfilter"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconControlQuickfilter()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconControlQuickfilter"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconControlQuickfilter(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. The control icons exist
        /// only as lightweight SVG variants - FontAwesome ships no glyph for a
        /// specific framework control - so the same class is used in every theme.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-control-quickfilter";
    }
}
