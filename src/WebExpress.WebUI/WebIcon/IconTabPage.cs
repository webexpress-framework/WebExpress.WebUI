using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for tab page.
    /// </summary>
    public class IconTabPage : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class using the light theme.
        /// </summary>
        public IconTabPage()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-tab-page";
    }
}