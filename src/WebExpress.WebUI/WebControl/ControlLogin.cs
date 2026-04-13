using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a login control that renders a login interface as part of a web UI.
    /// </summary>
    public class ControlLogin : Control
    {
        /// <summary>
        /// Returns or sets the login name associated with the user.
        /// </summary>
        public string Username { get; set; }

        /// <summary>
        /// Returns or sets the title of the login dialog.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlLogin(string id = null)
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
            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-login", GetClasses()),
                Style = GetStyles(),
            }
                .AddUserAttribute("dataset-username", Username)
                .AddUserAttribute("dataset-title", I18N.Translate(renderContext, Title));
        }
    }
}
