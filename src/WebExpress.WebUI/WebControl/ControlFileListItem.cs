using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Internationalization;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a control file list.
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
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets the name of the file, including its extension.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the uri of the file.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Gets or sets the size of the file in bytes.
        /// </summary>
        public long Size { get; set; } = long.MinValue;

        /// <summary>
        /// Gets or sets the date of the file.
        /// </summary>
        public DateTime Date { get; set; } = DateTime.MinValue;

        /// <summary>
        /// Gets or sets the description associated with the file.
        /// </summary>
        public string Description { get; set; }

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
            }, "{0:fs}", Size >= 0 ? Size : 0);

            return new HtmlElementTextContentDiv(new HtmlText(Name))
            {
                Class = "wx-webui-file",
            }
                .AddUserAttribute("data-file-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-file-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-file-uri", Uri?.ToString())
                .AddUserAttribute("data-file-size", Size >= 0 ? size : null)
                .AddUserAttribute("data-file-date", Date != DateTime.MinValue ? Date.ToShortDateString() : null)
                .AddUserAttribute("data-description", !string.IsNullOrWhiteSpace(Description) ? Description : null);
        }
    }
}
