namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a stop.
    /// </summary>
    public class IconStop : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconStop"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconStop()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconStop"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconStop(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-stop"
            : "fas fa-stop";
    }
}