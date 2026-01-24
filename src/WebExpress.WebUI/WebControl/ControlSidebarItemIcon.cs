using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a sidebar item that displays an icon, with optional text and editing 
    /// capabilities, for use in a control sidebar UI.
    /// </summary>
    public class ControlSidebarItemIcon : IControlSidebarItem
    {
        private readonly string _id;

        /// <summary>
        /// Returns the unique identifier for this instance.
        /// </summary>
        public string Id => _id;

        /// <summary>
        /// Returns or sets the icon associated with this instance.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Returns or sets the text to display as the icon representation.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether the icon can be edited.
        /// </summary>
        public bool IconEdit { get; set; }

        /// <summary>
        /// Returns or sets the modal target used for editing icons.
        /// </summary>
        public IModalTarget Modal { get; set; }

        /// <summary>
        /// Returns or sets the display mode of the type sidebar.
        /// </summary>
        public virtual TypeSidebarMode Mode { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">
        /// The unique identifier for the icon. Can be null to indicate that no 
        /// identifier is assigned.
        /// </param>
        public ControlSidebarItemIcon(string id = null)
        {
            _id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return Render(renderContext, visualTree, Icon, Uri);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="icon">The icon to be rendered.</param>
        /// <param name="uri">The URI associated with the icon.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IIcon icon, IUri uri)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-sidebar-icon"
            }
                .AddUserAttribute("data-mode", Mode != TypeSidebarMode.Default ? Mode.ToData() : null)
                .AddUserAttribute("data-icon", icon is Icon css ? css.Class : null)
                .AddUserAttribute("data-image", icon is ImageIcon image ? image.Uri.ToString() : null)
                .AddUserAttribute("data-icon-edit", IconEdit ? "true" : null)
                .AddUserAttribute("data-icon-text", I18N.Translate(renderContext, Text));

            if (Modal is not null)
            {
                Modal?.ApplyUserAttributes(html);
                html.AddUserAttribute("data-wx-uri", uri?.ToString());
            }
            else
            {
                html.AddUserAttribute("data-uri", uri?.ToString());
            }

            return html;
        }
    }
}