using System;
using System.Globalization;
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
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets the placeholder text displayed when no date is selected.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the URI endpoint for avatar image upload.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the clipping shape of the avatar image. Supported values are "circle" and "rect".
        /// </summary>
        public Func<IRenderControlContext, TypeAvatarShape> Shape { get; set; }

        /// <summary>
        /// Gets or sets the size of the cropping viewport in pixels.
        /// </summary>
        public Func<IRenderControlContext, int> Viewport { get; set; } = _ => -1;

        /// <summary>
        /// Gets or sets the final resolution of the avatar image in pixels.
        /// </summary>
        public Func<IRenderControlContext, int> OutputSize { get; set; } = _ => -1;

        /// <summary>
        /// Gets or sets the MIME type of the exported avatar image.
        /// </summary>
        public Func<IRenderControlContext, ContentType> OutputFormat { get; set; } = _ => ContentType.Unknown;

        /// <summary>
        /// Gets or sets the compression quality for formats like JPEG or WebP. Ranges from 0 to 1.
        /// </summary>
        public Func<IRenderControlContext, float> OutputQuality { get; set; } = _ => -1;

        /// <summary>
        /// Gets or sets the accepted MIME types for avatar upload.
        /// </summary>
        public Func<IRenderControlContext, ContentType[]> Accept { get; set; } = _ => [];

        /// <summary>
        /// Gets or sets the transparency level of the cropping overlay. Ranges from 0 (transparent) to 1 (opaque).
        /// </summary>
        public Func<IRenderControlContext, float> OverlayAlpha { get; set; } = _ => -1;

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
            var name = Name?.Invoke(renderContext);
            var placeholder = Placeholder?.Invoke(renderContext);
            var uri = Uri?.Invoke(renderContext);
            var shape = Shape?.Invoke(renderContext);
            var viewport = Viewport?.Invoke(renderContext);
            var outputSize = OutputSize?.Invoke(renderContext);
            var outputFormat = OutputFormat?.Invoke(renderContext);
            var outputQuality = OutputQuality?.Invoke(renderContext);
            var overlayAlpha = OverlayAlpha?.Invoke(renderContext);
            var accept = Accept?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-webui-input-avatar"
            }
                .AddUserAttribute("name", name)
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, placeholder))
                .AddUserAttribute("uri", uri?.ToString())
                .AddUserAttribute("shape", shape?.ToShape())
                .AddUserAttribute("viewport", viewport > 0 ? viewport.ToString() : null)
                .AddUserAttribute("size", outputSize > 0 ? outputSize.ToString() : null)
                .AddUserAttribute("output-format", outputFormat != ContentType.Unknown
                    ? outputFormat?.GetMimeType()
                    : null)
                .AddUserAttribute("output-quality", outputQuality > 0
                    ? outputQuality?.ToString(CultureInfo.InvariantCulture)
                    : null)
                .AddUserAttribute("accept", accept is not null
                    ? string.Join(",", accept?.Select(x => x.GetMimeType()))
                    : null)
                .AddUserAttribute("overlay-alpha", overlayAlpha > 0
                    ? overlayAlpha?.ToString(CultureInfo.InvariantCulture)
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
