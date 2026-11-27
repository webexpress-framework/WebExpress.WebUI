using WebExpress.WebCore;
using WebExpress.WebCore.WebApplication;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an abstract base class for image-based icons.
    /// </summary>
    public class ImageIcon : IIcon
    {
        /// <summary>
        /// Gets the size associated with the icon.
        /// </summary>
        public PropertySizeIcon Size { get; }

        private readonly IUri _uri;

        /// <summary>
        /// Gets the URI associated with the icon.
        /// </summary>
        /// <remarks>
        /// An icon is named by the plain address of its picture, but the same pictures appear on
        /// every page - in the breadcrumb, the navigation, lists and cards. While the picture is a
        /// file of a plugin, this is the address that carries the hash of its content, which the
        /// browser keeps for good; any other address, such as an endpoint that draws the picture
        /// or a data url, is kept as given. It is resolved on every read, because the icon is
        /// often created before the file is mounted.
        /// </remarks>
        public IUri Uri => _uri is UriEndpoint
            ? WebEx.ComponentHub?.AssetManager?.GetVersionedAssetRoute(_uri.ToString())?.ToUri() ?? _uri
            : _uri;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="uri">The URI of the icon.</param>
        public ImageIcon(IUri uri)
        {
            _uri = uri;
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="uri">The URI of the icon.</param>
        /// <param name="size">The size of the icon.</param>
        public ImageIcon(IUri uri, PropertySizeIcon size)
        {
            _uri = uri;
            Size = size;
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="uri">The URI of the icon.</param>
        /// <param name="size">The size of the icon.</param>
        /// <param name="applicationContext">
        /// The application context to be associated with the icon.
        /// </param>
        protected ImageIcon(IUri uri, PropertySizeIcon size, IApplicationContext applicationContext = null)
        {
            var assembly = GetType().Assembly;
            var applicationPath = applicationContext?.Route;
            var pluginPath = applicationContext?.PluginContext?.Assembly == assembly
                ? applicationPath
                : applicationPath?.Concat(assembly.GetName().Name.ToLowerInvariant());

            _uri = uri.IsRelative
                    ? pluginPath?.Concat(uri.ToString()).ToUri() ?? uri
                    : uri;

            Size = size;
        }

        /// <summary>
        /// Creates a new ImageIcon instance from the specified URI string.
        /// </summary>
        /// <param name="uri">
        /// The URI string that identifies the image resource to be used for the 
        /// icon. A data url is kept as written, because it carries the picture itself.
        /// </param>
        /// <returns>
        /// An ImageIcon representing the image located at the specified URI.
        /// </returns>
        public static ImageIcon FromString(string uri)
        {
            if (uri?.StartsWith("data:", System.StringComparison.OrdinalIgnoreCase) == true)
            {
                return new ImageIcon(new UriData(uri));
            }

            return new ImageIcon(new UriEndpoint(uri));
        }

        /// <summary>
        /// Converts the icon to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the icon is rendered.</param>
        /// <param name="visualTree">The visual tree representing the icon's structure.</param>
        /// <param name="id">The id attribute of the HTML element.</param>
        /// <param name="description">
        /// The description of the icon, used for accessibility and tooltips.
        /// </param>
        /// <param name="css">The CSS class of the HTML element.</param>
        /// <param name="style">The inline style of the HTML element.</param>
        /// <param name="role">The ARIA role of the HTML element.</param>
        /// <returns>An <see cref="IHtmlNode"/> representing the rendered icon.</returns>
        public IHtmlNode Render(IRenderContext renderContext, IVisualTree visualTree, string id = null, string description = null, string css = null, string style = null, string role = null)
        {
            var html = new HtmlElementMultimediaImg()
            {
                Id = id,
                Class = Css.Concatenate(css, Size?.ToClass()),
                Style = Style.Concatenate(style, Size?.ToStyle()),
                Role = role,
                Src = Uri.ToString()
            };

            html.AddUserAttribute("title", description);
            // an icon without a description is decoration and is skipped by a reader
            if (string.IsNullOrWhiteSpace(description)) { html.AddUserAttribute("alt"); } else { html.Alt = description; }

            return html;
        }
    }
}
