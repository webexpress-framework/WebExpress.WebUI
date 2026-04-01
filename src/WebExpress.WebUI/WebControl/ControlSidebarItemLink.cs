using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a sidebar item link control.
    /// </summary>
    /// <remarks>
    /// This class is used to create a link within a sidebar.
    /// </remarks>
    public class ControlSidebarItemLink : IControlSidebarItem
    {
        /// <summary>
        /// Returns the unique identifier for the entity.
        /// </summary>
        public string Id { get; }

        /// <summary>
        /// Returns or sets whether the link is active or not.
        /// </summary>
        public TypeActive Active { get; set; }

        /// <summary>
        /// Returns or sets the label.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Returns or sets the target.
        /// </summary>
        public TypeTarget Target { get; set; }

        /// <summary>
        /// Returns or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public IAction PrimaryAction { get; set; }

        /// <summary>
        /// Returns or sets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        public IAction SecondaryAction { get; set; }

        /// <summary>
        /// Returns or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets a tooltip text.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Returns or sets the link color.
        /// </summary>
        public PropertyColorText Color { get; set; }

        /// <summary>
        /// Returns or sets the mode of the type sidebar, which determines its behavior.
        /// </summary>
        public virtual TypeSidebarMode Mode { get; set; }

        /// <summary>
        /// Returns or sets the dismissibility behavior of the sidebar.
        /// </summary>
        public TypeDismissibilitySidebar Dismissibility { get; set; }


        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSidebarItemLink(string id = null)
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
            return Render(renderContext, visualTree, Text, Tooltip, Uri, Icon, PrimaryAction, SecondaryAction);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="text">The text to display for the link.</param>
        /// <param name="tooltip">The tooltip text to display on hover.</param>
        /// <param name="uri">The URI to navigate to when the link is clicked.</param>
        /// <param name="icon">The icon to display alongside the link text.</param>
        /// <param name="primaryAction">The primary action to execute when the link is clicked.</param>
        /// <param name="secondaryAction">The secondary action to execute on a different interaction, such as a double-click.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, string text, string tooltip, IUri uri, IIcon icon, IAction primaryAction, IAction secondaryAction)
        {
            var resultUri = uri?.BindParameters(renderContext.Request);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-sidebar-link"
            }
                .AddUserAttribute("data-mode", Mode != TypeSidebarMode.Default ? Mode.ToData() : null)
                .AddUserAttribute("data-dismissibility", Dismissibility != TypeDismissibilitySidebar.None ? "true" : null)
                .AddUserAttribute("data-label", I18N.Translate(renderContext, text))
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-uri", resultUri?.ToString())
                .AddUserAttribute("data-target", Target.ToValue())
                .AddUserAttribute("data-title", I18N.Translate(renderContext, tooltip))
                .AddUserAttribute("data-color-css", Color?.ToClass())
                .AddUserAttribute("data-color-style", Color?.ToStyle())
                .AddUserAttribute(Active == TypeActive.Active ? "active" : null)
                .AddUserAttribute(Active == TypeActive.Disabled ? "disabled" : null);

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
