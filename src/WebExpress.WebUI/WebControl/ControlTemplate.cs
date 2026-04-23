using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a template control that is rendered by the client-side TemplateCtrl.
    /// </summary>
    public class ControlTemplate : Control
    {
        private readonly List<ControlTemplateItem> _items = [];

        /// <summary>
        /// Returns the template items.
        /// </summary>
        public IEnumerable<ControlTemplateItem> Items => _items;

        /// <summary>
        /// Gets or sets the template id rendered on the child template tag.
        /// </summary>
        public string TemplateId { get; set; }

        /// <summary>
        /// Gets or sets optional json model data for initial rendering.
        /// </summary>
        public string Model { get; set; }

        /// <summary>
        /// Gets or sets the foreach expression.
        /// </summary>
        public string ForEach { get; set; }

        /// <summary>
        /// Gets or sets the if expression.
        /// </summary>
        public string If { get; set; }

        /// <summary>
        /// Gets or sets the inverse if expression.
        /// </summary>
        public string IfNot { get; set; }

        /// <summary>
        /// Gets or sets an empty check expression.
        /// </summary>
        public string IfEmpty { get; set; }

        /// <summary>
        /// Gets or sets a not-empty check expression.
        /// </summary>
        public string IfNotEmpty { get; set; }

        /// <summary>
        /// Gets or sets the bind expression.
        /// </summary>
        public string Bind { get; set; }

        /// <summary>
        /// Gets or sets the action name.
        /// </summary>
        public string Action { get; set; }

        /// <summary>
        /// Gets or sets the action parameter expression.
        /// </summary>
        public string ActionParam { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The template items.</param>
        public ControlTemplate(string id = null, params ControlTemplateItem[] items)
            : base(id)
        {
            _items.AddRange(items ?? []);
        }

        /// <summary>
        /// Adds one or more template items.
        /// </summary>
        /// <param name="items">Items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTemplate Add(params ControlTemplateItem[] items)
        {
            _items.AddRange(items ?? []);

            return this;
        }

        /// <summary>
        /// Adds one or more template items.
        /// </summary>
        /// <param name="items">Items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTemplate Add(IEnumerable<ControlTemplateItem> items)
        {
            _items.AddRange(items ?? []);

            return this;
        }

        /// <summary>
        /// Removes a template item.
        /// </summary>
        /// <param name="item">Item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTemplate Remove(ControlTemplateItem item)
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
            if (!Enable)
            {
                return null;
            }

            var effectiveTemplateId = string.IsNullOrWhiteSpace(TemplateId) && !string.IsNullOrWhiteSpace(Id) ? $"{Id}_template" : TemplateId;
            var template = new HtmlElement("template")
            {
                Id = effectiveTemplateId
            }
                .Add(_items.Select(x => x?.Render(renderContext, visualTree)));

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-template", GetClasses()),
                Style = GetStyles(),
                Role = Role
            }
                .AddUserAttribute("data-template", effectiveTemplateId)
                .AddUserAttribute("data-model", Model)
                .AddUserAttribute("data-foreach", ForEach)
                .AddUserAttribute("data-if", If)
                .AddUserAttribute("data-if-not", IfNot)
                .AddUserAttribute("data-if-empty", IfEmpty)
                .AddUserAttribute("data-if-not-empty", IfNotEmpty)
                .AddUserAttribute("data-bind", Bind)
                .AddUserAttribute("data-action", Action)
                .AddUserAttribute("data-action-param", ActionParam)
                .Add(template);

            return html;
        }
    }
}
