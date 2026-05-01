namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for code-debug.
    /// </summary>
    public class IconCodeDebug : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconCodeDebug()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-code-debug";
    }
}
