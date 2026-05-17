using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for vertical bars.
    /// </summary>
    public class IconBarsVertical : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class using the light theme.
        /// </summary>
        public IconBarsVertical()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-bars-vertical";
    }
}