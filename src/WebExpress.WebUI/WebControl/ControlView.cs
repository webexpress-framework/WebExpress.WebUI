using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a view control.
    /// </summary>
    public class ControlView : Control, IControlView
    {
        private readonly List<IControlViewItem> _views = [];

        /// <summary>
        /// Returns the views of the control.
        /// </summary>
        public IEnumerable<IControlViewItem> Views => _views;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="columns">The columns to add to the table.</param>
        /// <param name="rows">The rows to add to the table.</param>
        public ControlView(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Add(params IControlViewItem[] items)
        {
            _views.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Add(IEnumerable<IControlViewItem> items)
        {
            _views.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the view control.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Remove(IControlViewItem item)
        {
            _views.Remove(item);

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
            var classes = Classes.ToList();

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-view", classes),
                Style = GetStyles(),
                Role = Role
            }
                .Add(_views.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
