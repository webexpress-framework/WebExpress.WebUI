using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a separator item in a toolbar.
    /// </summary>
    public class ControlToolbarItemDivider : IControlToolbarItem
    {
        private readonly string _id;

        /// <summary>
        /// Returns the unique identifier for the entity.
        /// </summary>
        public string Id => _id;

        /// <summary>
        /// Gets or sets the alignment of the toolbar item.
        /// </summary>
        public Func<IRenderControlContext, TypeToolbarItemAlignment> Alignment { get; set; } = _ => TypeToolbarItemAlignment.Default;

        /// <summary>
        /// Gets the overflow behavior of the toolbar item.
        /// </summary>
        public Func<IRenderControlContext, TypeToolbarItemOverflow> Overflow { get; set; } = _ => TypeToolbarItemOverflow.Default;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlToolbarItemDivider(string id = null)
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
            var alignment = Alignment?.Invoke(renderContext) ?? TypeToolbarItemAlignment.Default;
            var overflow = Overflow?.Invoke(renderContext) ?? TypeToolbarItemOverflow.Default;

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-toolbar-separator"
            }
                .AddUserAttribute("data-align", alignment.ToValue())
                .AddUserAttribute("data-overflow", overflow.ToValue());
        }
    }
}
