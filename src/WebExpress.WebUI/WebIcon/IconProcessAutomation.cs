using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for process-automation.
    /// </summary>
    public class IconProcessAutomation : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconProcessAutomation()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-process-automation";
    }
}
