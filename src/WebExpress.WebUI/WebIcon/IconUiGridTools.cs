using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for ui-grid-tools.
    /// </summary>
    public class IconUiGridTools : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconUiGridTools()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-ui-grid-tools";
    }
}
