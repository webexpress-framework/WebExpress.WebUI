namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents a balloons icon.
    /// Use this icon for celebrations, parties, or festive occasions.
    /// </summary>
    public class IconBallons : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the light theme.
        /// </summary>
        public IconBallons()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Gets the CSS class for the balloons icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-ballons";
    }
}