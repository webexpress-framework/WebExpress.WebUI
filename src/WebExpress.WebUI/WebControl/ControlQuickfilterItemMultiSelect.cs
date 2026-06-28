using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A multi-select dropdown of related one-click filters within a quick-filter
    /// bar. Unlike the single-choice dropdown, several options can be active at
    /// once (author the options without an exclusive group), the menu stays open
    /// while values are picked, and the toggle shows the number of active options.
    /// </summary>
    public class ControlQuickfilterItemMultiSelect : IControlQuickfilterItem
    {
        private readonly List<ControlQuickfilterItemDropdownItem> _items = [];

        /// <summary>
        /// Gets the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the toggle text shown next to the count of active options.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the toggle icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Returns the options of the multi-select.
        /// </summary>
        public IEnumerable<ControlQuickfilterItemDropdownItem> Items => _items;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlQuickfilterItemMultiSelect(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more options to the multi-select.
        /// </summary>
        /// <param name="items">The options to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlQuickfilterItemMultiSelect Add(params ControlQuickfilterItemDropdownItem[] items)
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
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var text = I18N.Translate(renderContext, Text?.Invoke(renderContext));
            var icon = Icon?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-quickfilter-multiselect")
            };

            html.Add(_items.Select(x => x.Render(renderContext, visualTree)));

            html.AddUserAttribute("data-text", text);
            html.AddUserAttribute("data-icon", (icon as Icon)?.Class);
            html.AddUserAttribute("data-image", (icon as ImageIcon)?.Uri?.ToString());

            return html;
        }
    }
}
