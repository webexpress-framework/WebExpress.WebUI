using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a single entry of a <see cref="ControlTimeline"/>: a marker on
    /// the rail, a title, an optional timestamp and a body of content.
    /// </summary>
    public class ControlTimelineItem : Control
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Gets the content shown in the body of the entry.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Gets or sets the title of the entry.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the optional timestamp shown next to the title.
        /// </summary>
        public Func<IRenderControlContext, string> Timestamp { get; set; }

        /// <summary>
        /// Gets or sets the color of the marker. Accepts a system color (emitted
        /// as a CSS class) or a user-defined color (emitted as an inline style).
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackground> Color { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The content shown in the body of the entry.</param>
        public ControlTimelineItem(string id = null, params IControl[] content)
            : base(id)
        {
            _content.AddRange(content);
        }

        /// <summary>
        /// Adds one or more controls to the body of the entry.
        /// </summary>
        /// <param name="content">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlTimelineItem Add(params IControl[] content)
        {
            _content.AddRange(content);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var title = Title?.Invoke(renderContext);
            var timestamp = Timestamp?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);

            var marker = new HtmlElementTextSemanticsSpan()
            {
                Class = Css.Concatenate("wx-timeline-marker", color?.ToClass()),
                Style = color?.ToStyle()
            };

            var head = new HtmlElementTextContentDiv(new HtmlElementTextSemanticsSpan(new HtmlText(title)) { Class = "wx-timeline-title" })
            {
                Class = "wx-timeline-header"
            };

            if (!string.IsNullOrWhiteSpace(timestamp))
            {
                head.Add(new HtmlElementTextSemanticsSpan(new HtmlText(timestamp)) { Class = "wx-timeline-time" });
            }

            var body = new HtmlElementTextContentDiv([.. Content.Select(x => x.Render(renderContext, visualTree))])
            {
                Class = "wx-timeline-body"
            };

            var content = new HtmlElementTextContentDiv(head, body)
            {
                Class = "wx-timeline-content"
            };

            return new HtmlElementTextContentDiv(marker, content)
            {
                Id = Id,
                Class = Css.Concatenate("wx-timeline-item", GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            };
        }
    }
}
