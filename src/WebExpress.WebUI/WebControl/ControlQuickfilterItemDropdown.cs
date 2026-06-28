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
    /// A dropdown of mutually related one-click filters within a quick-filter bar.
    /// The toggle shows the dropdown label, or the active option once one is
    /// selected; the menu lists the options, each of which is a filter trigger.
    /// Grouping the options exclusively turns the dropdown into a single-choice
    /// filter, which keeps a long list of related filters compact.
    /// </summary>
    public class ControlQuickfilterItemDropdown : IControlQuickfilterItem
    {
        private readonly List<ControlQuickfilterItemDropdownItem> _items = [];

        /// <summary>
        /// Gets the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the toggle text shown when no option is selected.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the toggle icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Returns the options of the dropdown.
        /// </summary>
        public IEnumerable<ControlQuickfilterItemDropdownItem> Items => _items;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlQuickfilterItemDropdown(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more options to the dropdown.
        /// </summary>
        /// <param name="items">The options to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlQuickfilterItemDropdown Add(params ControlQuickfilterItemDropdownItem[] items)
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
                Class = Css.Concatenate("wx-quickfilter-dropdown")
            };

            html.Add(_items.Select(x => x.Render(renderContext, visualTree)));

            html.AddUserAttribute("data-text", text);
            html.AddUserAttribute("data-icon", (icon as Icon)?.Class);
            html.AddUserAttribute("data-image", (icon as ImageIcon)?.Uri?.ToString());

            return html;
        }
    }
}
