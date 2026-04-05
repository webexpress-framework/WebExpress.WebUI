using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that renders a move in a table using a template.
    /// </summary>
    public class ControlTableTemplateMove : IControlTableTemplateEditable
    {
        private readonly List<IControlFormItemInputMoveItem> _options = [];

        /// <summary>
        /// Returns the entries.
        /// </summary>
        public IEnumerable<IControlFormItemInputMoveItem> Options => _options;

        /// <summary>
        /// Returns or sets the unique identifier for the object.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether the current template is editable or read-only.
        /// </summary>
        public bool Editable { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTableTemplateMove(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more items to the available options list.
        /// </summary>
        /// <param name="items">The items to add to the available options list.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlTableTemplateMove Add(params IControlFormItemInputMoveItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the available options list.
        /// </summary>
        /// <param name="items">The items to add to the available options list.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlTableTemplateMove Add(IEnumerable<IControlFormItemInputMoveItem> items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a specific item from the available options list.
        /// </summary>
        /// <param name="item">The item to remove from the available options list.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlTableTemplateMove Remove(IControlFormItemInputMoveItem item)
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
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElement("template")
            {
                Id = Id
            }
                .AddUserAttribute("data-type", "move")
                .AddUserAttribute("data-editable", Editable ? "true" : null)
                .Add(_options.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
