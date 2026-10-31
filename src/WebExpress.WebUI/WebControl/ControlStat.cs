using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a compact metric (KPI) tile: a label, a prominent value, an
    /// optional delta colored by its trend, and an optional icon.
    /// </summary>
    public class ControlStat : Control
    {
        /// <summary>
        /// Gets or sets the caption shown above the value.
        /// </summary>
        public Func<IRenderControlContext, string> Label { get; set; }

        /// <summary>
        /// Gets or sets the prominent value of the metric.
        /// </summary>
        public Func<IRenderControlContext, string> Value { get; set; }

        /// <summary>
        /// Gets or sets the optional change indicator, for example "+12%".
        /// </summary>
        public Func<IRenderControlContext, string> Delta { get; set; }

        /// <summary>
        /// Gets or sets the direction of the change, which colors the delta.
        /// </summary>
        public Func<IRenderControlContext, TypeStatTrend> Trend { get; set; } = _ => TypeStatTrend.Neutral;

        /// <summary>
        /// Gets or sets the optional leading icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlStat(string id = null)
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
            var label = Label?.Invoke(renderContext);
            var value = Value?.Invoke(renderContext);
            var delta = Delta?.Invoke(renderContext);
            var trend = Trend?.Invoke(renderContext) ?? TypeStatTrend.Neutral;
            var icon = Icon?.Invoke(renderContext);

            var body = new HtmlElementTextContentDiv()
            {
                Class = "wx-stat-body"
            };

            if (!string.IsNullOrWhiteSpace(label))
            {
                body.Add(new HtmlElementTextSemanticsSpan(new HtmlText(label)) { Class = "wx-stat-label" });
            }

            body.Add(new HtmlElementTextSemanticsSpan(new HtmlText(value)) { Class = "wx-stat-value" });

            if (!string.IsNullOrWhiteSpace(delta))
            {
                body.Add(new HtmlElementTextSemanticsSpan(new HtmlText(delta)) { Class = Css.Concatenate("wx-stat-delta", trend.ToClass()) });
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-stat", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            };

            if (icon is not null)
            {
                html.Add(new HtmlElementTextContentDiv(new ControlIcon() { Icon = _ => icon }.Render(renderContext, visualTree))
                {
                    Class = "wx-stat-icon"
                });
            }

            html.Add(body);

            return html;
        }
    }
}
