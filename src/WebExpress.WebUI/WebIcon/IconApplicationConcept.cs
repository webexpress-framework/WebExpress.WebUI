using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for application-concept.
    /// </summary>
    public class IconApplicationConcept : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the light theme.
        /// </summary>
        public IconApplicationConcept()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Gets the CSS class for the application concept icon, depending on the selected theme.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-application-concept"
            : "fas fa-question";
    }
}