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
    /// Represents a view item control.
    /// </summary>
    public class ControlViewItem : IControlViewItem
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Gets or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the title text.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the description of the view.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the detail frame is enabled.
        /// </summary>
        public bool DetailFrame { get; set; }

        /// <summary>
        /// Gets or sets the initial size of the detail pane (e.g. "300px" or "30%").
        /// </summary>
        public string DetailSize { get; set; }

        /// <summary>
        /// Gets or sets the minimum size of the detail pane in pixels.
        /// </summary>
        public int? DetailMinSide { get; set; }

        /// <summary>
        /// Gets or sets the maximum size of the detail pane in pixels.
        /// </summary>
        public int? DetailMaxSide { get; set; }

        /// <summary>
        /// Returns the content of the view control.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlViewItem(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlViewItem Add(params IControl[] items)
        {
            _content.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlViewItem Add(IEnumerable<IControl> items)
        {
            _content.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the view.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlViewItem Remove(IControl item)
        {
            _content.Remove(item);

            return this;
        }

        /// <summary>
        /// Converts the column to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-view"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Title))
                .AddUserAttribute("data-description", I18N.Translate(renderContext, Description))
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri.ToString())
                .AddUserAttribute("data-has-details", DetailFrame ? "true" : null)
                .AddUserAttribute("data-detail-size", DetailSize)
                .AddUserAttribute("data-detail-min-side", DetailMinSide?.ToString())
                .AddUserAttribute("data-detail-max-side", DetailMaxSide?.ToString())
                .Add(_content.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
