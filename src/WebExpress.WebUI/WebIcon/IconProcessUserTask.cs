namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for process-user-task.
    /// </summary>
    public class IconProcessUserTask : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconProcessUserTask()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-process-user-task";
    }
}
