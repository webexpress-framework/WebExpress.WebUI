using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input control that allows moving items between available and selected lists.
    /// </summary>
    public class ControlFormItemInputMove : ControlFormItemInput<ControlFormInputValueString>, IControlFormItemInputMove
    {
        private readonly List<ControlFormItemInputMoveItem> _options = [];

        /// <summary>
        /// Returns the collection of available options for the control.
        /// </summary>
        public IEnumerable<ControlFormItemInputMoveItem> Options => _options;

        /// <summary>
        /// Returns or sets the label displayed for the selected options list.
        /// </summary>
        public string SelectedHeader { get; set; } = "webexpress.webui:form.move.selected";

        /// <summary>
        /// Returns or sets the label displayed for the available options list.
        /// </summary>
        public string AvailableHeader { get; set; } = "webexpress.webui:form.move.available";

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">The name of the calling member. This is automatically provided by the compiler.</param>
        /// <param name="file">The file path of the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="line">The line number in the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="items">The initial set of items to populate the control.</param>
        public ControlFormItemInputMove
        (
            [CallerMemberName] string instance = null,
            [CallerFilePath] string file = null,
            [CallerLineNumber] int? line = null,
            params ControlFormItemInputMoveItem[] items
        )
            : this($"move_{instance}_{file}_{line}".GetHashCode().ToString("X"), items)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified ID.
        /// </summary>
        /// <param name="id">The unique identifier for the control.</param>
        /// <param name="items">The initial set of items to populate the control.</param>
        public ControlFormItemInputMove(string id, params ControlFormItemInputMoveItem[] items)
            : base(id)
        {
            _options.AddRange(items);
        }

        /// <summary>
        /// Adds one or more items to the available options list.
        /// </summary>
        /// <param name="items">The items to add to the available options list.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInputMove Add(params ControlFormItemInputMoveItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a specific item from the available options list.
        /// </summary>
        /// <param name="item">The item to remove from the available options list.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInputMove Remove(ControlFormItemInputMoveItem item)
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
            var classes = Classes.ToList();

            if (Disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv([.. _options.Select(x => new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(x.Label)))
                {
                    Id = x.Id,
                    Class = "wx-webui-move-option"
                }
                    .AddUserAttribute("data-icon", (x.Icon as Icon)?.Class)
                    .AddUserAttribute("data-image", (x.Icon as ImageIcon)?.Uri.ToString()))])
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-move", classes),
                Style = GetStyles()
            }
                .AddUserAttribute("name", Name);

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
        /// <returns>
        /// The value created from the specified string representation.
        /// </returns>
        protected override ControlFormInputValueString CreateValue(string value)
        {
            return new ControlFormInputValueString
            {
                Text = value
            };
        }
    }
}

