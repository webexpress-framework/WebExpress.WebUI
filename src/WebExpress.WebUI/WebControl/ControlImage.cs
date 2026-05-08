using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an image control that can be rendered as HTML.
    /// </summary>
    public class ControlImage : Control
    {
        /// <summary>
        /// Gets or sets the image source.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the width.
        /// </summary>
        public new Func<IRenderControlContext, int> Width { get; set; }

        /// <summary>
        /// Gets or sets the height.
        /// </summary>
        public new Func<IRenderControlContext, int> Height { get; set; }

        /// <summary>
        /// Gets or sets a tooltip text.
        /// </summary>
        public Func<IRenderControlContext, string> Tooltip { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="uri">The image source.</param>
        public ControlImage(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var horizontalAlignment = HorizontalAlignment?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);
            var uri = Uri?.Invoke(renderContext);
            var tooltip = Tooltip?.Invoke(renderContext);
            var width = Width?.Invoke(renderContext) ?? 0;
            var height = Height?.Invoke(renderContext) ?? 0;

            var html = new HtmlElementMultimediaImg()
            {
                Id = Id,
                Class = Css.Concatenate(horizontalAlignment?.ToClass(), GetClasses()),
                Style = GetStyles(),
                Role = role,
                Alt = tooltip,
                Src = uri?.ToString(),
            };

            if (!string.IsNullOrWhiteSpace(tooltip))
            {
                html.AddUserAttribute("data-toggle", "tooltip");
                html.AddUserAttribute("title", tooltip);
            }

            if (width > 0)
            {
                html.AddUserAttribute("width", width.ToString());
            }

            if (height > 0)
            {
                html.AddUserAttribute("height", height.ToString());
            }

            return html;
        }
    }
}
