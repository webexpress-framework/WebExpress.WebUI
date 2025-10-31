using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a date control.
    /// </summary>
    public class ControlDate : Control, IControlTemplate
    {
        /// <summary>
        /// Returns or sets the date format string used for formatting date values.
        /// </summary>
        public string Format { get; set; }

        /// <summary>
        /// Returns or sets the date associated with the current instance.
        /// </summary>
        public DateTime Date { get; set; }

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
            var date = Date > DateTime.MinValue
                ? Date.ToString(Format, renderContext.Request.Culture)
                : "";

            var html = new HtmlElementTextContentDiv(new HtmlText(date))
            {
                Id = Id,
                Class = "wx-webui-date"
            }
                .AddUserAttribute("data-format", Format);

            return html;
        }
    }
}
