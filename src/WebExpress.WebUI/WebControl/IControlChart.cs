using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a chart control that can be used to display various types of charts.
    /// </summary>
    public interface IControlChart : IControl
    {
        /// <summary>
        /// Returns the chart type. The setter returns the instance for fluent chaining.
        /// </summary>
        TypeChart Type { get; }

        /// <summary>
        /// Returns the chart title. The setter returns the instance for fluent chaining.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Returns the x-axis title. The setter returns the instance for fluent chaining.
        /// </summary>
        string TitleX { get; }

        /// <summary>
        /// Returns the y-axis title. The setter returns the instance for fluent chaining.
        /// </summary>
        string TitleY { get; }

        /// <summary>
        /// Returns the chart width. The setter returns the instance for fluent chaining.
        /// </summary>
        new int Width { get; }

        /// <summary>
        /// Returns the chart height. The setter returns the instance for fluent chaining.
        /// </summary>
        new int Height { get; }

        /// <summary>
        /// Returns the minimum y-value. The setter returns the instance for fluent chaining.
        /// </summary>
        float Minimum { get; }

        /// <summary>
        /// Returns the maximum y-value. The setter returns the instance for fluent chaining.
        /// </summary>
        float Maximum { get; }

        /// <summary>
        /// Returns whether the chart is responsive. The setter returns the instance for fluent chaining.
        /// </summary>
        bool Responsive { get; }

        /// <summary>
        /// Returns whether the chart maintains aspect ratio. The setter returns the instance for fluent chaining.
        /// </summary>
        bool MaintainAspectRatio { get; }

        /// <summary>
        /// Returns whether the legend is displayed. The setter returns the instance for fluent chaining.
        /// </summary>
        bool LegendDisplay { get; }

        /// Returns whether the title is displayed. The setter returns the instance for fluent chaining.
        /// </summary>
        bool TitleDisplay { get; }

        /// <summary>
        /// Returns whether the y-axis begins at zero. The setter returns the instance for fluent chaining.
        /// </summary>
        bool YBeginAtZero { get; }

        /// <summary>
        /// Returns whether the x-axis begins at zero. The setter returns the instance for fluent chaining.
        /// </summary>
        bool XBeginAtZero { get; }

        /// <summary>
        /// Returns the datasets.
        /// </summary>
        IEnumerable<ControlChartDataset> Data { get; }

        /// <summary>
        /// Returns the labels. The setter returns the instance for fluent chaining.
        /// </summary>
        IEnumerable<string> Labels { get; }

        /// <summary>
        /// Adds one or more datasets to the control chart.
        /// </summary>
        /// <param name="datasets">
        /// An array of objects to add to the control chart. Each dataset represents a
        /// series of data points to be displayed.
        /// </param>
        /// <returns>The updated instance, including the newly added dataset.</returns>
        IControlChart AddDataset(params ControlChartDataset[] datasets);

        /// <summary>
        /// Adds one or more datasets to the control chart.
        /// </summary>
        /// <param name="datasets">
        /// An array of objects to add to the control chart. Each dataset represents a
        /// series of data points to be displayed.
        /// </param>
        /// <returns>The updated instance, including the newly added dataset.</returns>
        IControlChart AddDataset(IEnumerable<ControlChartDataset> datasets);

        /// <summary>
        /// Adds one or more labels to the control chart.
        /// </summary>
        /// <remarks>
        /// This method allows adding multiple labels at once. If a label already exists in the
        /// chart, it will not be duplicated.
        /// </remarks>
        /// <param name="labels">
        /// An array of labels to add to the chart. Each label represents a distinct category or data point.
        /// </param>
        /// <returns>The updated instance with the added label.</returns>
        IControlChart AddLabel(params string[] labels);

        /// <summary>
        /// Adds one or more labels to the control chart.
        /// </summary>
        /// <remarks>
        /// This method allows adding multiple labels at once. If a label already exists in the
        /// chart, it will not be duplicated.
        /// </remarks>
        /// <param name="labels">
        /// An array of labels to add to the chart. Each label represents a distinct category or data point.
        /// </param>
        /// <returns>The updated instance with the added label.</returns>
        IControlChart AddLabel(IEnumerable<string> labels);
    }
}
