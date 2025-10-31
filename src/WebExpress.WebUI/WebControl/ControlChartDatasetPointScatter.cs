namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a data point for a scatter chart.
    /// </summary>
    public class ControlChartDatasetPointScatter : IControlChartDatasetPoint
    {
        /// <summary>
        /// The x-position of the data point.
        /// </summary>
        public float X { get; set; }

        /// <summary>
        /// The y-position of the data point.
        /// </summary>
        public float Y { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlChartDatasetPointScatter()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with specified coordinates.
        /// </summary>
        /// <param name="x">The x-value.</param>
        /// <param name="y">The y-value.</param>
        public ControlChartDatasetPointScatter(float x, float y)
        {
            X = x;
            Y = y;
        }

        /// <summary>
        /// Returns a string representation of the scatter data.
        /// </summary>
        public override string ToString()
        {
            // returns bubble data as json string
            return $"{{ \"x\": {X}, \"y\": {Y} }}";
        }
    }
}