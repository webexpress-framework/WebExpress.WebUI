namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an slideshow element in a carousel control.
    /// </summary>
    public interface IControlCarouselItem
    {
        /// <summary>
        /// Returns the headline.
        /// </summary>
        public string Headline { get; }

        /// <summary>
        /// Returns the text.
        /// </summary>
        public string Text { get; }

        /// <summary>
        /// Returns the slideshow element, such as an image.
        /// </summary>
        public IControl Control { get; }
    }
}
