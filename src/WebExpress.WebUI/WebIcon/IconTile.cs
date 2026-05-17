using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for tiles.
    /// </summary>
    public class IconTile : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class using the light theme.
        /// </summary>
        public IconTile()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. 
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-tile";
    }
}