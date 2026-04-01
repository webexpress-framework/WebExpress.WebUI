using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input control for selection.
    /// </summary>
    /// <remarks>
    /// This control allows users to select one or more options from a predefined list.
    /// </remarks>
    public class ControlFormItemInputSelection : ControlFormItemInput<ControlFormInputValueString>, IControlFormItemInputSelection
    {
        private readonly List<IControlFormItemInputSelectionItem> _options = [];

        /// <summary>
        /// Returns the entries.
        /// </summary>
        public IEnumerable<IControlFormItemInputSelectionItem> Options => _options;

        /// <summary>
        /// Returns or sets the label of the selected options.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Allows you to select multiple items.
        /// </summary>
        public bool MultiSelect { get; set; }

        /// <summary>
        /// Returns or sets the OnChange attribute.
        /// </summary>
        public PropertyOnChange OnChange { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputSelection()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The entries.</param>
        public ControlFormItemInputSelection(string id, params IControlFormItemInputSelectionItem[] items)
            : base(id)
        {
            _options.AddRange(items);
        }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputSelection Add(params IControlFormItemInputSelectionItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputSelection Add(IEnumerable<IControlFormItemInputSelectionItem> items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes an item from the selection options.
        /// </summary>
        /// <param name="item">The item to remove from the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputSelection Remove(IControlFormItemInputSelectionItem item)
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
            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text;
            var classes = new List<string>();
            classes.AddRange(Classes);

            if (Disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-selection", classes),
                Style = GetStyles()
            }
                .AddUserAttribute("name", Name)
                .AddUserAttribute("placeholder", I18N.Translate(Placeholder))
                .AddUserAttribute("data-multiselection", MultiSelect ? "true" : null)
                .AddUserAttribute("data-value", value)
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
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(value);
        }
    }
}

