using System;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an slideshow element in a carousel control.
    /// </summary>
    public class ControlCarouselItem : IControlCarouselItem
    {
        /// <summary>
        /// Gets or sets the headline.
        /// </summary>
        public Func<IRenderControlContext, string> Headline { get; set; }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the slideshow element, such as an image.
        /// </summary>
        public Func<IRenderControlContext, IControl> Control { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an optional control.
        /// </summary>
        /// <param name="control">The control to be used in the carousel item. If null, no control is set.</param>
        public ControlCarouselItem(IControl control = null)
        {
            Control = _ => control;
        }
    }
}
