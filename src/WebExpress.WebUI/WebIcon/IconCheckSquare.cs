using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents a check square icon.
    /// Use this icon for completed tasks, confirmations, or selections.
    /// </summary>
    public class IconCheckSquare : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the light theme.
        /// </summary>
        public IconCheckSquare()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Gets the CSS class for the check square icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-check-square";
    }
}