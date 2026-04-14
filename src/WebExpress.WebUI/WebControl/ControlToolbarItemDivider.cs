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
        public TypeToolbarItemAlignment Alignment { get; set; } = TypeToolbarItemAlignment.Default;

        /// <summary>
        /// Returns the overflow behavior of the toolbar item.
        /// </summary>
        public TypeToolbarItemOverflow Overflow { get; set; } = TypeToolbarItemOverflow.Default;

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
            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-toolbar-separator"
            }
                .AddUserAttribute("data-align", Alignment.ToValue())
                .AddUserAttribute("data-overflow", Overflow.ToValue());
        }
    }
}
