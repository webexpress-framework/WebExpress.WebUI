namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for process-node.
    /// </summary>
    public class IconProcessNode : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconProcessNode()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-process-node";
    }
}
