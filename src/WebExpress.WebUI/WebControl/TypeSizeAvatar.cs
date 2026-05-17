namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The size options for avatar.
    /// </summary>
    public enum TypeSizeAvatar
    {
        /// <summary>
        /// The default size.
        /// </summary>
        Default,

        /// <summary>
        /// The small size.
        /// </summary>
        Small,

        /// <summary>
        /// The large size.
        /// </summary>
        Large
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeSizeButton"/> enum.
    /// </summary>
    public static class TypeSizeAvatarExtensions
    {
        /// <summary>
        /// Converts the button size to a CSS class.
        /// </summary>
        /// <param name="size">The size to be converted.</param>
        /// <returns>The CSS class corresponding to the size.</returns>
        public static string ToClass(this TypeSizeAvatar size)
        {
            return size switch
            {
                TypeSizeAvatar.Large => "wx-profile-lg",
                TypeSizeAvatar.Small => "wx-profile-sm",
                _ => string.Empty,
            };
        }
    }
}
