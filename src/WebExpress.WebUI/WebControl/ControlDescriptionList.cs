using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Presents a set of term/description pairs as a definition list, for an
    /// object's properties or a key/value summary.
    /// </summary>
    public class ControlDescriptionList : Control
    {
        private readonly List<ControlDescriptionListItem> _items = [];

        /// <summary>
        /// Gets the term/description pairs of the list.
        /// </summary>
        public IEnumerable<ControlDescriptionListItem> Items => _items;

        /// <summary>
        /// Gets or sets a value indicating whether the terms sit beside their
        /// descriptions instead of above them.
        /// </summary>
        public Func<IRenderControlContext, bool> Horizontal { get; set; } = _ => false;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The term/description pairs of the list.</param>
        public ControlDescriptionList(string id = null, params ControlDescriptionListItem[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more pairs to the list.
        /// </summary>
        /// <param name="items">The pairs to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlDescriptionList Add(params ControlDescriptionListItem[] items)
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
            var horizontal = Horizontal?.Invoke(renderContext) ?? false;

            return new HtmlElementTextContentDl([.. Items.Select(x => x.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = Css.Concatenate("wx-description-list", horizontal ? "wx-description-list-horizontal" : "", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            };
        }
    }
}
