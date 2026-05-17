using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for template.
    /// </summary>
    public class IconTemplate : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class using the light theme.
        /// </summary>
        public IconTemplate()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-template";
    }
}