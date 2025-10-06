using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a chart control that can be used to display various types of charts.
    /// </summary>
    public class ControlChart : Control
    {
        private readonly List<ControlChartDataset> _datasets = [];

        private List<string> _labels = [];
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
        /// Gets or sets the chart type. The setter returns the instance for fluent chaining.
        /// </summary>
        public TypeChart Type
        {
            get { return _type; }
            set { _type = value; }
        }

        /// <summary>
        /// Fluent setter for Type property.
        /// </summary>
        public ControlChart SetType(TypeChart type)
        {
            Type = type;
            return this;
        }

        /// <summary>
        /// Gets or sets the labels. The setter returns the instance for fluent chaining.
        /// </summary>
        public List<string> Labels
        {
            get { return _labels; }
            set { _labels = value ?? []; }
        }

        /// <summary>
        /// Fluent setter for Labels property.
        /// </summary>
        public ControlChart SetLabels(IEnumerable<string> labels)
        {
            Labels = labels?.ToList() ?? [];
            return this;
        }

        /// <summary>
        /// Gets or sets the chart title. The setter returns the instance for fluent chaining.
        /// </summary>
        public string Title
        {
            get { return _title; }
            set { _title = value; }
        }

        /// <summary>
        /// Fluent setter for Title property.
        /// </summary>
        public ControlChart SetTitle(string title)
        {
            Title = title;
            return this;
        }

        /// <summary>
        /// Gets or sets the x-axis title. The setter returns the instance for fluent chaining.
        /// </summary>
        public string TitleX
        {
            get { return _titleX; }
            set { _titleX = value; }
        }

        /// <summary>
        /// Fluent setter for TitleX property.
        /// </summary>
        public ControlChart SetTitleX(string titleX)
        {
            TitleX = titleX;
            return this;
        }

        /// <summary>
        /// Gets or sets the y-axis title. The setter returns the instance for fluent chaining.
        /// </summary>
        public string TitleY
        {
            get { return _titleY; }
            set { _titleY = value; }
        }

        /// <summary>
        /// Fluent setter for TitleY property.
        /// </summary>
        public ControlChart SetTitleY(string titleY)
        {
            TitleY = titleY;
            return this;
        }

        /// <summary>
        /// Gets or sets the chart width. The setter returns the instance for fluent chaining.
        /// </summary>
        public new int Width
        {
            get { return _width; }
            set { _width = value; }
        }

        /// <summary>
        /// Fluent setter for Width property.
        /// </summary>
        public ControlChart SetWidth(int width)
        {
            Width = width;
            return this;
        }

        /// <summary>
        /// Gets or sets the chart height. The setter returns the instance for fluent chaining.
        /// </summary>
        public new int Height
        {
            get { return _height; }
            set { _height = value; }
        }

        /// <summary>
        /// Fluent setter for Height property.
        /// </summary>
        public ControlChart SetHeight(int height)
        {
            Height = height;
            return this;
        }

        /// <summary>
        /// Gets or sets the minimum y-value. The setter returns the instance for fluent chaining.
        /// </summary>
        public float Minimum
        {
            get { return _minimum; }
            set { _minimum = value; }
        }

        /// <summary>
        /// Fluent setter for Minimum property.
        /// </summary>
        public ControlChart SetMinimum(float minimum)
        {
            Minimum = minimum;
            return this;
        }

        /// <summary>
        /// Gets or sets the maximum y-value. The setter returns the instance for fluent chaining.
        /// </summary>
        public float Maximum
        {
            get { return _maximum; }
            set { _maximum = value; }
        }

        /// <summary>
        /// Fluent setter for Maximum property.
        /// </summary>
        public ControlChart SetMaximum(float maximum)
        {
            Maximum = maximum;
            return this;
        }

        /// <summary>
        /// Gets or sets whether the chart is responsive. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool Responsive
        {
            get { return _responsive; }
            set { _responsive = value; }
        }

        /// <summary>
        /// Fluent setter for Responsive property.
        /// </summary>
        public ControlChart SetResponsive(bool responsive)
        {
            Responsive = responsive;
            return this;
        }

        /// <summary>
        /// Gets or sets whether the chart maintains aspect ratio. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool MaintainAspectRatio
        {
            get { return _maintainAspectRatio; }
            set { _maintainAspectRatio = value; }
        }

        /// <summary>
        /// Fluent setter for MaintainAspectRatio property.
        /// </summary>
        public ControlChart SetMaintainAspectRatio(bool maintainAspectRatio)
        {
            MaintainAspectRatio = maintainAspectRatio;
            return this;
        }

        /// <summary>
        /// Gets or sets whether the legend is displayed. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool LegendDisplay
        {
            get { return _legendDisplay; }
            set { _legendDisplay = value; }
        }

        /// <summary>
        /// Fluent setter for LegendDisplay property.
        /// </summary>
        public ControlChart SetLegendDisplay(bool legendDisplay)
        {
            LegendDisplay = legendDisplay;
            return this;
        }

        /// <summary>
        /// Gets or sets whether the title is displayed. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool TitleDisplay
        {
            get { return _titleDisplay; }
            set { _titleDisplay = value; }
        }

        /// <summary>
        /// Fluent setter for TitleDisplay property.
        /// </summary>
        public ControlChart SetTitleDisplay(bool titleDisplay)
        {
            TitleDisplay = titleDisplay;
            return this;
        }

        /// <summary>
        /// Gets or sets whether the y-axis begins at zero. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool YBeginAtZero
        {
            get { return _yBeginAtZero; }
            set { _yBeginAtZero = value; }
        }

        /// <summary>
        /// Fluent setter for YBeginAtZero property.
        /// </summary>
        public ControlChart SetYBeginAtZero(bool yBeginAtZero)
        {
            YBeginAtZero = yBeginAtZero;
            return this;
        }

        /// <summary>
        /// Gets or sets whether the x-axis begins at zero. The setter returns the instance for fluent chaining.
        /// </summary>
        public bool XBeginAtZero
        {
            get { return _xBeginAtZero; }
            set { _xBeginAtZero = value; }
        }

        /// <summary>
        /// Fluent setter for XBeginAtZero property.
        /// </summary>
        public ControlChart SetXBeginAtZero(bool xBeginAtZero)
        {
            XBeginAtZero = xBeginAtZero;
            return this;
        }

        /// <summary>
        /// Gets the datasets.
        /// </summary>
        public IEnumerable<ControlChartDataset> Data => _datasets;

        /// <summary>
        /// Fluent adder for datasets.
        /// </summary>
        public ControlChart AddDataset(ControlChartDataset dataset)
        {
            if (dataset != null)
            {
                _datasets.Add(dataset);
            }
            return this;
        }

        /// <summary>
        /// Fluent adder for labels.
        /// </summary>
        public ControlChart AddLabel(string label)
        {
            if (!string.IsNullOrEmpty(label))
            {
                _labels.Add(label);
            }
            return this;
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
                if (ds.Data != null && ds.Data.Any())
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
            return System.Text.Json.JsonSerializer.Serialize(obj).Replace("\"", "&quot;");
        }
    }
}
