using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that renders a telephone number in a table using a template: the flag
    /// and a link that dials it read-only, and the phone field with its country picker in edit
    /// mode. A cell holds the number in E.164 form; the picker names the countries in the
    /// language of the page, so the template carries no country list.
    /// </summary>
    public class ControlTableTemplatePhone : IControlTableTemplateEditable
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
        /// Gets or sets the country an empty edited cell starts in.
        /// </summary>
        public Func<IRenderControlContext, string> Country { get; set; }

        /// <summary>
        /// Gets or sets the placeholder text displayed while an edited cell holds no number.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTableTemplatePhone(string id = null)
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
            var html = new HtmlElement("template")
            {
                Id = Id
            }
                .AddUserAttribute("data-type", "phone")
                .AddUserAttribute("data-country", CountryCatalog.Normalize(Country?.Invoke(renderContext)))
                .AddUserAttribute("data-placeholder", I18N.Translate(renderContext, Placeholder?.Invoke(renderContext)))
                .AddUserAttribute("data-editable", Editable?.Invoke(renderContext) == true ? "true" : null);

            return html;
        }
    }
}
