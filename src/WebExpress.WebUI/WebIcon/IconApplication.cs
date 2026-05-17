using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an application icon.
    /// Use this icon to symbolize a software application or general app context.
    /// </summary>
    public class IconApplication : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the default theme.
        /// </summary>
        public IconApplication() { }

        /// <summary>
        /// Gets the CSS class for the application icon, depending on the selected theme.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-application"
            : "fas fa-question";
    }
}