namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for ui-drag-handle.
    /// </summary>
    public class IconUiDragHandle : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconUiDragHandle()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-ui-drag-handle";
    }
}
