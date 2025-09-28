using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a responsive sidebar UI control that hosts customizable sidebar items.
    /// </summary>
    public class ControlSidebar : Control, IControlSidebar
    {
        private readonly List<IControlSidebarItem> _items = [];

        /// <summary>
        /// Returns the list of sidebar items.
        /// </summary>
        /// <value>
        /// A list of <see cref="IControlToolbarItem"/> representing the items in the toolbar.
        /// </value>
        public virtual IEnumerable<IControlSidebarItem> Items => _items;

        /// <summary>
        /// Returns or sets the breakpoint value that determines when the layout switches between 
        /// reduced and extended behavior.
        /// </summary>
        public virtual int Breakpoint { get; set; } = -1;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">Die Toolitems</param>
        public ControlSidebar(string id = null, params IControlSidebarItem[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more sidebar items to the sidebar.
        /// </summary>
        /// <param name="items">The sidebar items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlSidebar Add(params IControlSidebarItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more sidebar items to the sidebar.
        /// </summary>
        /// <param name="items">The sidebar items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlSidebar Add(IEnumerable<IControlSidebarItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a sidebar item from the sidebar.
        /// </summary>
        /// <param name="item">The sidebar item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlSidebar Remove(IControlSidebarItem item)
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
            return Render(renderContext, visualTree, Items);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="items">The items to be included in the dropdown.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render
        (
            IRenderControlContext renderContext,
            IVisualTreeControl visualTree,
            IEnumerable<IControlSidebarItem> items
        )
        {
            if (!Enable)
            {
                return null;
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-sidebar", GetClasses()),
                Style = GetStyles(),
                Role = Role
            }
                .Add(items.Select(x => x.Render(renderContext, visualTree)))
                .AddUserAttribute("data-breakpoint", Breakpoint >= 0 ? Breakpoint.ToString() : null);

            return html;
        }
    }
}
