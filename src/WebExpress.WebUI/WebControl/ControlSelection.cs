using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a read only selection control.
    /// </summary>
    public class ControlSelection : Control, IControlSelection
    {
        private readonly List<IControlFormItemInputSelectionItem> _options = [];

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSelection(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlSelection Add(params IControlFormItemInputSelectionItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlSelection Add(IEnumerable<IControlFormItemInputSelectionItem> items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes an item from the selection options.
        /// </summary>
        /// <param name="item">The item to remove from the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlSelection Remove(IControlFormItemInputSelectionItem item)
        {
            _options.Remove(item);

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
                Class = "wx-webui-selection"
            }
                .AddUserAttribute("data-value", Value)
                .Add(_options.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
