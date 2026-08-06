using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders a quick-filter bar offering one-click buttons to filter a list.
    /// </summary>
    public class ControlQuickfilter : Control, IControlQuickfilter
    {
        private readonly List<IControlQuickfilterItem> _items = [];

        /// <summary>
        /// Returns the items of the quickfilter control.
        /// </summary>
        public IEnumerable<IControlQuickfilterItem> Items => _items;

        /// <summary>
        /// Gets or sets the action that edits a user-defined filter, typically an
        /// <see cref="ActionModal"/> opening the application's filter dialog.
        /// What a filter selects is the application's business, so the framework
        /// ships no editor: the options menu of a user-defined chip triggers this
        /// action, with the id of the filter appended to its uri.
        /// </summary>
        public Func<IRenderControlContext, IAction> EditAction { get; set; }

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
                .Add(_items.Select(x => x.Render(renderContext, visualTree)))
                .Add(RenderEditAction(renderContext));

            return html;
        }

        /// <summary>
        /// Renders the authored edit action as the prototype the client copies onto the menu of
        /// every user-defined chip.
        /// </summary>
        /// <remarks>
        /// The action is authored once but belongs to every user-defined chip, and those exist only
        /// on the client; it therefore travels as a hidden element the client reads.
        ///
        /// Every rendering of a quickfilter has to emit it. A derived control that builds its own
        /// element must call this as well, otherwise the chips it produces offer removing but no
        /// editing — the client shows that entry only when it found the prototype.
        /// </remarks>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The prototype, or null when no edit action was authored.</returns>
        protected IHtmlNode RenderEditAction(IRenderControlContext renderContext)
        {
            var editAction = EditAction?.Invoke(renderContext);

            if (editAction is null)
            {
                return null;
            }

            var prototype = new HtmlElementTextContentDiv()
            {
                Class = "wx-quickfilter-edit-action",
                Style = "display:none"
            };

            editAction.ApplyUserAttributes(prototype, TypeAction.Primary);

            return prototype;
        }
    }
}
