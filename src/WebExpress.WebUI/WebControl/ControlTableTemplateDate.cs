using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that renders a date in a table using a template.
    /// </summary>
    public class ControlTableTemplateDate : IControlTableTemplateEditable
    {
        /// <summary>
        /// Gets or sets the unique identifier for the object.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the current template is editable or read-only.
        /// </summary>
        public Func<IRenderControlContext, bool> Editable { get; set; }

        /// <summary>
        /// Gets or sets the color associated with this date.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorDate> Color { get; set; }

        /// <summary>
        /// Gets or sets the placeholder text displayed when the input field is empty.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the format string used to control how the value is displayed or processed.
        /// </summary>
        public Func<IRenderControlContext, string> Format { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTableTemplateDate(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var color = Color?.Invoke(renderContext);
            var placeholder = Placeholder?.Invoke(renderContext);
            var format = Format?.Invoke(renderContext);
            var editable = Editable?.Invoke(renderContext);

            var html = new HtmlElement("template")
            {
                Id = Id
            }
                .AddUserAttribute("data-type", "date")
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute("data-placeholder", I18N.Translate(renderContext, placeholder))
                .AddUserAttribute("data-format", format)
                .AddUserAttribute("data-editable", editable == true ? "true" : null);

            return html;
        }
    }
}
