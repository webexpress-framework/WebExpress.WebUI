using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input control that allows users to select a rating value, displayed as stars.
    /// </summary>
    public class ControlFormItemInputRating : ControlFormItemInput<ControlFormInputValueUInt>
    {
        /// <summary>
        /// Gets or sets the maximum rating value (stars) that can be assigned.
        /// </summary>
        public uint MaxRating { get; set; } = uint.MaxValue;

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputRating()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified ID.
        /// </summary>
        /// <param name="id">The unique identifier for the control.</param>
        /// <param name="items">The initial set of items to populate the control.</param>
        public ControlFormItemInputRating(string id)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext.GetValue<ControlFormInputValueUInt>(this)?.ToString
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
                Class = Css.Concatenate("wx-webui-input-rating", classes),
                Style = GetStyles()
            }
                .AddUserAttribute("name", Name)
                .AddUserAttribute("data-stars", MaxRating != uint.MaxValue ? MaxRating.ToString() : null);

            if (!string.IsNullOrWhiteSpace(value))
            {
                html.AddUserAttribute("data-value", value != uint.MaxValue.ToString()
                    ? value
                    : null);
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
        protected override ControlFormInputValueUInt CreateValue(string value, IRenderControlFormContext renderContext)
        {
            _ = uint.TryParse(value, out var result) ? result : 0;

            return new ControlFormInputValueUInt(result);
        }
    }
}

