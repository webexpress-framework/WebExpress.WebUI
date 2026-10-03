using System;
using System.Globalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders a calendar date as formatted, read-only text. The date is formatted on the server
    /// with <see cref="Format"/> and the culture of the request, and the client keeps that text
    /// and only adds a calendar icon. The date also travels in culture-neutral form, because the
    /// client cannot parse every culture-specific format and needs the value when it is changed
    /// from script. It is a display only - neither an input field nor a date picker. A date the
    /// user enters or picks belongs in a <see cref="ControlFormItemInputDate"/>.
    /// </summary>
    public class ControlDate : Control, IControlTableTemplate
    {
        /// <summary>
        /// Gets or sets the date format string used for formatting date values.
        /// </summary>
        public Func<IRenderControlContext, string> Format { get; set; } = _ => "yyyy-MM-dd";

        /// <summary>
        /// Gets or sets the color associated with this date.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorDate> Color { get; set; }

        /// <summary>
        /// Gets or sets the date associated with the current instance.
        /// </summary>
        public Func<IRenderControlContext, DateTime> Date { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlDate(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var date = Date?.Invoke(renderContext);
            var format = Format?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);

            var role = Role?.Invoke(renderContext);
            var hasDate = date > DateTime.MinValue;

            var text = hasDate
                 ? date?.ToString(format, renderContext.Request.Culture)
                 : "";

            var html = new HtmlElementTextContentDiv(new HtmlText(text))
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-date", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role
            }
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute("data-format", format)
                .AddUserAttribute("data-value", hasDate ? date?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : null);

            return html;
        }
    }
}
