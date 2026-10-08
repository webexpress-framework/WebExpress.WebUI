using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a read-only heat map that visualizes a grid of numeric values by colouring each
    /// cell on a gradient from a low to a high colour. It is purely a display control for spotting
    /// patterns and outliers at a glance (activity over time, correlation matrices, density grids).
    /// </summary>
    /// <remarks>
    /// The control only emits a host element carrying the grid as data attributes. The coloured
    /// cells, the gradient interpolation and the optional axis labels are built by the client
    /// runtime (see webexpress.webui.heatmap.js), which keeps the rendered markup small and lets
    /// the grid be updated without a round trip. Values are serialized culture independently
    /// (rows separated by ';', columns by ',') so the client parses them regardless of language.
    /// </remarks>
    public class ControlHeatMap : Control
    {
        /// <summary>
        /// Gets or sets the grid of values, as a sequence of rows, each a sequence of cell values.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<IEnumerable<double>>> Values { get; set; }

        /// <summary>
        /// Gets or sets the value mapped to the low colour. When null, the client uses the
        /// smallest value in the grid, so the gradient always spans the data.
        /// </summary>
        public Func<IRenderControlContext, double?> Min { get; set; }

        /// <summary>
        /// Gets or sets the value mapped to the high colour. When null, the client uses the
        /// largest value in the grid.
        /// </summary>
        public Func<IRenderControlContext, double?> Max { get; set; }

        /// <summary>
        /// Gets or sets the row (vertical axis) labels, one per row.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<string>> RowLabels { get; set; }

        /// <summary>
        /// Gets or sets the column (horizontal axis) labels, one per column.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<string>> ColumnLabels { get; set; }

        /// <summary>
        /// Gets or sets the colour a minimum value is shown in, as any CSS colour. Defaults to a
        /// light tint on the client when not set.
        /// </summary>
        public Func<IRenderControlContext, string> LowColor { get; set; }

        /// <summary>
        /// Gets or sets the colour a maximum value is shown in, as any CSS colour. Defaults to a
        /// saturated tone on the client when not set.
        /// </summary>
        public Func<IRenderControlContext, string> HighColor { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlHeatMap(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var values = Values?.Invoke(renderContext);
            var min = Min?.Invoke(renderContext);
            var max = Max?.Invoke(renderContext);
            var rowLabels = RowLabels?.Invoke(renderContext);
            var columnLabels = ColumnLabels?.Invoke(renderContext);
            var lowColor = LowColor?.Invoke(renderContext);
            var highColor = HighColor?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-heatmap", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("data-values", SerializeValues(values))
                .AddUserAttribute("data-min", min?.ToString(CultureInfo.InvariantCulture))
                .AddUserAttribute("data-max", max?.ToString(CultureInfo.InvariantCulture))
                .AddUserAttribute("data-row-labels", JoinLabels(rowLabels))
                .AddUserAttribute("data-col-labels", JoinLabels(columnLabels))
                .AddUserAttribute("data-low-color", lowColor)
                .AddUserAttribute("data-high-color", highColor);

            return html;
        }

        /// <summary>
        /// Serializes the grid into the compact data attribute token the client parses: each row
        /// is a comma separated list of culture independent numbers, rows joined with a semicolon.
        /// </summary>
        /// <param name="values">The grid of values.</param>
        /// <returns>The serialized grid, or null when there is nothing to render.</returns>
        private static string SerializeValues(IEnumerable<IEnumerable<double>> values)
        {
            if (values is null)
            {
                return null;
            }

            var rows = values
                .Select(row => string.Join(",", row.Select(value => value.ToString(CultureInfo.InvariantCulture))));
            var result = string.Join(";", rows);

            return string.IsNullOrEmpty(result) ? null : result;
        }

        /// <summary>
        /// Joins axis labels into the comma separated data attribute token. Labels are assumed not
        /// to contain a comma, which the client uses as the separator.
        /// </summary>
        /// <param name="labels">The labels.</param>
        /// <returns>The joined labels, or null when there are none.</returns>
        private static string JoinLabels(IEnumerable<string> labels)
        {
            if (labels is null)
            {
                return null;
            }

            var result = string.Join(",", labels);

            return string.IsNullOrEmpty(result) ? null : result;
        }
    }
}
