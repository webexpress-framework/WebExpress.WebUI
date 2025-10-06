namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration representing different types of charts.
    /// </summary>
    public enum TypeChart
    {
        /// <summary>
        /// Line chart type.
        /// </summary>
        Line,

        /// <summary>
        /// Bar chart type.
        /// </summary>
        Bar,

        /// <summary>
        /// Pie chart type.
        /// </summary>
        Pie,

        /// <summary>
        /// Doughnut chart type.
        /// </summary>
        Doughnut,

        /// <summary>
        /// Radar chart type.
        /// </summary>
        Radar,

        /// <summary>
        /// Polar area chart type.
        /// </summary>
        PolarArea,

        /// <summary>
        /// Bubble chart type.
        /// </summary>
        Bubble,

        /// <summary>
        /// Scatter chart type.
        /// </summary>
        Scatter
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeChart"/> enumeration.
    /// </summary>
    public static class TypeChartExtensions
    {
        /// <summary>
        /// Converts the chart type to a corresponding CSS class.
        /// </summary>
        /// <param name="color">The chart type to be converted.</param>
        /// <returns>The CSS class corresponding to the chart type.</returns>
        public static string ToType(this TypeChart color)
        {
            return color switch
            {
                TypeChart.Line => "line",
                TypeChart.Bar => "bar",
                TypeChart.Pie => "pie",
                TypeChart.Doughnut => "doughnut",
                TypeChart.Radar => "radar",
                TypeChart.PolarArea => "polarArea",
                TypeChart.Bubble => "bubble",
                TypeChart.Scatter => "scatter",
                _ => "line",
            };
        }
    }
}
