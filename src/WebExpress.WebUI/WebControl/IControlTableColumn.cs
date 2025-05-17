using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a column in a control table.
    /// </summary>
    public interface IControlTableColumn
    {
        /// <summary>
        /// Returns the unique identifier for the entity.
        /// </summary>
        string Id { get; }

        /// <summary>
        /// Returns the header text.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Returns the icon.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Returns the render function used for rendering the cells in the column.
        /// </summary>
        public string RenderScript { get; }

        /// <summary>
        /// Returns the color scheme used for the column.
        /// </summary>
        TypeTableColor Color { get; }

        /// <summary>
        /// Converts the column to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree);
    }
}
