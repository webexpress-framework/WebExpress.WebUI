using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a view control.
    /// </summary>
    public class ControlView : Control, IControlView
    {
        private readonly List<IControlViewHeader> _headers = [];
        private readonly List<IControlViewItem> _views = [];
        private readonly List<IControlViewFooter> _footers = [];

        /// <summary>
        /// Returns the collection of headers that define the structure
        /// and metadata of the control view.
        /// </summary>
        public IEnumerable<IControlViewHeader> Headers => _headers;

        /// <summary>
        /// Returns the views of the control.
        /// </summary>
        public IEnumerable<IControlViewItem> Views => _views;

        /// <summary>
        /// Returns the collection of footers associated with the control view.
        /// </summary>
        public IEnumerable<IControlViewFooter> Footers => _footers;

        /// <summary>
        /// Gets or sets the layout used to render the view control.
        /// </summary>
        public TypeLayoutView Layout { get; set; } = TypeLayoutView.Default;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlView(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Adds one or more headers to the view control.
        /// </summary>
        /// <param name="headers">The headers to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Add(params IControlViewHeader[] headers)
        {
            _headers.AddRange(headers);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Add(params IControlViewItem[] items)
        {
            _views.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more fotters to the view control.
        /// </summary>
        /// <param name="footers">The footer to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Add(params IControlViewFooter[] footers)
        {
            _footers.AddRange(footers);

            return this;
        }

        /// <summary>
        /// Adds one or more headers to the view control.
        /// </summary>
        /// <param name="headers">The headers to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Add(IEnumerable<IControlViewHeader> headers)
        {
            _headers.AddRange(headers);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Add(IEnumerable<IControlViewItem> items)
        {
            _views.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more footers to the view control.
        /// </summary>
        /// <param name="footers">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Add(IEnumerable<IControlViewFooter> footers)
        {
            _footers.AddRange(footers);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the view control.
        /// </summary>
        /// <param name="header">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Remove(IControlViewHeader header)
        {
            _headers.Remove(header);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the view control.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Remove(IControlViewItem item)
        {
            _views.Remove(item);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the view control.
        /// </summary>
        /// <param name="footer">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlView Remove(IControlViewFooter footer)
        {
            _footers.Remove(footer);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var classes = Classes.ToList();

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-view", classes),
                Style = GetStyles(),
                Role = Role
            }
                .AddUserAttribute("data-layout", Layout == TypeLayoutView.Default ? null : Layout.ToValue())
                .Add(_headers.Select(x => x.Render(renderContext, visualTree)))
                .Add(_views.Select(x => x.Render(renderContext, visualTree)))
                .Add(_footers.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
