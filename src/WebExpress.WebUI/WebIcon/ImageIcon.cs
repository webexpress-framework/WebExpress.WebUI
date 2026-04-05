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
        /// Returns the size associated with the icon.
        /// </summary>
        public PropertySizeIcon Size { get; }

        /// <summary>
        /// Returns the URI associated with the icon. This property must be 
        /// implemented by derived classes to provide the specific URI of the icon.
        /// </summary>
        public IUri Uri { get; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="uri">The URI of the icon.</param>
        public ImageIcon(IUri uri)
        {
            Uri = uri;
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="uri">The URI of the icon.</param>
        /// <param name="size">The size of the icon.</param>
        public ImageIcon(IUri uri, PropertySizeIcon size)
        {
            Uri = uri;
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
                : applicationPath?.Concat(assembly.GetName().Name.ToLower());

            Uri = uri.IsRelative
                    ? pluginPath?.Concat(uri.ToString()).ToUri() ?? uri
                    : uri;

            Size = size;
        }

        /// <summary>
        /// Creates a new ImageIcon instance from the specified URI string.
        /// </summary>
        /// <param name="uri">
        /// The URI string that identifies the image resource to be used for the 
        /// icon. Must be a valid URI format.
        /// </param>
        /// <returns>
        /// An ImageIcon representing the image located at the specified URI.
        /// </returns>
        public static ImageIcon FromString(string uri)
        {
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

            return html;
        }
    }
}
