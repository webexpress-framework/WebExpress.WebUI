using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a calendar input form item that supports single or range-based date selection.
    /// </summary>
    public class ControlFormItemInputCalendar : ControlFormItemInput<ControlFormInputValueDate>
    {
        /// <summary>
        /// Gets or sets the description of the calendar input.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets the placeholder text displayed when no date is selected.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the format used to display the date.
        /// </summary>
        public Func<IRenderControlContext, string> Format { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether date range selection is enabled.
        /// </summary>
        public Func<IRenderControlContext, bool> Range { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="ControlFormItemInputCalendar"/> class.
        /// </summary>
        public ControlFormItemInputCalendar()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputCalendar(string id)
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
            var format = Format?.Invoke(renderContext);
            var placeholder = Placeholder?.Invoke(renderContext);
            var value = renderContext.GetValue<ControlFormInputValueDate>(this)?
                .ToString
                (
                    format ?? renderContext.Request.Culture.DateTimeFormat.ShortDatePattern,
                    renderContext?.Request?.Culture
                );
            var name = Name?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv
            {
                Id = Id,
                Class = "wx-webui-input-calendar"
            }
            .AddUserAttribute("name", name)
            .AddUserAttribute("placeholder", I18N.Translate(renderContext, placeholder))
            .AddUserAttribute("data-value", value)
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
        protected override ControlFormInputValueDate CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueDate(value, renderContext?.Request?.Culture);
        }
    }
}
