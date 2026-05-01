namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a bar chart.
    /// </summary>
    public class IconChartBar : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconChartBar"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconChartBar()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconChartBar"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconChartBar(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-chart-bar"
            : "fas fa-chart-bar";
    }
}