using System;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a date picker input form item control.
    /// </summary>
    public partial class ControlFormItemInputAvatar : ControlFormItemInput<ControlFormInputValueFile>
    {
        /// <summary>
        /// Gets or sets the description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets the placeholder text displayed when no date is selected.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the URI endpoint for avatar image upload.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Gets or sets the clipping shape of the avatar image. Supported values are "circle" and "rect".
        /// </summary>
        public TypeAvatarShape Shape { get; set; }

        /// <summary>
        /// Gets or sets the size of the cropping viewport in pixels.
        /// </summary>
        public int Viewport { get; set; } = -1;

        /// <summary>
        /// Gets or sets the final resolution of the avatar image in pixels.
        /// </summary>
        public int OutputSize { get; set; } = -1;

        /// <summary>
        /// Gets or sets the MIME type of the exported avatar image.
        /// </summary>
        public ContentType OutputFormat { get; set; } = ContentType.Unknown;

        /// <summary>
        /// Gets or sets the compression quality for formats like JPEG or WebP. Ranges from 0 to 1.
        /// </summary>
        public float OutputQuality { get; set; } = -1;

        /// <summary>
        /// Gets or sets the accepted MIME types for avatar upload.
        /// </summary>
        public ContentType[] Accept { get; set; } = [];

        /// <summary>
        /// Gets or sets the transparency level of the cropping overlay. Ranges from 0 (transparent) to 1 (opaque).
        /// </summary>
        public float OverlayAlpha { get; set; } = -1;

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputAvatar()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputAvatar(string id)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext.GetValue<ControlFormInputValueFile>(this)?.Name;

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-webui-input-avatar"
            }
                .AddUserAttribute("name", Name)
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, Placeholder))
                .AddUserAttribute("uri", Uri?.ToString())
                .AddUserAttribute("shape", Shape.ToShape())
                .AddUserAttribute("viewport", Viewport > 0 ? Viewport.ToString() : null)
                .AddUserAttribute("size", OutputSize > 0 ? OutputSize.ToString() : null)
                .AddUserAttribute("output-format", OutputFormat != ContentType.Unknown
                    ? OutputFormat.GetMimeType()
                    : null)
                .AddUserAttribute("output-quality", OutputQuality > 0
                    ? OutputQuality.ToString(System.Globalization.CultureInfo.InvariantCulture)
                    : null)
                .AddUserAttribute("accept", Accept is not null
                    ? string.Join(",", Accept?.Select(x => x.GetMimeType()))
                    : null)
                .AddUserAttribute("overlay-alpha", OverlayAlpha > 0
                    ? OverlayAlpha.ToString(System.Globalization.CultureInfo.InvariantCulture)
                    : null)
                .AddUserAttribute("data-value", value);

            return html;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be converted. Cannot be null.
        /// </param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>
        /// The value created from the specified string representation.
        /// </returns>
        protected override ControlFormInputValueFile CreateValue(string value, IRenderControlFormContext renderContext)
        {
            const string filePrefix = "file:";
            const string dataPrefix = ";data:";
            const string separator = ";base64,";

            if (string.IsNullOrWhiteSpace(value))
            {
                return new ControlFormInputValueFile();
            }

            // locate the filename and data sections
            var fileIndex = value.IndexOf(filePrefix);
            var dataIndex = value.IndexOf(dataPrefix);
            var separatorIndex = value.IndexOf(separator);

            if (fileIndex != 0 || dataIndex < 0 || separatorIndex < 0)
            {
                throw new ArgumentException("Invalid format. Expected 'file:<filename>;data:<mime>;base64,<payload>'.");
            }

            // extract filename
            var filename = value[filePrefix.Length..dataIndex];

            // extract MIME type
            var contentTypeString = value[(dataIndex + dataPrefix.Length)..separatorIndex];
            var contentType = ContentTypeExtensions.ToContentTypeFromMime(contentTypeString);

            // extract and sanitize Base64 payload
            var base64Data = value[(separatorIndex + separator.Length)..];
            base64Data = string.Concat(base64Data.Where(c =>
                char.IsLetterOrDigit(c) || c == '+' || c == '/' || c == '='
            ));

            // decode Base64
            var fileData = Convert.FromBase64String(base64Data);

            // return populated file value
            return new ControlFormInputValueFile(filename)
            {
                ContentType = contentType,
                Data = fileData
            };
        }
    }
}
