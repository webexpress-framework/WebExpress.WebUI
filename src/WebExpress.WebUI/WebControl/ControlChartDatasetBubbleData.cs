namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a data point for a bubble chart.
    /// </summary>
    public class ControlChartDatasetBubbleData
    {
        /// <summary>
        /// The x-position of the bubble.
        /// </summary>
        public float X { get; set; }

        /// <summary>
        /// The y-position of the bubble.
        /// </summary>
        public float Y { get; set; }

        /// <summary>
        /// The radius of the bubble.
        /// </summary>
        public float R { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlChartDatasetBubbleData()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with specified coordinates and radius.
        /// </summary>
        /// <param name="x">The x-value.</param>
        /// <param name="y">The y-value.</param>
        /// <param name="r">The radius.</param>
        public ControlChartDatasetBubbleData(float x, float y, float r)
        {
            X = x;
            Y = y;
            R = r;
        }

        /// <summary>
        /// Returns a string representation of the bubble data.
        /// </summary>
        public override string ToString()
        {
            // returns bubble data as json string
            return $"{{ \"x\": {X}, \"y\": {Y}, \"r\": {R} }}";
        }
    }
}