using System.Runtime.CompilerServices;
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
        /// Returns or sets the description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets the placeholder text displayed when no date is selected.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Returns or sets the date format string used for formatting date values.
        /// </summary>
        public string Format { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">The name of the calling member. This is automatically provided by the compiler.</param>
        /// <param name="file">The file path of the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="line">The line number in the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="items">The entries.</param>
        public ControlFormItemInputDateRange
        (
            [CallerMemberName] string instance = null,
            [CallerFilePath] string file = null,
            [CallerLineNumber] int? line = null
        )
            : this($"datepicker_range{instance}_{file}_{line}".GetHashCode().ToString("X"))
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
            var range = renderContext.GetValue<ControlFormInputValueDateRange>(this)?
                .ToString(Format, renderContext?.Request?.Culture);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-webui-input-date"
            }
                .AddUserAttribute("name", Name)
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, Placeholder))
                .AddUserAttribute("data-value", range)
                .AddUserAttribute("data-range", "true")
                .AddUserAttribute("data-format", !string.IsNullOrWhiteSpace(Format)
                    ? Format
                    : renderContext.Request.Culture.DateTimeFormat.ShortDatePattern
                );

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
        protected override ControlFormInputValueDateRange CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueDateRange(value, renderContext.Request.Culture);
        }
    }
}
