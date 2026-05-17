using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for add-row-above.
    /// </summary>
    public class IconAddRowAbove : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the light theme.
        /// </summary>
        public IconAddRowAbove()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-add-row-above";
    }
}