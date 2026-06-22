using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders a date picker, an input field that lets the user choose a calendar date.
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

            var d = date > DateTime.MinValue
                 ? date?.ToString(format, renderContext.Request.Culture)
                 : "";

            var html = new HtmlElementTextContentDiv(new HtmlText(d))
            {
                Id = Id,
                Class = "wx-webui-date"
            }
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute("data-format", format);

            return html;
        }
    }
}
