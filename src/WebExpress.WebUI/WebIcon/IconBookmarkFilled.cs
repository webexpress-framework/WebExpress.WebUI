namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents a filled bookmark icon.
    /// Use this icon to indicate saved, favorited, or highlighted items.
    /// </summary>
    public class IconBookmarkFilled : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the light theme.
        /// </summary>
        public IconBookmarkFilled()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Gets the CSS class for the filled bookmark icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-bookmark-filled";
    }
}