namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for code-namespace.
    /// </summary>
    public class IconCodeNamespace : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconCodeNamespace()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-code-namespace";
    }
}
