namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for code-file.
    /// </summary>
    public class IconCodeFile : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconCodeFile()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-code-file";
    }
}
