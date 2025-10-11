namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a scalar data point in a control chart dataset.
    /// </summary>
    /// <remarks>
    /// This class encapsulates a single scalar value, which can be used to represent a 
    /// data point in control chart visualizations or calculations.
    /// </remarks>
    public class ControlChartDatasetPointScalar : IControlChartDatasetPoint
    {
        /// <summary>
        /// Returns or sets the numeric value represented by this instance.
        /// </summary>
        public float Value { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified value.
        /// </summary>
        /// <param name="value">The scalar value associated with the dataset point.</param>
        public ControlChartDatasetPointScalar(float value)
        {
            Value = value;
        }
    }
}
