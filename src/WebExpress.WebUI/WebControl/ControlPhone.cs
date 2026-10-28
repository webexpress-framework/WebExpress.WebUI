using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders a telephone number read-only: the flag of its country and the number as a link
    /// that dials it. The number travels in the E.164 form the link needs, and the text shows it
    /// with its calling code set apart. A national number is read in <see cref="Country"/>, so a
    /// page may keep numbers the way its users wrote them. It is a display only - a number the
    /// user enters belongs in a <see cref="ControlFormItemInputPhone"/>.
    /// </summary>
    public class ControlPhone : Control, IControlTableTemplate
    {
        /// <summary>
        /// Gets or sets the telephone number, international or national in <see cref="Country"/>.
        /// </summary>
        public Func<IRenderControlContext, string> Phone { get; set; }

        /// <summary>
        /// Gets or sets the ISO 3166-1 alpha-2 code of the country a national number belongs to.
        /// </summary>
        public Func<IRenderControlContext, string> Country { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlPhone(string id = null)
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
            var phone = PhoneCatalog.Normalize(Phone?.Invoke(renderContext), Country?.Invoke(renderContext));

            var html = new HtmlElementTextContentDiv(new HtmlText(PhoneCatalog.Format(phone) ?? ""))
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-phone", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("data-value", phone);

            return html;
        }
    }
}
