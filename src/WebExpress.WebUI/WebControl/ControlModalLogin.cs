using System;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A login dialog: the <see cref="ControlLogin"/> framed by a modal, so signing in
    /// happens on top of the page the user is on instead of on a page of its own. The
    /// dialog lends the login what a card would otherwise supply - the title bar names
    /// it, the footer carries its submit button ahead of the close button - and the
    /// login keeps what is its: the fields, the request and what happens on success
    /// and failure.
    /// </summary>
    /// <remarks>
    /// The login is rendered as a real <see cref="ControlLogin"/> inside the content
    /// section of the dialog, which is why a variant of the login - the application
    /// layer's REST-backed one, for instance - is framed by deriving from this class
    /// and handing that variant to the protected constructor rather than by a dialog
    /// of its own. The client-side <c>webexpress.webui.ModalLoginCtrl</c> assembles
    /// the dialog around the mounted login.
    /// </remarks>
    public class ControlModalLogin : ControlModal
    {
        private readonly ControlLogin _login;

        /// <summary>
        /// Gets or sets the login name the dialog opens with. A name the page already
        /// knows - the one a session expired for, say - spares the user typing it again.
        /// </summary>
        public Func<IRenderControlContext, string> Username { get => _login.Username; set => _login.Username = value; }

        /// <summary>
        /// Gets or sets a value indicating whether the dialog opens as soon as the page
        /// is shown. A page that cannot be used without signing in asks for the
        /// credentials right away rather than waiting for a click on an activator.
        /// </summary>
        public Func<IRenderControlContext, bool> AutoShow { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlModalLogin()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">Further content shown below the login, such as a hint or a link to a password reset.</param>
        public ControlModalLogin(string id, params IControl[] content)
            : this(id, new ControlLogin(id is not null ? $"{id}_login" : null), content)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class around a given login, which is how a
        /// derived dialog frames a variant of the login control.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="login">The login the dialog frames.</param>
        /// <param name="content">Further content shown below the login.</param>
        protected ControlModalLogin(string id, ControlLogin login, params IControl[] content)
            : base(id, content)
        {
            _login = login;

            // the dialog's title bar is the login's title, so the caption the login
            // control would draw on its card is what the header defaults to
            Header = _ => "webexpress.webui:login.title";
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var title = Header?.Invoke(renderContext);
            var size = Size?.Invoke(renderContext) ?? TypeModalSize.Default;
            var closeLabel = CloseLabel?.Invoke(renderContext);
            var scrollable = Scrollable?.Invoke(renderContext) ?? true;
            var autoShow = AutoShow?.Invoke(renderContext) ?? false;

            var header = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(renderContext, title)))
            {
                Class = "wx-modal-header"
            };

            // the login leads the content; what a page adds - a hint, a link to a
            // password reset - reads below the fields
            var content = new HtmlElementTextContentDiv(_login.Render(renderContext, visualTree))
            {
                Class = "wx-modal-content"
            };
            content.Add(Content.Select(x => x.Render(renderContext, visualTree)));

            var footer = new HtmlElementTextContentDiv()
            {
                Class = "wx-modal-footer"
            };

            return new HtmlElementInteractiveDialog(header, content, footer)
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-modal-login", GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("data-size", size.ToClass())
                .AddUserAttribute("data-close-label", I18N.Translate(renderContext, closeLabel))
                .AddUserAttribute("data-scrollable", scrollable ? null : "false")
                .AddUserAttribute("data-auto-show", autoShow ? "true" : null);
        }
    }
}
