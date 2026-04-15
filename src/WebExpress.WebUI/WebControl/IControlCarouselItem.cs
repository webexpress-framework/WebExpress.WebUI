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
        public string Headline { get; }

        /// <summary>
        /// Gets the text.
        /// </summary>
        public string Text { get; }

        /// <summary>
        /// Gets the slideshow element, such as an image.
        /// </summary>
        public IControl Control { get; }
    }
}
