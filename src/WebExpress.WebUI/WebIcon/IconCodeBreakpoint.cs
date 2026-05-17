using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for code-breakpoint.
    /// </summary>
    public class IconCodeBreakpoint : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconCodeBreakpoint()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-code-breakpoint";
    }
}
