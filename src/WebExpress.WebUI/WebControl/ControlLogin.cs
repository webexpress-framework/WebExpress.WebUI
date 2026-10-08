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
        /// Gets or sets the outline level of the title. On a page of its own the dialog is the
        /// page, so its title is a second-level heading by default; embedded under other
        /// headings it needs a deeper level to keep the outline in order.
        /// </summary>
        public Func<IRenderControlContext, int?> HeadingLevel { get; set; }

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
            var headingLevel = HeadingLevel?.Invoke(renderContext);

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-login", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
            }
                .AddUserAttribute("data-username", username)
                .AddUserAttribute("data-title", I18N.Translate(renderContext, title))
                .AddUserAttribute("data-heading-level", headingLevel?.ToString());
        }
    }
}
