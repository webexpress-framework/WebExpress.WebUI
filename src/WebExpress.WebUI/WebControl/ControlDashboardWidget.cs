using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an widget element in a dashboard control.
    /// </summary>
    public class ControlDashboardWidget : IControlDashboardWidget
    {
        /// <summary>
        /// Gets the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the title associated with the widget.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the color associated with the widget.
        /// </summary>
        public string Color { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with this widget.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public IUri Image { get; set; }

        /// <summary>
        /// Gets or sets the column index associated with this widget.
        /// </summary>
        public uint Column { get; set; } = uint.MaxValue;

        /// <summary>
        /// Gets or sets a value indicating whether the widget can be moved.
        /// </summary>
        public bool Movable { get; set; } = true;

        /// <summary>
        /// Gets or sets a value indicating whether the widget can be closed.
        /// </summary>
        public bool Closeable { get; set; } = true;

        /// <summary>
        /// Gets or sets the widget name or identifier associated with this instance.
        /// </summary>
        public string Widget { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlDashboardWidget(string id = null)
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
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-dashboard-widget"
            }
                .AddUserAttribute("data-title", I18N.Translate(renderContext, Title))
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", Image?.ToString() ?? (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", Color)
                .AddUserAttribute("data-column", Column < uint.MaxValue ? Column.ToString() : null)
                .AddUserAttribute("data-movable", !Movable ? "false" : null)
                .AddUserAttribute("data-closeable", !Closeable ? "false" : null)
                .AddUserAttribute("data-widget", Widget);

            return html;
        }
    }
}
