using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a carousel control that can contain multiple carousel items.
    /// </summary>
    public interface IControlCarousel : IControl
    {
        /// <summary>
        /// Adds one or more carousel items to the carousel.
        /// </summary>
        /// <param name="items">The carousel items to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlCarousel Add(params ControlCarouselItem[] items);

        /// <summary>
        /// Adds a collection of carousel items to the carousel.
        /// </summary>
        /// <param name="items">The collection of carousel items to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlCarousel Add(IEnumerable<ControlCarouselItem> items);

        /// <summary>
        /// Clears all carousel items from the carousel.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        IControlCarousel Clear();
    }
}
