using System;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an slideshow element in a carousel control.
    /// </summary>
    public interface IControlCarouselItem
    {
        /// <summary>
        /// Gets the headline.
        /// </summary>
        public Func<IRenderControlContext, string> Headline { get; }

        /// <summary>
        /// Gets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; }

        /// <summary>
        /// Gets the slideshow element, such as an image.
        /// </summary>
        public Func<IRenderControlContext, IControl> Control { get; }
    }
}
