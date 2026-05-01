namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for ui-components.
    /// </summary>
    public class IconUiComponents : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconUiComponents()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-ui-components";
    }
}
