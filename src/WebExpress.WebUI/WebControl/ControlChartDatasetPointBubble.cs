using System.Text.Json.Serialization;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a data point for a bubble chart.
    /// </summary>
    public class ControlChartDatasetPointBubble : IControlChartDatasetPoint
    {
        /// <summary>
        /// The x-position of the bubble.
        /// </summary>
        [JsonPropertyName("x")]
        public float X { get; set; }

        /// <summary>
        /// The y-position of the bubble.
        /// </summary>
        [JsonPropertyName("y")]
        public float Y { get; set; }

        /// <summary>
        /// The radius of the bubble.
        /// </summary>
        [JsonPropertyName("r")]
        public float Radius { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlChartDatasetPointBubble()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with specified coordinates and radius.
        /// </summary>
        /// <param name="x">The x-value.</param>
        /// <param name="y">The y-value.</param>
        /// <param name="radius">The radius.</param>
        public ControlChartDatasetPointBubble(float x, float y, float radius)
        {
            X = x;
            Y = y;
            Radius = radius;
        }

        /// <summary>
        /// Returns a string representation of the bubble data.
        /// </summary>
        public override string ToString()
        {
            // returns bubble data as json string
            return $"{{ \"x\": {X}, \"y\": {Y}, \"r\": {Radius} }}";
        }
    }
}