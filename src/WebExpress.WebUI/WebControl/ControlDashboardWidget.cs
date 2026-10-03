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
    /// A single widget (panel) placed on a dashboard, wrapping a piece of content shown in the dashboard grid.
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
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the color associated with the widget.
        /// </summary>
        public Func<IRenderControlContext, string> Color { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with this widget.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the column index associated with this widget.
        /// </summary>
        public Func<IRenderControlContext, uint> Column { get; set; } = _ => uint.MaxValue;

        /// <summary>
        /// Gets or sets a value indicating whether the widget can be moved.
        /// </summary>
        public Func<IRenderControlContext, bool> Movable { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets a value indicating whether the widget can be closed.
        /// </summary>
        public Func<IRenderControlContext, bool> Closeable { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets the widget name or identifier associated with this instance.
        /// </summary>
        public Func<IRenderControlContext, string> Widget { get; set; }

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
            var widget = Widget?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-dashboard-widget"
            }
                .AddUserAttribute("data-title", I18N.Translate(renderContext, Title?.Invoke(renderContext)))
                .AddUserAttribute("data-icon", (Icon?.Invoke(renderContext) as Icon)?.Class)
                .AddUserAttribute("data-image", Image?.Invoke(renderContext)?.ToString() ?? (Icon?.Invoke(renderContext) as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", Color?.Invoke(renderContext))
                .AddUserAttribute("data-column", (Column?.Invoke(renderContext) ?? uint.MaxValue) < uint.MaxValue ? (Column?.Invoke(renderContext) ?? uint.MaxValue).ToString() : null)
                .AddUserAttribute("data-movable", !(Movable?.Invoke(renderContext) ?? true) ? "false" : null)
                .AddUserAttribute("data-closeable", !(Closeable?.Invoke(renderContext) ?? true) ? "false" : null)
                .AddUserAttribute("data-widget", widget);

            return html;
        }
    }
}
