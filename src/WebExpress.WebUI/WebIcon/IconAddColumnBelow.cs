using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a add-column-below.
    /// </summary>
    public class IconAddColumnBelow : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconAddColumnBelow()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-add-column-below";
    }
}