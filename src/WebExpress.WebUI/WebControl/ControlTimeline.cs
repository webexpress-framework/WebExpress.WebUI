using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Lays out a sequence of <see cref="ControlTimelineItem"/> entries along a
    /// vertical rail, for an activity feed or a chronological history.
    /// </summary>
    public class ControlTimeline : Control
    {
        private readonly List<ControlTimelineItem> _items = [];

        /// <summary>
        /// Gets the entries of the timeline.
        /// </summary>
        public IEnumerable<ControlTimelineItem> Items => _items;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The entries of the timeline.</param>
        public ControlTimeline(string id = null, params ControlTimelineItem[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more entries to the timeline.
        /// </summary>
        /// <param name="items">The entries to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlTimeline Add(params ControlTimelineItem[] items)
        {
            _items.AddRange(items);

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
            return new HtmlElementTextContentDiv([.. Items.Select(x => x.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = Css.Concatenate("wx-timeline", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            };
        }
    }
}
