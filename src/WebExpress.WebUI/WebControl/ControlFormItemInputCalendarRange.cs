using System.Runtime.CompilerServices;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a calendar input form item that supports single or range-based date selection.
    /// </summary>
    public class ControlFormItemInputCalendarRange : ControlFormItemInput<ControlFormInputValueDateRange>
    {
        /// <summary>
        /// Returns or sets the description of the calendar input.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether this input is required.
        /// </summary>
        public bool Required { get; set; }

        /// <summary>
        /// Returns or sets the placeholder text displayed when no date is selected.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Returns or sets the format used to display the date.
        /// </summary>
        public string Format { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="ControlFormItemInputCalendar"/> class 
        /// with an auto-generated ID based on source location.
        /// </summary>
        public ControlFormItemInputCalendarRange
        (
            [CallerMemberName] string instance = null,
            [CallerFilePath] string file = null,
            [CallerLineNumber] int? line = null)
            : this($"calendar_range{instance}_{file}_{line}".GetHashCode().ToString("X")
        )
        {
        }

        /// <summary>
        /// Initializes a new instance of the class 
        /// with the specified control ID.
        /// </summary>
        public ControlFormItemInputCalendarRange(string id)
            : base(id)
        {
        }

        /// <summary>
        /// Renders the calendar control as an HTML node.
        /// </summary>
        /// <param name="renderContext">The current rendering context.</param>
        /// <param name="visualTree">The visual tree structure.</param>
        /// <returns>An HTML node representing the calendar control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var range = renderContext.GetValue<ControlFormInputValueDateRange>(this)?.ToString();

            var html = new HtmlElementTextContentDiv
            {
                Id = Id,
                Class = "wx-webui-calendar"
            }
            .AddUserAttribute("name", Name)
            .AddUserAttribute("placeholder", I18N.Translate(renderContext, Placeholder))
            .AddUserAttribute("data-range", "true")
            .AddUserAttribute("data-value", range)
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
