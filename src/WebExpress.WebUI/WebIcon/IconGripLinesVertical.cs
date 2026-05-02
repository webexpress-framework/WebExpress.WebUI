namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a grip-lines-vertical.
    /// </summary>
    public class IconGripLinesVertical : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconGripLinesVertical"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconGripLinesVertical()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconGripLinesVertical"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconGripLinesVertical(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-grip-lines-vertical"
            : "fas fa-grip-lines-vertical";
    }
}