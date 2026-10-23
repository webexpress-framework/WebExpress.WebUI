using System;
using System.Collections.Generic;
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
    /// Represents an input that takes a picture - an avatar, a logo - cropped in the browser.
    /// </summary>
    public partial class ControlFormItemInputAvatar : ControlFormItemInput<ControlFormInputValueFile>
    {
        private const string FilePrefix = "file:";
        private const string DataPrefix = ";data:";
        private const string Base64Separator = ";base64,";

        /// <summary>
        /// The image types an upload may have when the input names none; the same the browser
        /// side offers by default.
        /// </summary>
        private static readonly ContentType[] DefaultAccept =
        [
            ContentType.Png, ContentType.Jpeg, ContentType.Jpg, ContentType.WebP,
            ContentType.Avif, ContentType.Gif, ContentType.Bmp, ContentType.Svg
        ];

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
            var value = ToFieldValue(renderContext.GetValue<ControlFormInputValueFile>(this));
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
                .AddUserAttribute("data-required", RequiredMark(renderContext))
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, placeholder))
                .AddUserAttribute("data-uri", uri?.ToString())
                .AddUserAttribute("data-shape", shape?.ToShape())
                .AddUserAttribute("data-viewport", viewport > 0 ? viewport.ToString() : null)
                .AddUserAttribute("data-size", outputSize > 0 ? outputSize.ToString() : null)
                .AddUserAttribute("data-output-format", outputFormat != ContentType.Unknown
                    ? outputFormat?.GetMimeType()
                    : null)
                .AddUserAttribute("data-output-quality", outputQuality > 0
                    ? outputQuality?.ToString(CultureInfo.InvariantCulture)
                    : null)
                .AddUserAttribute("accept", accept is not null
                    ? string.Join(",", accept?.Select(x => x.GetMimeType()))
                    : null)
                .AddUserAttribute("data-overlay-alpha", overlayAlpha > 0
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
            if (string.IsNullOrWhiteSpace(value))
            {
                return new ControlFormInputValueFile();
            }

            // a field the user left alone sends back the picture it was given - an uri or a
            // name - which tells the page that nothing about the picture changed
            if (!value.StartsWith(FilePrefix, StringComparison.Ordinal))
            {
                return new ControlFormInputValueFile(value);
            }

            // a malformed upload is refused by the validation, not thrown at the request
            return TryParseUpload(value, out var upload) ? upload : new ControlFormInputValueFile();
        }

        /// <summary>
        /// Validates the input. Besides the rules every input keeps, an upload must be readable,
        /// of an image type the input accepts and, for an svg, free of code: the browser only
        /// offers the accepted types, but what arrives at the server may come from anywhere, and
        /// the picture is served to other users afterwards.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated.</param>
        /// <returns>The validation results.</returns>
        public override IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext)
        {
            var name = Name?.Invoke(renderContext);
            var submitted = name is not null ? renderContext?.Request?.GetParameter(name)?.Value : null;

            if ((Disabled?.Invoke(renderContext) ?? false)
                || submitted is null
                || !submitted.StartsWith(FilePrefix, StringComparison.Ordinal))
            {
                return base.Validate(renderContext);
            }

            if (!TryParseUpload(submitted, out var upload))
            {
                return [new ValidationResult(TypeInputValidity.Error, "webexpress.webui:form.inputavatar.validation.invalid")];
            }

            var accepted = Accept?.Invoke(renderContext);
            if (!(accepted is { Length: > 0 } ? accepted : DefaultAccept).Contains(upload.ContentType))
            {
                return [new ValidationResult(TypeInputValidity.Error, "webexpress.webui:form.inputavatar.validation.type")];
            }

            // an svg is passed through unchanged and served as a document, so it is only taken
            // as a picture without code
            if (upload.ContentType == ContentType.Svg && !SvgContent.IsPassive(upload.Data))
            {
                return [new ValidationResult(TypeInputValidity.Error, "webexpress.webui:form.inputavatar.validation.svg")];
            }

            return base.Validate(renderContext);
        }

        /// <summary>
        /// Returns the value the field carries for a picture, in the form the client sends it back:
        /// a picture uploaded in this request keeps its data, so a form shown again after a refused
        /// save does not lose it, and a stored picture is referred to by its uri or name.
        /// </summary>
        /// <param name="value">The value of the input.</param>
        /// <returns>The field value, or null when there is no picture.</returns>
        private static string ToFieldValue(ControlFormInputValueFile value)
        {
            if (value is null || string.IsNullOrWhiteSpace(value.Name))
            {
                return null;
            }

            if (value.Data is not { Length: > 0 })
            {
                return value.Name;
            }

            return $"{FilePrefix}{value.Name}{DataPrefix}{value.ContentType.GetMimeType()}{Base64Separator}{Convert.ToBase64String(value.Data)}";
        }

        /// <summary>
        /// Reads an upload of the form file:&lt;name&gt;;data:&lt;mime&gt;;base64,&lt;payload&gt;.
        /// </summary>
        /// <param name="value">The submitted value.</param>
        /// <param name="upload">The uploaded file, or null when the value cannot be read.</param>
        /// <returns>True when the value is a readable upload.</returns>
        private static bool TryParseUpload(string value, out ControlFormInputValueFile upload)
        {
            upload = null;

            var dataIndex = value.IndexOf(DataPrefix, StringComparison.Ordinal);
            var separatorIndex = dataIndex < 0 ? -1 : value.IndexOf(Base64Separator, dataIndex, StringComparison.Ordinal);

            if (!value.StartsWith(FilePrefix, StringComparison.Ordinal) || dataIndex < 0 || separatorIndex < 0)
            {
                return false;
            }

            var filename = value[FilePrefix.Length..dataIndex];
            // a mime type knows no blank either, so image/svg+xml is restored the same way as the
            // payload below
            var contentType = ContentTypeExtensions.ToContentTypeFromMime(value[(dataIndex + DataPrefix.Length)..separatorIndex].Replace(' ', '+'));

            // base64 knows no blank, so a blank is a plus that a WebCore before the fix of its
            // form parsing url-decoded into one; a line break is a wrap the data url picked up
            var payload = string.Concat(value[(separatorIndex + Base64Separator.Length)..]
                .Select(c => c == ' ' ? '+' : c)
                .Where(c => char.IsLetterOrDigit(c) || c == '+' || c == '/' || c == '='));
            var buffer = new byte[payload.Length * 3 / 4];

            if (!Convert.TryFromBase64String(payload, buffer, out var written) || written == 0)
            {
                return false;
            }

            upload = new ControlFormInputValueFile(filename)
            {
                ContentType = contentType,
                Data = buffer[..written]
            };

            return true;
        }
    }
}
