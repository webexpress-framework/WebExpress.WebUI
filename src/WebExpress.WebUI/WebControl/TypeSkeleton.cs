namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The shape of a loading skeleton placeholder.
    /// </summary>
    public enum TypeSkeleton
    {
        /// <summary>
        /// One or more text lines.
        /// </summary>
        Text,

        /// <summary>
        /// A circular placeholder, for example an avatar.
        /// </summary>
        Circle,

        /// <summary>
        /// A rectangular placeholder, for example an image or a card.
        /// </summary>
        Rectangle
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeSkeleton"/> enum.
    /// </summary>
    public static class TypeSkeletonExtensions
    {
        /// <summary>
        /// Converts the skeleton shape to a CSS class.
        /// </summary>
        /// <param name="type">The shape.</param>
        /// <returns>The CSS class corresponding to the shape.</returns>
        public static string ToClass(this TypeSkeleton type)
        {
            return type switch
            {
                TypeSkeleton.Circle => "wx-skeleton-circle",
                TypeSkeleton.Rectangle => "wx-skeleton-rect",
                _ => "wx-skeleton-text",
            };
        }
    }
}
