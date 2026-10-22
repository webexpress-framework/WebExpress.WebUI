namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The form a single dataset takes in a line or bar chart. Mixing both forms on one
    /// category axis sets a series apart by its meaning, such as a target line over bars of
    /// the actual values. Only bar and line can share a category axis, so other chart types
    /// have no counterpart here.
    /// </summary>
    public enum TypeDatasetChart
    {
        /// <summary>
        /// The dataset takes the form of the chart.
        /// </summary>
        Default = 0,

        /// <summary>
        /// The dataset is drawn as bars.
        /// </summary>
        Bar = 1,

        /// <summary>
        /// The dataset is drawn as a line.
        /// </summary>
        Line = 2
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeDatasetChart"/> enumeration.
    /// </summary>
    public static class TypeDatasetChartExtensions
    {
        /// <summary>
        /// Converts the form to the value the client-side chart reads from data-datasetN-type.
        /// </summary>
        /// <param name="type">The form to convert.</param>
        /// <returns>The attribute value, or null when the dataset takes the form of the chart.</returns>
        public static string ToType(this TypeDatasetChart type)
        {
            return type switch
            {
                TypeDatasetChart.Bar => "bar",
                TypeDatasetChart.Line => "line",
                _ => null,
            };
        }
    }
}
