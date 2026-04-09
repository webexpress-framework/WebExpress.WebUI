using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tab control.
    /// </summary>
    public class ControlTab : Control, IControlTab
    {
        private readonly List<IControlTabView> _views = [];

        /// <summary>
        /// Returns the pages of the tab.
        /// </summary>
        public IEnumerable<IControlTabView> Views => _views;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="pages">The pages to add to the tab.</param>
        public ControlTab(string id = null, IControlTabView[] pages = null)
            : base(id)
        {
            _views.AddRange(pages ?? []);
        }

        /// <summary>
        /// Adds one or more pages to the tab.
        /// </summary>
        /// <param name="pages">The pages to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTab Add(params IControlTabView[] pages)
        {
            _views.AddRange(pages);

            return this;
        }

        /// <summary>
        /// Adds one or more pages to the tab.
        /// </summary>
        /// <param name="pages">The pages to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTab Add(IEnumerable<IControlTabView> pages)
        {
            _views.AddRange(pages);

            return this;
        }

        /// <summary>
        /// Removes the specified page from the tab.
        /// </summary>
        /// <param name="page">The page to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTab Remove(IControlTabView page)
        {
            _views.Remove(page);

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
            return Render(renderContext, visualTree, _views);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="pages">The pages to include in the rendered output.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlTabView> pages)
        {
            var classes = Classes.ToList();

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-tab", classes),
                Style = GetStyles(),
                Role = Role
            }
                .Add(pages.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
