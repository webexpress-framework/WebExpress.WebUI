namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Whether the decoration a text would get from its element is kept or suppressed, for example
    /// to remove the underline of a link. Adding a decoration is not supported.
    /// </summary>
    public enum TypeTextDecoration
    {
        /// <summary>
        /// The text keeps the decoration of its element.
        /// </summary>
        Default,

        /// <summary>
        /// For text whose element brings a decoration that would be noise there, such as a link
        /// inside a card that is already recognizable as clickable.
        /// </summary>
        None
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeTextDecoration"/> enum.
    /// </summary>
    public static class TypeTextDecorationExtensions
    {
        /// <summary>
        /// Converts the text decoration type to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The text decoration type to be converted.</param>
        /// <returns>The CSS class corresponding to the text decoration type.</returns>
        public static string ToClass(this TypeTextDecoration layout)
        {
            return layout switch
            {
                TypeTextDecoration.None => "text-decoration-none",
                _ => string.Empty,
            };
        }
    }
}
