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
        /// Gets or sets the icon associated with this instance.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the target uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the text to display as the icon representation.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the icon can be edited.
        /// </summary>
        public Func<IRenderControlContext, bool> IconEdit { get; set; }

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
        /// Gets or sets the display mode of the type sidebar.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeSidebarMode> Mode { get; set; }

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
            return Render(renderContext, visualTree, Icon?.Invoke(renderContext), Uri?.Invoke(renderContext), PrimaryAction?.Invoke(renderContext), SecondaryAction?.Invoke(renderContext));
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="icon">The icon to be rendered.</param>
        /// <param name="uri">The URI associated with the icon.</param>
        /// <param name="primaryAction">The primary action associated with the control, usually invoked
        /// when the user interacts with the main interactive element (e.g., a click).
        /// </param>
        /// <param name="secondaryAction">
        /// An optional secondary action that provides an alternative or contextual behavior.
        /// </param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IIcon icon, IUri uri, IAction primaryAction, IAction secondaryAction)
        {
            var mode = Mode?.Invoke(renderContext) ?? TypeSidebarMode.Default;
            var iconEdit = IconEdit?.Invoke(renderContext) ?? false;
            var text = Text?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-sidebar-icon"
            }
                .AddUserAttribute("data-mode", mode != TypeSidebarMode.Default ? mode.ToData() : null)
                .AddUserAttribute("data-icon", icon is Icon css ? css.Class : null)
                .AddUserAttribute("data-image", icon is ImageIcon image ? image.Uri.ToString() : null)
                .AddUserAttribute("data-icon-edit", iconEdit ? "true" : null)
                .AddUserAttribute("data-icon-text", I18N.Translate(renderContext, text))
                .AddUserAttribute("data-uri", uri?.ToString());

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
