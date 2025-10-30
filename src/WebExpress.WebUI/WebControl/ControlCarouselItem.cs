namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an slideshow element in a carousel control.
    /// </summary>
    public class ControlCarouselItem
    {
        /// <summary>
        /// Returns or sets the headline.
        /// </summary>
        public string Headline { get; set; }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Returns or sets the slideshow element, such as an image.
        /// </summary>
        public IControl Control { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an optional control.
        /// </summary>
        /// <param name="control">The control to be used in the carousel item. If null, no control is set.</param>
        public ControlCarouselItem(IControl control = null)
        {
            Control = control;
        }
    }
}
