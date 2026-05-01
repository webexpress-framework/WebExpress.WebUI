namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for git-merge.
    /// </summary>
    public class IconGitMerge : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconGitMerge()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-git-merge";
    }
}
