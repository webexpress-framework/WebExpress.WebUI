using WebExpress.WebCore.WebApplication;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents the web express icon.
    /// </summary>
    public class ImageIconWebExpress : ImageIcon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="applicationContext">The application context to be associated with the icon.</param>
        public ImageIconWebExpress(IApplicationContext applicationContext = null)
            : base(new UriEndpoint("/assets/img/webexpress.svg"), null, applicationContext)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="size">The size of the icon.</param>
        /// <param name="applicationContext">The application context to be associated with the icon.</param>
        public ImageIconWebExpress(PropertySizeIcon size, IApplicationContext applicationContext = null)
            : base(new UriEndpoint("/assets/img/webexpress.svg"), size, applicationContext)
        {
        }
    }
}
