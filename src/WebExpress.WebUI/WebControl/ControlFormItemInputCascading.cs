using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input control for cascading.
    /// </summary>
    /// <remarks>
    /// This control allows users to select cascading options from a predefined tree.
    /// </remarks>
    public class ControlFormItemInputCascading : ControlFormItemInput<ControlFormInputValueStringList>, IControlFormItemInputCascading
    {
        private readonly List<IControlFormItemInputCascadingItem> _options = [];

        /// <summary>
        /// Returns the entries.
        /// </summary>
        public IEnumerable<IControlFormItemInputCascadingItem> Options => _options;

        /// <summary>
        /// Gets or sets the label of the selected options.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the OnChange attribute.
        /// </summary>
        public PropertyOnChange OnChange { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputCascading()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The entries.</param>
        public ControlFormItemInputCascading(string id, params IControlFormItemInputCascadingItem[] items)
            : base(id)
        {
            _options.AddRange(items);
        }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputCascading Add(params IControlFormItemInputCascadingItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes an item from the selection options.
        /// </summary>
        /// <param name="item">The item to remove from the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputCascading Remove(IControlFormItemInputCascadingItem item)
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
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext.GetValue<ControlFormInputValueStringList>(this)?.Items;
            var classes = new List<string>();
            classes.AddRange(Classes);

            if (Disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-cascading", classes),
                Style = GetStyles()
            }
                .AddUserAttribute("name", Name)
                .AddUserAttribute("placeholder", I18N.Translate(Placeholder))
                .AddUserAttribute("data-value", string.Join(";", value ?? []))
                .Add(_options.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be converted. Cannot be null.
        /// </param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>
        /// The value created from the specified string representation.
        /// </returns>
        protected override ControlFormInputValueStringList CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueStringList(value);
        }
    }
}

