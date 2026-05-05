using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table cell in a control, including its attributes and content.
    /// </summary>
    /// <remarks>
    /// This class provides properties to define the cell's identifier, 
    /// CSS class, inline styles, and the content displayed within the cell. It 
    /// is typically used to represent and manipulate  individual cells in
    /// a table-like control.
    /// </remarks>
    public class ControlTableCell : IControlTableCell
    {
        /// <summary>
        /// Gets or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the class or category associated with the current object.
        /// </summary>
        public virtual Func<IRenderControlContext, string> Class { get; set; }

        /// <summary>
        /// Gets or sets the style applied to the element.
        /// </summary>
        public virtual Func<IRenderControlContext, string> Style { get; set; }

        /// <summary>
        /// Gets or sets the color scheme used for the cell.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeColorTable> Color { get; set; } = _ => TypeColorTable.Default;

        /// <summary>
        /// Gets or sets the icon associated with this instance.
        /// </summary>
        public virtual Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public virtual Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the URI associated with the current resource.
        /// </summary>
        public virtual Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the target.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeTarget> Target { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public virtual Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double-click to open a modal or similar target.
        /// </summary>
        public virtual Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the content associated with this cell.
        /// </summary>
        public virtual Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">The unique identifier for the table cell. Cannot be null or empty.</param>
        public ControlTableCell(string id = null)
        {
            Id = id;
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
            var image = Image?.Invoke(renderContext);
            var uri = Uri?.Invoke(renderContext);
            var target = Target?.Invoke(renderContext) ?? TypeTarget.None;
            var primaryAction = PrimaryAction?.Invoke(renderContext);
            var secondaryAction = SecondaryAction?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv(new HtmlText(text))
            {
                Id = Id,
                Class = Class?.Invoke(renderContext),
                Style = Style?.Invoke(renderContext)
            }
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", (Color?.Invoke(renderContext) ?? TypeColorTable.Default).ToClass())
                .AddUserAttribute("data-uri", uri?.ToString())
                .AddUserAttribute("data-target", target.ToValue());

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
