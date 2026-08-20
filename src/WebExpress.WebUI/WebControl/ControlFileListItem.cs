using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebTheme;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Internationalization;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A single file entry within a ControlFileList, showing one file and its actions.
    /// </summary>
    public class ControlFileListItem : IControlFileListItem
    {
        private readonly string _id;

        /// <summary>
        /// Gets or sets the unique identifier for the entity.
        /// </summary>
        public string Id => _id;

        /// <summary>
        /// Gets or sets the icon associated with this file.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the name of the file, including its extension.
        /// </summary>
        public Func<IRenderControlContext, string> Name { get; set; }

        /// <summary>
        /// Gets or sets the uri of the file.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the size of the file in bytes.
        /// </summary>
        public Func<IRenderControlContext, long> Size { get; set; } = _ => long.MinValue;

        /// <summary>
        /// Gets or sets the date of the file.
        /// </summary>
        public Func<IRenderControlContext, DateTime> Date { get; set; } = _ => DateTime.MinValue;

        /// <summary>
        /// Gets or sets the description associated with the file.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFileListItem(string id = null)
        {
            _id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var size = string.Format(new FileSizeFormatProvider()
            {
                Culture = renderContext?.Request?.Culture
            }, "{0:fs}", (Size?.Invoke(renderContext) ?? long.MinValue) >= 0 ? (Size?.Invoke(renderContext) ?? long.MinValue) : 0);

            return new HtmlElementTextContentDiv(new HtmlText(Name?.Invoke(renderContext)))
            {
                Class = "wx-webui-file",
            }
                // the icon travels to the client as a bare class string, so it has
                // to carry the page's theme with it; without this the preview was
                // the one place a light page still drew a FontAwesome glyph
                .AddUserAttribute("data-file-icon", (Icon?.Invoke(renderContext)?.ApplyIconTheme(visualTree?.IconTheme ?? TypeIconTheme.Default) as Icon)?.Class)
                .AddUserAttribute("data-file-image", Image?.Invoke(renderContext)?.ToString() ?? (Icon?.Invoke(renderContext) as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-file-uri", Uri?.Invoke(renderContext)?.ToString())
                .AddUserAttribute("data-file-size", (Size?.Invoke(renderContext) ?? long.MinValue) >= 0 ? size : null)
                .AddUserAttribute("data-file-date", (Date?.Invoke(renderContext) ?? DateTime.MinValue) != DateTime.MinValue ? (Date?.Invoke(renderContext) ?? DateTime.MinValue).ToShortDateString() : null)
                .AddUserAttribute("data-description", !string.IsNullOrWhiteSpace(Description?.Invoke(renderContext)) ? Description?.Invoke(renderContext) : null);
        }
    }
}
