namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the available shapes for an avatar thumbnail.
    /// </summary>
    public enum TypeShapeAvatar
    {
        /// <summary>
        /// Represents a circular shape (default).
        /// </summary>
        Circle,

        /// <summary>
        /// Represents a rectangular shape with rounded corners.
        /// </summary>
        Rect
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeShapeAvatar"/> enumeration.
    /// </summary>
    public static class TypeShapeAvatarExtensions
    {
        /// <summary>
        /// Converts the TypeShapeAvatar to a corresponding data attribute value.
        /// </summary>
        /// <param name="shape">The TypeShapeAvatar to be converted.</param>
        /// <returns>The string value corresponding to the TypeShapeAvatar.</returns>
        public static string ToValue(this TypeShapeAvatar shape)
        {
            return shape switch
            {
                TypeShapeAvatar.Rect => "rect",
                TypeShapeAvatar.Circle => "circle",
                _ => string.Empty,
            };
        }
    }
}
