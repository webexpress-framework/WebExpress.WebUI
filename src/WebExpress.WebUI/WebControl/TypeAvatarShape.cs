namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines the clipping shape options for avatar images.
    /// </summary>
    public enum TypeAvatarShape
    {
        /// <summary>
        /// The default avatar shape. Typically rendered as a circle.
        /// </summary>
        Default,

        /// <summary>
        /// Renders the avatar image as a circle.
        /// </summary>
        Circle,

        /// <summary>
        /// Renders the avatar image as a rectangle.
        /// </summary>
        Rect
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeAvatarShape"/> enum.
    /// </summary>
    public static class TypeAvatarShapeExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeAvatarShape"/> value to a corresponding CSS class.
        /// </summary>
        /// <param name="shape">The avatar shape to convert.</param>
        /// <returns>The CSS class representing the shape.</returns>
        public static string ToShape(this TypeAvatarShape shape)
        {
            return shape switch
            {
                TypeAvatarShape.Circle => "circle",
                TypeAvatarShape.Rect => "rect",
                _ => null
            };
        }
    }
}
