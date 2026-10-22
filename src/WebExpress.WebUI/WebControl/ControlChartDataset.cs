namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Holds one series of data points shown in a chart control, together with its display options.
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
        /// Gets or sets the form of the dataset in a line or bar chart, which mixes bars and
        /// lines on one category axis - e.g. a target line over bars of the actual values. Other
        /// chart types ignore it.
        /// </summary>
        public TypeDatasetChart Type { get; set; } = TypeDatasetChart.Default;

        /// <summary>
        /// Gets or sets the area a line dataset fills, which turns a line into an area chart.
        /// </summary>
        public TypeFillChart Fill { get; set; } = TypeFillChart.None;

        /// <summary>
        /// Gets or sets the marker shape of the points of a line, radar or scatter dataset, so
        /// series can be told apart without relying on their color.
        /// </summary>
        public TypePointChart Point { get; set; } = TypePointChart.Circle;

        /// <summary>
        /// Gets or sets how a line dataset runs between its points: straight, as a Bezier curve
        /// or as a monotone curve. Other chart types ignore it.
        /// </summary>
        public TypeCurveChart Curve { get; set; } = TypeCurveChart.Straight;

        /// <summary>
        /// Gets or sets how far a Bezier curve swings out, from 0 (straight) to 1. The default
        /// of 0.4 matches the smooth line of a spreadsheet.
        /// </summary>
        public float Tension { get; set; } = 0.4f;

        /// <summary>
        /// Gets or sets the trendline drawn through the dataset, which shows the direction of the
        /// data in line, bar, scatter and bubble charts. Radial charts ignore it.
        /// </summary>
        public TypeTrendlineChart Trendline { get; set; } = TypeTrendlineChart.None;

        /// <summary>
        /// Gets or sets how many points a moving average trendline averages over. Zero leaves
        /// the choice to the client, which averages over three points.
        /// </summary>
        public int TrendlinePeriod { get; set; }

        /// <summary>
        /// Gets or sets the value axis the dataset is measured on. Null or "y" keeps it on the
        /// left axis; another id such as "y1" puts it on a second axis at the right edge, so a
        /// series of a different magnitude - a revenue over unit counts - stays readable. Only
        /// vertical line and bar charts draw the second axis.
        /// </summary>
        public string YAxisId { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlChartDataset()
        {
        }
    }
}
