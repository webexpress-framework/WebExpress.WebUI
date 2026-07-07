using System;
using System.Collections.Generic;
using System.Linq;
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
        private readonly List<IControlSidebarItem> _items = [];
        private readonly List<IControlDropdownItem> _options = [];

        /// <summary>
        /// Gets the unique identifier for the entity.
        /// </summary>
        public string Id { get; }

        /// <summary>
        /// Gets the child items nested under this link. When the collection is
        /// non-empty the link becomes a hierarchical group that the client
        /// renders as a collapsible subtree; an empty collection keeps the link
        /// a leaf and preserves the historical markup.
        /// </summary>
        public IEnumerable<IControlSidebarItem> Items => _items;

        /// <summary>
        /// Gets the options shown in the trailing "..." menu of the link. When
        /// the collection is empty no menu is emitted, so a link without actions
        /// stays visually unchanged; otherwise the client renders a dropdown
        /// that it only reveals on hover, matching the table row options.
        /// </summary>
        public IEnumerable<IControlDropdownItem> Options => _options;

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
        /// Gets or sets the text color of the link. It is emitted as both a
        /// framework css class and an inline style, so the client can apply a
        /// predefined color or a custom value to the row.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the background color of the link. Mirrors the text color
        /// by emitting a css class and an inline style, letting a caller tint a
        /// row with a predefined or custom background without touching the css.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackground> BackgroundColor { get; set; }

        /// <summary>
        /// Gets or sets the mode of the type sidebar, which determines its behavior.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeSidebarMode> Mode { get; set; }

        /// <summary>
        /// Gets or sets the dismissibility behavior of the sidebar.
        /// </summary>
        public Func<IRenderControlContext, TypeDismissibilitySidebar> Dismissibility { get; set; }

        /// <summary>
        /// Gets or sets the badge text shown at the trailing edge of the link,
        /// for example an unread count. When null or empty no badge is rendered,
        /// so a link without a count stays visually unchanged.
        /// </summary>
        public Func<IRenderControlContext, string> Badge { get; set; }

        /// <summary>
        /// Gets or sets the badge background color. The resolved css class and
        /// inline style are emitted alongside the badge text so the client can
        /// style the badge consistently with the framework badge colors.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackgroundBadge> BadgeColor { get; set; }

        /// <summary>
        /// Gets or sets whether a link that owns child items starts expanded.
        /// The flag has no effect on a leaf link, because there is nothing to
        /// expand.
        /// </summary>
        public Func<IRenderControlContext, bool> Expanded { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSidebarItemLink(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds child items nested under this link, turning it into a
        /// hierarchical group whose subtree the client can collapse and expand.
        /// </summary>
        /// <param name="items">The child items to nest.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlSidebarItemLink Add(params IControlSidebarItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds entries to the trailing "..." options menu of the link. A
        /// distinct method name keeps the child-item Add unambiguous, so an
        /// empty call never becomes an overload-resolution conflict.
        /// </summary>
        /// <param name="options">The dropdown entries to show in the menu.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlSidebarItemLink AddOption(params IControlDropdownItem[] options)
        {
            _options.AddRange(options);

            return this;
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
            var backgroundColor = BackgroundColor?.Invoke(renderContext);
            var active = Active?.Invoke(renderContext) ?? TypeActive.None;
            var badge = Badge?.Invoke(renderContext);
            var badgeColor = BadgeColor?.Invoke(renderContext);
            var expanded = Expanded?.Invoke(renderContext) ?? false;
            var children = _items;

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
                .AddUserAttribute("data-background-color-css", backgroundColor?.ToClass())
                .AddUserAttribute("data-background-color-style", backgroundColor?.ToStyle())
                .AddUserAttribute("data-active", active == TypeActive.Active ? "active" : active == TypeActive.Disabled ? "disabled" : null)
                .AddUserAttribute("data-badge", I18N.Translate(renderContext, badge))
                .AddUserAttribute("data-badge-color", badgeColor?.ToClass())
                .AddUserAttribute("data-badge-style", badgeColor?.ToStyle())
                // the expanded hint is only meaningful for a group, so a leaf never carries it
                .AddUserAttribute("data-expanded", children.Count > 0 && expanded ? "true" : null);

            // emit the options in a dedicated container the client turns into a
            // hover-revealed "..." dropdown; kept separate from the label and the
            // children so the parser can pick each part up independently
            if (_options.Count > 0)
            {
                html.Add
                (
                    new HtmlElementTextContentDiv()
                    {
                        Class = "wx-sidebar-options"
                    }
                        .Add(_options.Select(x => x.Render(renderContext, visualTree)))
                );
            }

            // nest the children inside a dedicated container so the client parser
            // can lift the subtree without confusing it with the link's own label
            if (children.Count > 0)
            {
                html.Add
                (
                    new HtmlElementTextContentDiv()
                    {
                        Class = "wx-sidebar-children"
                    }
                        .Add(children.Select(x => x.Render(renderContext, visualTree)))
                );
            }

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
