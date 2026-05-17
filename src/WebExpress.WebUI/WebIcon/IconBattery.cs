using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents a battery icon.
    /// Use this icon to indicate power, energy, or battery status.
    /// </summary>
    public class IconBattery : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the default theme.
        /// </summary>
        public IconBattery()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Gets the CSS class for the battery icon, depending on the selected theme.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-battery";
    }
}