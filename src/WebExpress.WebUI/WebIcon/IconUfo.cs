using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for ufo.
    /// </summary>
    public class IconUfo : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class using the light theme.
        /// </summary>
        public IconUfo()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-ufo";
    }
}