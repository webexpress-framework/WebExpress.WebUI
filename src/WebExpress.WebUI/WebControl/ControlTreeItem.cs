using System.Collections.Generic;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tree node for the <see cref="ControlTree"/>.
    /// </summary>
    public class ControlTreeItem : IControlTreeItem
    {
        private readonly List<IControlTreeItem> _children = [];

        /// <summary>
        /// Gets the unique identifier of the tree item.
        /// </summary>
        public string Id { get; }

        /// <summary>
        /// Gets or sets the label of the tree item.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with the tree item.
        /// </summary>
        public IIcon Icon { get { return IconOpen; } set { IconOpen = IconClose = value; } }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public IUri Image { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with the tree item.
        /// </summary>
        public IIcon IconOpen { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with the tree item.
        /// </summary>
        public IIcon IconClose { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the tree item is expanded.
        /// </summary>
        public bool Expand { get; set; }

        /// <summary>
        /// Gets or sets a tooltip text.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the tree item is active.
        /// </summary>
        public bool Active { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public IAction PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double-click to open a modal or similar target.
        /// </summary>
        public IAction SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the link color.
        /// </summary>
        public TypeColorText Color { get; set; }

        /// <summary>
        /// Gets or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Gets or sets the target.
        /// </summary>
        public TypeTarget Target { get; set; }

        /// <summary>
        /// Returns the child tree items.
        /// </summary>
        public IEnumerable<IControlTreeItem> Children => _children;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The unique identifier of the tree node.</param>
        /// <param name="children">The children of the tree node.</param>
        public ControlTreeItem(string id = null, params IControlTreeItem[] children)
        {
            Id = id;
            _children.AddRange(children);
        }

        /// <summary>
        /// Adds the specified children to the tree node.
        /// </summary>
        /// <param name="children">The children to add.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        public IControlTreeItem Add(params IControlTreeItem[] children)
        {
            _children.AddRange(children);

            return this;
        }

        /// <summary>
        /// Adds the specified children to the tree node.
        /// </summary>
        /// <param name="children">The children to add.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        public IControlTreeItem Add(IEnumerable<IControlTreeItem> children)
        {
            _children.AddRange(children);

            return this;
        }

        /// <summary>
        /// Removes the specified content or child tree item from the tree item.
        /// </summary>
        /// <param name="child">The content or child tree item to remove.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        public IControlTreeItem Remove(IControlTreeItem child)
        {
            _children.Remove(child);

            return this;
        }

        /// <summary>
        /// Converts the cell to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-tree-node"),
            }
                .AddUserAttribute("data-label", I18N.Translate(Text))
                .AddUserAttribute("data-expand", Expand ? "true" : null)
                .AddUserAttribute("data-active", Active ? "true" : null)
                .AddUserAttribute("data-color", Color.ToClass())
                .AddUserAttribute("data-tooltip", Tooltip)
                .AddUserAttribute("data-uri", Uri?.ToString())
                .AddUserAttribute("data-target", Target.ToValue());

            if (IconOpen == IconClose && Icon is Icon icon)
            {
                html.AddUserAttribute("data-icon", icon.Class);
            }

            if (IconOpen != IconClose && IconOpen is Icon iconOpen)
            {
                html.AddUserAttribute("data-icon-opened", iconOpen.Class);
            }

            if (IconOpen != IconClose && IconClose is Icon iconClose)
            {
                html.AddUserAttribute("data-icon-closed", iconClose.Class);
            }

            if (IconOpen == IconClose && (Image != null || Icon is ImageIcon))
            {
                html.AddUserAttribute("data-image", Image?.ToString() ?? (Icon as ImageIcon)?.Uri?.ToString());
            }

            if (IconOpen != IconClose && IconOpen is ImageIcon imageOpen)
            {
                html.AddUserAttribute("data-image-opened", imageOpen.Uri?.ToString());
            }

            if (IconOpen != IconClose && IconClose is ImageIcon imageClose)
            {
                html.AddUserAttribute("data-image-closed", imageClose.Uri?.ToString());
            }

            PrimaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            SecondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
