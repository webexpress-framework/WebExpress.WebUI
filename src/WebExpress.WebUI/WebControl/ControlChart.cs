using System.Collections.Generic;
using System.Globalization;
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
        private TypeChart _type;
        private string _title;
        private string _titleX;
        private string _titleY;
        private int _width;
        private int _height;
        private float _minimum = float.MinValue;
        private float _maximum = float.MaxValue;
        private bool _responsive;
        private bool _maintainAspectRatio;
        private bool _legendDisplay;
        private bool _titleDisplay;
        private bool _yBeginAtZero;
        private bool _xBeginAtZero;

        /// <summary>
        /// Returns or sets the chart type. The setter returns the instance for fluent chaining.
        /// </summary>
        public TypeChart Type
        {
            get { return _type; }
            set { _type = value; }
        }

        /// <summary>
        /// Returns or sets the chart title. The setter returns the instance for fluent chaining.
        /// </summary>
        public string Title
        {
            get { return _title; }
            set { _title = value; }
        }

        /// <summary>
        /// Returns or sets the x-axis title. The setter returns the instance for fluent chaining.
        /// </summary>
        public string TitleX
        {
            get { return _titleX; }
            set { _titleX = value; }
        }

        /// <summary>
        /// Returns or sets the y-axis title. The setter returns the instance for fluent chaining.
        /// </summary>
        public string TitleY
        {
            get { return _titleY; }
            set { _titleY = value; }
        }

        /// <summary>
        /// Returns or sets the chart width. The setter returns the instance for fluent chaining.
        /// </summary>
        public new int Width
        {
            get { return _width; }
            set { _width = value; }
        }

        /// <summary>
        /// Returns or sets the chart height. The setter returns the instance for fluent chaining.
        /// </summary>
        public new int Height
        {
            get { return _height; }
            set { _height = value; }
        }

        /// <summary>
        /// Returns or sets the minimum y-value. The setter returns the instance for fluent chaining.
        /// </summary>
        public float Minimum
        {
            get { return _minimum; }
            set { _minimum = value; }
        }

        /// <summary>
        /// Returns or sets the maximum y-value. The setter returns the instance for fluent chaining.
        /// </summary>
        public float Maximum
        {
            get { return _maximum; }
            set { _maximum = value; }
        }

        /// <summary>
        /// Returns or sets whether the chart is responsive. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool Responsive
        {
            get { return _responsive; }
            set { _responsive = value; }
        }

        /// <summary>
        /// Returns or sets whether the chart maintains aspect ratio. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool MaintainAspectRatio
        {
            get { return _maintainAspectRatio; }
            set { _maintainAspectRatio = value; }
        }

        /// <summary>
        /// Returns or sets whether the legend is displayed. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool LegendDisplay
        {
            get { return _legendDisplay; }
            set { _legendDisplay = value; }
        }

        /// <summary>
        /// Returns or sets whether the title is displayed. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool TitleDisplay
        {
            get { return _titleDisplay; }
            set { _titleDisplay = value; }
        }

        /// <summary>
        /// Returns or sets whether the y-axis begins at zero. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool YBeginAtZero
        {
            get { return _yBeginAtZero; }
            set { _yBeginAtZero = value; }
        }

        /// <summary>
        /// Returns or sets whether the x-axis begins at zero. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool XBeginAtZero
        {
            get { return _xBeginAtZero; }
            set { _xBeginAtZero = value; }
        }

        /// <summary>
        /// Returns the datasets.
        /// </summary>
        public IEnumerable<ControlChartDataset> Data => _datasets;

        /// <summary>
        /// Returns the labels. The setter returns the instance for fluent chaining.
        /// </summary>
        public IEnumerable<string> Labels => _labels;

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
        }

        /// <summary>
        /// Converts the control to an HTML representation using data-attributes for ChartCtrl.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-chart", GetClasses()),
                Style = GetStyles(),
                Role = Role
            }
                // set chart type
                .AddUserAttribute("data-type", _type.ToType())
                // set chart labels as json array
                .AddUserAttribute("data-labels", _labels.Count != 0 ? SerializeJson(_labels) : null)
                // set option flags
                .AddUserAttribute("data-responsive", _responsive ? "true" : null)
                .AddUserAttribute("data-maintain-aspect-ratio", _maintainAspectRatio ? "true" : null)
                .AddUserAttribute("data-legend-display", _legendDisplay ? "true" : null)
                .AddUserAttribute("data-title-display", _titleDisplay ? "true" : null)
                // set translated titles and axis settings
                .AddUserAttribute("data-title-text", I18N.Translate(renderContext, _title))
                .AddUserAttribute("data-scale-y-begin-at-zero", _yBeginAtZero ? "true" : null)
                .AddUserAttribute("data-scale-y-title", I18N.Translate(renderContext, _titleY))
                .AddUserAttribute("data-scale-x-begin-at-zero", _xBeginAtZero ? "true" : null)
                .AddUserAttribute("data-scale-x-title", I18N.Translate(renderContext, _titleX))
                // set min/max values for y axis
                .AddUserAttribute("data-scale-y-min", _minimum > float.MinValue ? _minimum.ToString(CultureInfo.InvariantCulture) : null)
                .AddUserAttribute("data-scale-y-max", _maximum < float.MaxValue ? _maximum.ToString(CultureInfo.InvariantCulture) : null)
                // set width and height
                .AddUserAttribute("data-width", _width > 0 ? _width.ToString(CultureInfo.InvariantCulture) : null)
                .AddUserAttribute("data-height", _height > 0 ? _height.ToString(CultureInfo.InvariantCulture) : null)
                // set dataset count
                .AddUserAttribute("data-dataset-count", _datasets.Count > 0 ? _datasets.Count.ToString(CultureInfo.InvariantCulture) : null);

            var dsIndex = 0;
            foreach (var ds in _datasets)
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
