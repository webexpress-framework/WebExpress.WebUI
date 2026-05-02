namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents a dashboard icon.
    /// Use this icon to symbolize dashboards, overviews, or main panels.
    /// </summary>
    public class IconDashboard : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the light theme.
        /// </summary>
        public IconDashboard()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Gets the CSS class for the dashboard icon, depending on the selected theme.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-dashboard";
    }
}