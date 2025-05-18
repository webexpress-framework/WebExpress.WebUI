using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a column in a control table.
    /// </summary>
    public interface IControlTableColumn : IWebUIElement<IRenderControlContext, IVisualTreeControl>
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
    }
}
