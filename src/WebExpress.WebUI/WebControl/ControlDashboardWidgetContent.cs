using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an widget element in a dashboard control.
    /// </summary>
    public class ControlDashboardWidgetContent : IControlDashboardWidget
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Returns the id of the control.
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
        /// Gets or sets the column index associated with this widget.
        /// </summary>
        public uint Column { get; set; } = uint.MaxValue;

        /// <summary>
        /// Gets or sets a value indicating whether the widget can be moved.
        /// </summary>
        public bool Movable { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the widget can be closed.
        /// </summary>
        public bool Closeable { get; set; }

        /// <summary>
        /// Gets or sets the collection of controls that make up the content of the container.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlDashboardWidgetContent(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more items to the widget.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDashboardWidget Add(params IControl[] items)
        {
            _content.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the widget.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDashboardWidget Add(IEnumerable<IControl> items)
        {
            _content.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the widget.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDashboardWidget Remove(IControl item)
        {
            _content.Remove(item);

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
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-dashboard-widget"
            }
                .AddUserAttribute("data-title", I18N.Translate(renderContext, Title))
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", Color)
                .AddUserAttribute("data-column", Column < uint.MaxValue ? Column.ToString() : null)
                .AddUserAttribute("data-movable", Movable ? "true" : null)
                .AddUserAttribute("data-closeable", Closeable ? "true" : null)
                .Add(_content.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
