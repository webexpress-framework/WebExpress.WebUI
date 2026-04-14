using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input control that allows moving items between available and selected lists.
    /// </summary>
    public class ControlFormItemInputMove : ControlFormItemInput<ControlFormInputValueStringList>, IControlFormItemInputMove
    {
        private readonly List<IControlFormItemInputMoveItem> _options = [];

        /// <summary>
        /// Returns the collection of available options for the control.
        /// </summary>
        public IEnumerable<IControlFormItemInputMoveItem> Options => _options;

        /// <summary>
        /// Gets or sets the label displayed for the selected options list.
        /// </summary>
        public string SelectedHeader { get; set; } = "webexpress.webui:form.move.selected";

        /// <summary>
        /// Gets or sets the label displayed for the available options list.
        /// </summary>
        public string AvailableHeader { get; set; } = "webexpress.webui:form.move.available";

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputMove()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified ID.
        /// </summary>
        /// <param name="id">The unique identifier for the control.</param>
        /// <param name="items">The initial set of items to populate the control.</param>
        public ControlFormItemInputMove(string id, params IControlFormItemInputMoveItem[] items)
            : base(id)
        {
            _options.AddRange(items);
        }

        /// <summary>
        /// Adds one or more items to the available options list.
        /// </summary>
        /// <param name="items">The items to add to the available options list.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInputMove Add(params IControlFormItemInputMoveItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the available options list.
        /// </summary>
        /// <param name="items">The items to add to the available options list.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInputMove Add(IEnumerable<IControlFormItemInputMoveItem> items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a specific item from the available options list.
        /// </summary>
        /// <param name="item">The item to remove from the available options list.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInputMove Remove(IControlFormItemInputMoveItem item)
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
            var value = renderContext.GetValue<ControlFormInputValueStringList>(this)?.ToString
            (
                null,
                renderContext?.Request?.Culture
            );
            var classes = Classes.ToList();

            if (Disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-move", classes),
                Style = GetStyles()
            }
                .AddUserAttribute("name", Name)
                .Add(_options.Select(x => x.Render(renderContext, visualTree)));

            if (!string.IsNullOrEmpty(SelectedHeader))
            {
                html.AddUserAttribute("data-header-selected", I18N.Translate(SelectedHeader));
            }

            if (!string.IsNullOrEmpty(AvailableHeader))
            {
                html.AddUserAttribute("data-header-available", I18N.Translate(AvailableHeader));
            }

            if (!string.IsNullOrWhiteSpace(value))
            {
                html.AddUserAttribute("data-value", value);
            }

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
            // create a new instance using the semicolon separated string
            return new ControlFormInputValueStringList(value);
        }
    }
}

