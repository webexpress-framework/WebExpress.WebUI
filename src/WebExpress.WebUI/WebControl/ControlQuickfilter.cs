using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a quickfilter control.
    /// </summary>
    public class ControlQuickfilter : Control, IControlQuickfilter
    {
        private readonly List<IControlQuickfilterItem> _items = [];

        /// <summary>
        /// Returns the items of the quickfilter control.
        /// </summary>
        public IEnumerable<IControlQuickfilterItem> Items => _items;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlQuickfilter(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Adds one or more items to the quickfilter control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlQuickfilter Add(params IControlQuickfilterItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the quickfilter control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlQuickfilter Add(IEnumerable<IControlQuickfilterItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the quickfilter control.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlQuickfilter Remove(IControlQuickfilterItem item)
        {
            _items.Remove(item);

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
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-webui-quickfilter",
                Role = "filter"
            }
                .Add(_items.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
