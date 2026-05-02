namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an attention icon.
    /// Use this icon to indicate warnings, alerts, or items requiring user attention.
    /// </summary>
    public class IconAttention : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the light theme.
        /// </summary>
        public IconAttention()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Gets the CSS class for the attention icon, depending on the selected theme.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-attention"
            : "fas fa-question";
    }
}