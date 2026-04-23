using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item inside a template definition.
    /// </summary>
    public class ControlTemplateItem : Control
    {
        private readonly List<IControl> _items = [];
        private readonly Dictionary<string, string> _dynamicClass = [];
        private readonly Dictionary<string, string> _dynamicStyle = [];
        private readonly Dictionary<string, string> _dynamicAria = [];

        /// <summary>
        /// Returns all child controls of the template item.
        /// </summary>
        public IEnumerable<IControl> Items => _items;

        /// <summary>
        /// Gets or sets the html tag of the rendered item.
        /// </summary>
        public string TagName { get; set; } = "div";

        /// <summary>
        /// Gets or sets a text content (supports placeholders like {{name}}).
        /// </summary>
        public string Text { get; set; }

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
        /// Gets or sets the action name.
        /// </summary>
        public string Action { get; set; }

        /// <summary>
        /// Gets or sets the action parameter expression.
        /// </summary>
        public string ActionParam { get; set; }

        /// <summary>
        /// Gets or sets the bind expression.
        /// </summary>
        public string Bind { get; set; }

        /// <summary>
        /// Gets or sets the nested template reference.
        /// </summary>
        public string Template { get; set; }

        /// <summary>
        /// Gets or sets the nested template context.
        /// </summary>
        public string TemplateContext { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTemplateItem(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Adds child controls to the template item.
        /// </summary>
        /// <param name="items">Items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTemplateItem Add(params IControl[] items)
        {
            _items.AddRange(items ?? []);

            return this;
        }

        /// <summary>
        /// Adds child controls to the template item.
        /// </summary>
        /// <param name="items">Items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTemplateItem Add(IEnumerable<IControl> items)
        {
            _items.AddRange(items ?? []);

            return this;
        }

        /// <summary>
        /// Removes a child control from the template item.
        /// </summary>
        /// <param name="item">The item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTemplateItem Remove(IControl item)
        {
            _items.Remove(item);

            return this;
        }

        /// <summary>
        /// Adds a dynamic class expression.
        /// </summary>
        /// <param name="className">Class name to toggle.</param>
        /// <param name="expression">Expression path.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTemplateItem AddDynamicClass(string className, string expression)
        {
            if (!string.IsNullOrWhiteSpace(className))
            {
                _dynamicClass[className] = expression;
            }

            return this;
        }

        /// <summary>
        /// Adds a dynamic style expression.
        /// </summary>
        /// <param name="styleName">Style property name.</param>
        /// <param name="expression">Expression path.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTemplateItem AddDynamicStyle(string styleName, string expression)
        {
            if (!string.IsNullOrWhiteSpace(styleName))
            {
                _dynamicStyle[styleName] = expression;
            }

            return this;
        }

        /// <summary>
        /// Adds a dynamic aria expression.
        /// </summary>
        /// <param name="ariaName">Aria property name without prefix.</param>
        /// <param name="expression">Expression path.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTemplateItem AddDynamicAria(string ariaName, string expression)
        {
            if (!string.IsNullOrWhiteSpace(ariaName))
            {
                _dynamicAria[ariaName] = expression;
            }

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

            var tagName = string.IsNullOrWhiteSpace(TagName) ? "div" : TagName.Trim().ToLowerInvariant();
            var html = new HtmlElement(tagName)
            {
                Id = Id,
                Class = GetClasses(),
                Style = GetStyles(),
                Role = Role
            }
                .AddUserAttribute("data-foreach", ForEach)
                .AddUserAttribute("data-if", If)
                .AddUserAttribute("data-if-not", IfNot)
                .AddUserAttribute("data-if-empty", IfEmpty)
                .AddUserAttribute("data-if-not-empty", IfNotEmpty)
                .AddUserAttribute("data-bind", Bind)
                .AddUserAttribute("data-action", Action)
                .AddUserAttribute("data-action-param", ActionParam)
                .AddUserAttribute("data-template", Template)
                .AddUserAttribute("data-template-context", TemplateContext);

            foreach (var item in _dynamicClass)
            {
                html.AddUserAttribute($"data-class-{item.Key}", item.Value);
            }

            foreach (var item in _dynamicStyle)
            {
                html.AddUserAttribute($"data-style-{item.Key}", item.Value);
            }

            foreach (var item in _dynamicAria)
            {
                html.AddUserAttribute($"data-aria-{item.Key}", item.Value);
            }

            if (!string.IsNullOrWhiteSpace(Text))
            {
                html.Add(new HtmlText(I18N.Translate(renderContext, Text)));
            }

            html.Add(_items.Select(x => x?.Render(renderContext, visualTree)));

            return html;
        }
    }
}
