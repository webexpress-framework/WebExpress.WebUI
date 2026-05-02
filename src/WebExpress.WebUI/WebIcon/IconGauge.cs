namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a gauge.
    /// </summary>
    public class IconGauge : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconGauge"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconGauge()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconGauge"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconGauge(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-gauge"
            : "fas fa-gauge";
    }
}