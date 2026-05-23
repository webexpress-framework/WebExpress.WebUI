using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a chart control that can be used to display various types of charts.
    /// </summary>
    public class ControlChart : Control, IControlChart
    {
        private static readonly JsonSerializerOptions _options = new()
        {
            WriteIndented = false,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
            Converters = { new ControlChartDatasetPointCollectionConverter() }
        };
        private readonly List<ControlChartDataset> _datasets = [];
        private readonly List<string> _labels = [];

        /// <summary>
        /// Gets or sets the chart type. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, TypeChart> Type { get; set; } = _ => TypeChart.Line;

        /// <summary>
        /// Gets or sets the chart title. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the x-axis title. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, string> TitleX { get; set; }

        /// <summary>
        /// Gets or sets the y-axis title. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, string> TitleY { get; set; }

        /// <summary>
        /// Gets or sets the chart width. The setter returns the instance for fluent chaining.
        /// </summary>
        public new Func<IRenderControlContext, int> Width { get; set; }

        /// <summary>
        /// Gets or sets the chart height. The setter returns the instance for fluent chaining.
        /// </summary>
        public new Func<IRenderControlContext, int> Height { get; set; }

        /// <summary>
        /// Gets or sets the minimum y-value. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, float> Minimum { get; set; } = _ => float.MinValue;

        /// <summary>
        /// Gets or sets the maximum y-value. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, float> Maximum { get; set; } = _ => float.MaxValue;

        /// <summary>
        /// Gets or sets whether the chart is responsive. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, bool> Responsive { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets whether the chart maintains aspect ratio. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, bool> MaintainAspectRatio { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets whether the legend is displayed. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, bool> LegendDisplay { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets whether the title is displayed. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, bool> TitleDisplay { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets whether the y-axis begins at zero. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, bool> YBeginAtZero { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets whether the x-axis begins at zero. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, bool> XBeginAtZero { get; set; } = _ => false;

        /// <summary>
        /// Returns the datasets.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<ControlChartDataset>> Data { get; set; }

        /// <summary>
        /// Returns the labels. The setter returns the instance for fluent chaining.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<string>> Labels { get; set; }

        /// <summary>
        /// Adds one or more datasets to the control chart.
        /// </summary>
        /// <param name="datasets">
        /// An array of objects to add to the control chart. Each dataset represents a
        /// series of data points to be displayed.
        /// </param>
        /// <returns>The updated instance, including the newly added dataset.</returns>
        public IControlChart AddDataset(params ControlChartDataset[] datasets)
        {
            _datasets.AddRange(datasets);

            return this;
        }

        /// <summary>
        /// Adds one or more datasets to the control chart.
        /// </summary>
        /// <param name="datasets">
        /// An array of objects to add to the control chart. Each dataset represents a
        /// series of data points to be displayed.
        /// </param>
        /// <returns>The updated instance, including the newly added dataset.</returns>
        public IControlChart AddDataset(IEnumerable<ControlChartDataset> datasets)
        {
            _datasets.AddRange(datasets);

            return this;
        }

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
        public IControlChart AddLabel(params string[] labels)
        {
            _labels.AddRange(labels);

            return this;
        }

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
        public IControlChart AddLabel(IEnumerable<string> labels)
        {
            _labels.AddRange(labels);

            return this;
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="datasets">The datasets to be used in the chart.</param>
        public ControlChart(string id = null, params ControlChartDataset[] datasets)
            : base(id)
        {
            _datasets.AddRange(datasets);
            Data = _ => _datasets;
            Labels = _ => _labels;
        }

        /// <summary>
        /// Converts the control to an HTML representation using data-attributes for ChartCtrl.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var type = Type?.Invoke(renderContext) ?? TypeChart.Line;
            var labels = Labels?.Invoke(renderContext);
            var responsive = Responsive?.Invoke(renderContext) ?? false;
            var maintainAspectRatio = MaintainAspectRatio?.Invoke(renderContext) ?? false;
            var legendDisplay = LegendDisplay?.Invoke(renderContext) ?? false;
            var titleDisplay = TitleDisplay?.Invoke(renderContext) ?? false;
            var title = Title?.Invoke(renderContext);
            var yBeginAtZero = YBeginAtZero?.Invoke(renderContext) ?? false;
            var titleY = TitleY?.Invoke(renderContext);
            var xBeginAtZero = XBeginAtZero?.Invoke(renderContext) ?? false;
            var titleX = TitleX?.Invoke(renderContext);
            var minimum = Minimum?.Invoke(renderContext) ?? float.MinValue;
            var maximum = Maximum?.Invoke(renderContext) ?? float.MaxValue;
            var width = Width?.Invoke(renderContext) ?? 0;
            var height = Height?.Invoke(renderContext) ?? 0;
            var datasets = Data?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-chart", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role
            }
                // set chart type
                .AddUserAttribute("data-type", type.ToType())
                // set chart labels as json array
                .AddUserAttribute("data-labels", labels?.Any() == true ? SerializeJson(labels) : null)
                // set option flags
                .AddUserAttribute("data-responsive", responsive ? "true" : null)
                .AddUserAttribute("data-maintain-aspect-ratio", maintainAspectRatio ? "true" : null)
                .AddUserAttribute("data-legend-display", legendDisplay ? "true" : null)
                .AddUserAttribute("data-title-display", titleDisplay ? "true" : null)
                // set translated titles and axis settings
                .AddUserAttribute("data-title-text", I18N.Translate(renderContext, title))
                .AddUserAttribute("data-scale-y-begin-at-zero", yBeginAtZero ? "true" : null)
                .AddUserAttribute("data-scale-y-title", I18N.Translate(renderContext, titleY))
                .AddUserAttribute("data-scale-x-begin-at-zero", xBeginAtZero ? "true" : null)
                .AddUserAttribute("data-scale-x-title", I18N.Translate(renderContext, titleX))
                // set min/max values for y axis
                .AddUserAttribute("data-scale-y-min", minimum > float.MinValue ? minimum.ToString(CultureInfo.InvariantCulture) : null)
                .AddUserAttribute("data-scale-y-max", maximum < float.MaxValue ? maximum.ToString(CultureInfo.InvariantCulture) : null)
                // set width and height
                .AddUserAttribute("data-width", width > 0 ? width.ToString(CultureInfo.InvariantCulture) : null)
                .AddUserAttribute("data-height", height > 0 ? height.ToString(CultureInfo.InvariantCulture) : null)
                // set dataset count
                .AddUserAttribute("data-dataset-count", datasets?.Any() == true ? datasets.Count().ToString(CultureInfo.InvariantCulture) : null);

            var dsIndex = 0;
            foreach (var ds in datasets ?? [])
            {
                if (dsIndex >= 10)
                {
                    break;
                }
                var prefix = $"data-dataset{dsIndex}-";
                if (!string.IsNullOrWhiteSpace(ds.Title))
                {
                    html = html.AddUserAttribute(prefix + "label", ds.Title);
                }
                if (ds.Data is not null && ds.Data.Count != 0)
                {
                    html = html.AddUserAttribute(prefix + "data", SerializeJson(ds.Data));
                }
                if (!string.IsNullOrWhiteSpace(ds.BackgroundColor))
                {
                    html = html.AddUserAttribute(prefix + "background-color", ds.BackgroundColor);
                }
                if (!string.IsNullOrWhiteSpace(ds.BorderColor))
                {
                    html = html.AddUserAttribute(prefix + "border-color", ds.BorderColor);
                }
                if (ds.BorderWidth > 0)
                {
                    html = html.AddUserAttribute(prefix + "border-width", ds.BorderWidth.ToString(CultureInfo.InvariantCulture));
                }
                dsIndex++;
            }

            return html;
        }

        /// <summary>
        /// Serializes an object to a compact JSON string.
        /// </summary>
        /// <param name="obj">The object to serialize.</param>
        /// <returns>JSON string.</returns>
        private static string SerializeJson(object obj)
        {
            return JsonSerializer
                .Serialize(obj, _options)
                .Replace("\"", "&quot;");
        }
    }
}
