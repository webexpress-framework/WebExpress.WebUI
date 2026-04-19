using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a button that toggles the dark mode of the page.
    /// </summary>
    /// <remarks>
    /// The rendered element carries the `wx-webui-darkmode` marker class so
    /// that the client-side module `webexpress.webui.darkmode` initializes
    /// it automatically. The JavaScript module is responsible for setting
    /// the `data-bs-theme` attribute on the document root element and for
    /// persisting the current mode in a cookie.
    /// </remarks>
    public class ControlButtonDarkmode : Control
    {
        /// <summary>
        /// Gets or sets the icon shown when the light mode is active.
        /// </summary>
        public IIcon IconLight { get; set; } = new IconMoon();

        /// <summary>
        /// Gets or sets the icon shown when the dark mode is active.
        /// </summary>
        public IIcon IconDark { get; set; } = new IconSun();

        /// <summary>
        /// Gets or sets the tooltip text.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public TypeSizeButton Size
        {
            get => (TypeSizeButton)GetProperty(TypeSizeButton.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlButtonDarkmode(string id = null)
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
            var html = new HtmlElementFieldButton()
            {
                Id = Id,
                Type = "button",
                Class = Css.Concatenate("wx-webui-darkmode", GetClasses()),
                Style = GetStyles(),
                Role = Role
            }
                .Add(new HtmlElementTextSemanticsI()
                {
                    Class = "wx-webui-darkmode-icon"
                })
                .AddUserAttribute("data-icon-light", (IconLight as Icon)?.Class)
                .AddUserAttribute("data-icon-dark", (IconDark as Icon)?.Class)
                .AddUserAttribute("data-title", I18N.Translate(renderContext, Title));

            return html;
        }
    }
}
