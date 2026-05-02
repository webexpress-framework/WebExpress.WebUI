namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents a best practices icon.
    /// Use this icon to highlight recommended actions or guidelines.
    /// </summary>
    public class IconBestPractises : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the light theme.
        /// </summary>
        public IconBestPractises()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Gets the CSS class for the best practices icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-best-practises";
    }
}