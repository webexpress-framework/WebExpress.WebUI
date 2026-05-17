using System;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a media control panel that can display an image and a title.
    /// </summary>
    public class ControlPanelMedia : ControlPanel
    {
        /// <summary>
        /// Gets or sets the title.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the uri to the image.
        /// </summary>
        public Func<IRenderControlContext, string> Image { get; set; }

        /// <summary>
        /// Gets or sets the width of the image in pixel.
        /// </summary>
        public Func<IRenderControlContext, uint?> ImageWidth { get; set; }

        /// <summary>
        /// Gets or sets the height of the image in pixel.
        /// </summary>
        public Func<IRenderControlContext, uint?> ImageHeight { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="title">The headline.</param>
        public ControlPanelMedia(string id = null)
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
            var role = Role?.Invoke(renderContext);
            var theme = Theme?.Invoke(renderContext) ?? TypeTheme.None;
            var title = Title?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);
            var imageWidth = ImageWidth?.Invoke(renderContext);
            var imageHeight = ImageHeight?.Invoke(renderContext);

            var img = new HtmlElementMultimediaImg()
            {
                Src = image?.ToString(),
                Class = "me-3 mt-3 " // rounded-circle
            };

            if (imageWidth.HasValue)
            {
                img.Width = (int)imageWidth;
            }

            if (imageHeight.HasValue)
            {
                img.Height = (int)imageHeight;
            }

            var heading = !string.IsNullOrWhiteSpace(title)
                ? new HtmlElementSectionH4(new HtmlText(I18N.Translate(renderContext.Request?.Culture, title)))
                : null;

            var body = new HtmlElementTextContentDiv(heading)
            {
                Class = "media-body"
            };

            body.Add(Content.Select(x => x.Render(renderContext, visualTree)));

            var html = new HtmlElementTextContentDiv(img, body)
            {
                Id = Id,
                Class = Css.Concatenate("media", GetClasses()),
                Style = GetStyles(),
                Role = role,
                DataTheme = theme.ToValue()
            };

            return html;
        }
    }
}
