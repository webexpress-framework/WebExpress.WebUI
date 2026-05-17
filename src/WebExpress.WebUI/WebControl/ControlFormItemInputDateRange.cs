using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a date picker input form item control.
    /// </summary>
    public class ControlFormItemInputDateRange : ControlFormItemInput<ControlFormInputValueDateRange>
    {
        /// <summary>
        /// Gets or sets the description.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets the placeholder text displayed when no date is selected.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the date format string used for formatting date values.
        /// </summary>
        public Func<IRenderControlContext, string> Format { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputDateRange()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputDateRange(string id)
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
            var format = Format?.Invoke(renderContext);
            var placeholder = Placeholder?.Invoke(renderContext);
            var range = renderContext.GetValue<ControlFormInputValueDateRange>(this)?
                .ToString(format, renderContext?.Request?.Culture);
            var name = Name?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-webui-input-date"
            }
                .AddUserAttribute("name", name)
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, placeholder))
                .AddUserAttribute("data-value", range)
                .AddUserAttribute("data-range", "true")
                .AddUserAttribute("data-format", !string.IsNullOrWhiteSpace(format)
                    ? format
                    : renderContext.Request.Culture.DateTimeFormat.ShortDatePattern
                );

            return html;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be parsed and stored.
        /// </param>
        /// <param name="renderContext">
        /// The context in which the control is rendered.
        /// </param>
        /// <returns>
        /// A instance representing the parsed value, or an instance with a default 
        /// value if parsing fails.
        /// </returns>
        protected override ControlFormInputValueDateRange CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueDateRange(value, renderContext.Request.Culture);
        }
    }
}
