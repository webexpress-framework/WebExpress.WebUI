using System;
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
        /// Gets or sets the login name associated with the user.
        /// </summary>
        public Func<IRenderControlContext, string> Username { get; set; }

        /// <summary>
        /// Gets or sets the title of the login dialog.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

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
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var username = Username?.Invoke(renderContext);
            var title = Title?.Invoke(renderContext);

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-login", GetClasses()),
                Style = GetStyles(),
            }
                .AddUserAttribute("dataset-username", username)
                .AddUserAttribute("dataset-title", I18N.Translate(renderContext, title));
        }
    }
}
