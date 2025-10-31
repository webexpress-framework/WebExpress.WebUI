namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The size options for text.
    /// </summary>
    public enum TypeSizeText
    {
        /// <summary>
        /// Default size.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Extra small size.
        /// </summary>
        ExtraSmall = 1,

        /// <summary>
        /// Small size.
        /// </summary>
        Small = 2,

        /// <summary>
        /// Large size.
        /// </summary>
        Large = 3,

        /// <summary>
        /// Extra large size.
        /// </summary>
        ExtraLarge = 4
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeSizeText"/> enum.
    /// </summary>
    public static class TypesSizeTextExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeSizeText"/> size to a CSS class.
        /// </summary>
        /// <param name="size">The size to be converted.</param>
        /// <returns>The CSS class corresponding to the size.</returns>
        public static string ToClass(this TypeSizeText size)
        {
            return size switch
            {
                TypeSizeText.ExtraLarge => "wx-elg",
                TypeSizeText.Large => "wx-lg",
                TypeSizeText.Small => "wx-sm",
                TypeSizeText.ExtraSmall => "wx-esm",
                _ => string.Empty,
            };
        }

        /// <summary>
        /// Converts the <see cref="TypeSizeText"/> size to a CSS style.
        /// </summary>
        /// <param name="size">The size to be converted.</param>
        /// <returns>The CSS style corresponding to the size.</returns>
        public static string ToStyle(this TypeSizeText size)
        {
            return string.Empty;
        }
    }
}
