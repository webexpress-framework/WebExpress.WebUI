using System;
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
    /// A single node within a <see cref="ControlTree"/>, which may itself contain child nodes to
    /// form the tree hierarchy.
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
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with the tree item.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon
        {
            get { return IconOpen; }
            set { IconOpen = IconClose = value; }
        }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with the tree item.
        /// </summary>
        public Func<IRenderControlContext, IIcon> IconOpen { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with the tree item.
        /// </summary>
        public Func<IRenderControlContext, IIcon> IconClose { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the tree item is expanded.
        /// </summary>
        public Func<IRenderControlContext, bool> Expand { get; set; }

        /// <summary>
        /// Gets or sets a tooltip text.
        /// </summary>
        public Func<IRenderControlContext, string> Tooltip { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the tree item is active.
        /// </summary>
        public Func<IRenderControlContext, bool> Active { get; set; }

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
        /// Gets or sets the link color.
        /// </summary>
        public Func<IRenderControlContext, TypeColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the target uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the target.
        /// </summary>
        public Func<IRenderControlContext, TypeTarget> Target { get; set; }

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
            var text = Text?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var iconOpen = IconOpen?.Invoke(renderContext);
            var iconClose = IconClose?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);
            var expand = Expand?.Invoke(renderContext) ?? false;
            var active = Active?.Invoke(renderContext) ?? false;
            var tooltip = Tooltip?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext) ?? TypeColorText.Default;
            var uri = Uri?.Invoke(renderContext);
            var target = Target?.Invoke(renderContext) ?? TypeTarget.None;
            var primaryAction = PrimaryAction?.Invoke(renderContext);
            var secondaryAction = SecondaryAction?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-tree-node"),
            }
                .AddUserAttribute("data-label", I18N.Translate(text))
                .AddUserAttribute("data-expand", expand ? "true" : null)
                .AddUserAttribute("data-active", active ? "true" : null)
                .AddUserAttribute("data-color", color.ToClass())
                .AddUserAttribute("data-tooltip", tooltip)
                .AddUserAttribute("data-uri", uri?.ToString())
                .AddUserAttribute("data-target", target.ToValue());

            if (IconOpen == IconClose && icon is Icon i)
            {
                html.AddUserAttribute("data-icon", i.Class);
            }

            if (IconOpen != IconClose && iconOpen is Icon io)
            {
                html.AddUserAttribute("data-icon-opened", io.Class);
            }

            if (IconOpen != IconClose && iconClose is Icon ic)
            {
                html.AddUserAttribute("data-icon-closed", ic.Class);
            }

            if (IconOpen == IconClose && (image != null || icon is ImageIcon))
            {
                html.AddUserAttribute("data-image", image?.ToString() ?? (icon as ImageIcon)?.Uri?.ToString());
            }

            if (IconOpen != IconClose && iconOpen is ImageIcon imageOpen)
            {
                html.AddUserAttribute("data-image-opened", imageOpen.Uri?.ToString());
            }

            if (IconOpen != IconClose && iconClose is ImageIcon imageClose)
            {
                html.AddUserAttribute("data-image-closed", imageClose.Uri?.ToString());
            }

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
