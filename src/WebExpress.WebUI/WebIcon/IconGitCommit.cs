namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for git-commit.
    /// </summary>
    public class IconGitCommit : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconGitCommit()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-git-commit";
    }
}
