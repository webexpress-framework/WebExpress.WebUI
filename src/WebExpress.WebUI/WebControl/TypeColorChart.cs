namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the different types of color charts.
    /// </summary>
    public enum TypeColorChart
    {
        /// <summary>
        /// Default color.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Primary color.
        /// </summary>
        Primary = 1,

        /// <summary>
        /// Secondary color.
        /// </summary>
        Secondary = 2,

        /// <summary>
        /// Success color.
        /// </summary>
        Success = 3,

        /// <summary>
        /// Info color.
        /// </summary>
        Info = 4,

        /// <summary>
        /// Warning color.
        /// </summary>
        Warning = 5,

        /// <summary>
        /// Danger color.
        /// </summary>
        Danger = 6,

        /// <summary>
        /// Dark color.
        /// </summary>
        Dark = 7,

        /// <summary>
        /// Light color.
        /// </summary>
        Light = 8,

        /// <summary>
        /// Highlight color.
        /// </summary>
        Highlight = 13
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeColorChart"/> enum.
    /// </summary>
    public static class TypeColorChartExtensions
    {
        /// <summary>
        /// Converts the color to a CSS class.
        /// </summary>
        /// <param name="color">The color to be converted.</param>
        /// <returns>The CSS class corresponding to the color.</returns>
        public static string ToChartColor(this TypeColorChart color)
        {
            switch (color)
            {
                case TypeColorChart.Primary:
                    return "#007bff";
                case TypeColorChart.Secondary:
                    return "#6c757d";
                case TypeColorChart.Success:
                    return "#28a745";
                case TypeColorChart.Info:
                    return "#17a2b8";
                case TypeColorChart.Warning:
                    return "#ffc107";
                case TypeColorChart.Danger:
                    return "#dc3545";
                case TypeColorChart.Light:
                    return "#f8f9fa";
                case TypeColorChart.Dark:
                    return "#343a40";
                case TypeColorChart.Highlight:
                    return "var(--wx-highlight)";
                case TypeColorChart.Default:
                    break;
            }

            return string.Empty;
        }
    }
}
