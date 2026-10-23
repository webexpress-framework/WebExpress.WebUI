namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The trendline a chart draws through a dataset, so a reader sees the direction of the data
    /// besides its single values. It applies to line, bar, scatter and bubble charts, where the
    /// data runs along an axis; the radial charts have no course to draw a trend along.
    /// </summary>
    public enum TypeTrendlineChart
    {
        /// <summary>
        /// No trendline.
        /// </summary>
        None = 0,

        /// <summary>
        /// A straight line fitted by least squares, which shows the overall direction.
        /// </summary>
        Linear = 1,

        /// <summary>
        /// The average over a sliding window of points, which smooths out the noise and keeps
        /// the course of the data.
        /// </summary>
        MovingAverage = 2
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeTrendlineChart"/> enumeration.
    /// </summary>
    public static class TypeTrendlineChartExtensions
    {
        /// <summary>
        /// Converts the trendline to the value the client-side chart reads from data-datasetN-trendline.
        /// </summary>
        /// <param name="trendline">The trendline to convert.</param>
        /// <returns>The attribute value, or null for no trendline.</returns>
        public static string ToType(this TypeTrendlineChart trendline)
        {
            return trendline switch
            {
                TypeTrendlineChart.Linear => "linear",
                TypeTrendlineChart.MovingAverage => "moving-average",
                _ => null,
            };
        }
    }
}
