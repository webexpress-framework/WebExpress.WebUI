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
        /// Returns or sets the title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Returns or sets the uri to the image.
        /// </summary>
        public string Image { get; set; }

        /// <summary>
        /// Returns or sets the width of the image in pixel.
        /// </summary>
        public uint? ImageWidth { get; set; }

        /// <summary>
        /// Returns or sets the height of the image in pixel.
        /// </summary>
        public uint? ImageHeight { get; set; }

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
            var img = new HtmlElementMultimediaImg()
            {
                Src = Image?.ToString(),
                Class = "me-3 mt-3 " // rounded-circle
            };

            if (ImageWidth.HasValue)
            {
                img.Width = (int)ImageWidth;
            }

            if (ImageHeight.HasValue)
            {
                img.Height = (int)ImageHeight;
            }

            var heading = !string.IsNullOrWhiteSpace(Title)
                ? new HtmlElementSectionH4(new HtmlText(I18N.Translate(renderContext.Request?.Culture, Title)))
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
                Role = Role,
                DataTheme = Theme.ToValue()
            };

            return html;
        }
    }
}
