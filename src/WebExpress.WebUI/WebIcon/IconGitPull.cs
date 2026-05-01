namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for git-pull.
    /// </summary>
    public class IconGitPull : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconGitPull()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-git-pull";
    }
}
