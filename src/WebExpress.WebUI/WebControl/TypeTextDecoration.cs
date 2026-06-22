namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The decoration applied to text (for example underline or line-through).
    /// </summary>
    public enum TypeTextDecoration
    {
        /// <summary>
        /// The default text decoration.
        /// </summary>
        Default,

        /// <summary>
        /// No text decoration.
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
