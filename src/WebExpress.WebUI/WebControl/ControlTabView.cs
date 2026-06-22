using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A single tab and its content panel within a tab control.
    /// </summary>
    public class ControlTabView : IControlTabView
    {
        private readonly List<IControl> _items = [];

        /// <summary>
        /// Gets or sets the unique identifier for the view.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the title text.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with this view.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets the items of the view control.
        /// </summary>
        public IEnumerable<IControl> Items => _items;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the view.</param>
        public ControlTabView(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more items to the view.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTabView Add(params IControl[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the view.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTabView Add(IEnumerable<IControl> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the view.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTabView Remove(IControl item)
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
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-tab-view"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Title?.Invoke(renderContext)))
                .AddUserAttribute("data-icon", (Icon?.Invoke(renderContext) as Icon)?.Class)
                .AddUserAttribute("data-image", Image?.Invoke(renderContext)?.ToString() ?? (Icon?.Invoke(renderContext) as ImageIcon)?.Uri?.ToString())
                .Add(_items.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
