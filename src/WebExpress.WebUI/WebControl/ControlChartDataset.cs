namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dataset for a chart control.
    /// </summary>
    public class ControlChartDataset
    {
        /// <summary>
        /// Gets or sets the title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the data. Accepts scalar values or objects for scatter/bubble charts.
        /// </summary>
        public IControlChartDatasetPointCollection Data { get; set; }

        /// <summary>
        /// Gets or sets the background color.
        /// </summary>
        public string BackgroundColor { get; set; }

        /// <summary>
        /// Gets or sets the border color.
        /// </summary>
        public string BorderColor { get; set; }

        /// <summary>
        /// Gets or sets the border width (optional).
        /// </summary>
        public int BorderWidth { get; set; }

        /// <summary>
        /// Gets or sets how the data series are populated.
        /// </summary>
        public TypeFillChart Fill { get; set; } = TypeFillChart.None;

        /// <summary>
        /// Gets or sets how the data series are populated.
        /// </summary>
        public TypePointChart Point { get; set; } = TypePointChart.Circle;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlChartDataset()
        {
        }
    }
}
