namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the overflow behavior of a toolbar item within a user interface.
    /// </summary>
    public enum TypeToolbarItemOverflow
    {
        /// <summary>
        /// Represents the default instance or value for the associated type or context.
        /// </summary>
        Default,

        /// <summary>
        /// Never in overflow.
        /// </summary>
        Never,

        /// <summary>
        /// Always in overflow.
        /// </summary>
        Force,

        /// <summary>
        /// Hides the current element in overflow.
        /// </summary>
        Hide
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeToolbarItemOverflow"/> enum.
    /// </summary>
    public static class TypeToolbarItemOverflowExtensions
    {
        /// <summary>
        /// Converts the specified value to its corresponding string
        /// representation.
        /// </summary>
        /// <param name="alignment">The value to convert.</param>
        /// <returns>A string that represents the alignment.</returns>
        public static string ToValue(this TypeToolbarItemOverflow alignment)
        {
            return alignment switch
            {
                TypeToolbarItemOverflow.Never => "never",
                TypeToolbarItemOverflow.Force => "force",
                TypeToolbarItemOverflow.Hide => "hide",
                _ => string.Empty,
            };
        }
    }
}
