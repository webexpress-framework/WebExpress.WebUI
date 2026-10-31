using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders an e-mail address read-only, as a link that writes to it. The address is
    /// normalized on the server, and an invalid one renders an empty display rather than a link
    /// that leads nowhere. It is a display only - an address the user enters belongs in a
    /// <see cref="ControlFormItemInputEmail"/>.
    /// </summary>
    public class ControlEmail : Control, IControlTableTemplate
    {
        /// <summary>
        /// Gets or sets the e-mail address.
        /// </summary>
        public Func<IRenderControlContext, string> Email { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlEmail(string id = null)
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
            var email = EmailAddress.Normalize(Email?.Invoke(renderContext));

            var html = new HtmlElementTextContentDiv(new HtmlText(email ?? ""))
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-email", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("data-value", email);

            return html;
        }
    }
}
