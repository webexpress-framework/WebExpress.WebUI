using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A clickable link entry within a sidebar.
    /// </summary>
    /// <remarks>
    /// This class is used to create a link within a sidebar.
    /// </remarks>
    public class ControlSidebarItemLink : IControlSidebarItem
    {
        /// <summary>
        /// Gets the unique identifier for the entity.
        /// </summary>
        public string Id { get; }

        /// <summary>
        /// Gets or sets whether the link is active or not.
        /// </summary>
        public Func<IRenderControlContext, TypeActive> Active { get; set; }

        /// <summary>
        /// Gets or sets the label.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the target uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the target.
        /// </summary>
        public Func<IRenderControlContext, TypeTarget> Target { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a
        /// click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a
        /// double-click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets a tooltip text.
        /// </summary>
        public Func<IRenderControlContext, string> Tooltip { get; set; }

        /// <summary>
        /// Gets or sets the link color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the mode of the type sidebar, which determines its behavior.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeSidebarMode> Mode { get; set; }

        /// <summary>
        /// Gets or sets the dismissibility behavior of the sidebar.
        /// </summary>
        public Func<IRenderControlContext, TypeDismissibilitySidebar> Dismissibility { get; set; }

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
            return Render(renderContext, visualTree, Text?.Invoke(renderContext), Tooltip?.Invoke(renderContext), Uri?.Invoke(renderContext), Icon?.Invoke(renderContext), PrimaryAction?.Invoke(renderContext), SecondaryAction?.Invoke(renderContext));
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
            var mode = Mode?.Invoke(renderContext) ?? TypeSidebarMode.Default;
            var dismissibility = Dismissibility?.Invoke(renderContext) ?? TypeDismissibilitySidebar.None;
            var image = Image?.Invoke(renderContext);
            var target = Target?.Invoke(renderContext) ?? TypeTarget.None;
            var color = Color?.Invoke(renderContext);
            var active = Active?.Invoke(renderContext) ?? TypeActive.None;

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-sidebar-link"
            }
                .AddUserAttribute("data-mode", mode != TypeSidebarMode.Default ? mode.ToData() : null)
                .AddUserAttribute("data-dismissibility", dismissibility != TypeDismissibilitySidebar.None ? "true" : null)
                .AddUserAttribute("data-label", I18N.Translate(renderContext, text))
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-uri", resultUri?.ToString())
                .AddUserAttribute("data-target", target.ToValue())
                .AddUserAttribute("data-title", I18N.Translate(renderContext, tooltip))
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute("data-active", active == TypeActive.Active ? "active" : active == TypeActive.Disabled ? "disabled" : null);

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
