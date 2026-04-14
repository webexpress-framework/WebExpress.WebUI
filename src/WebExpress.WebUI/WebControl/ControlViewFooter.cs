using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a view footer control.
    /// </summary>
    public class ControlViewFooter : IControlViewFooter
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Gets or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Returns the content of the tile control.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlViewFooter(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlViewFooter Add(params IControl[] items)
        {
            _content.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlViewFooter Add(IEnumerable<IControl> items)
        {
            _content.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the view item.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlViewFooter Remove(IControl item)
        {
            _content.Remove(item);

            return this;
        }

        /// <summary>
        /// Converts the column to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-view-footer"
            }
                .Add(_content.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
