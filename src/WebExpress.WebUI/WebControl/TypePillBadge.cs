namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the type of a pill badge.
    /// </summary>
    public enum TypePillBadge
    {
        /// <summary>
        /// No badge.
        /// </summary>
        None,

        /// <summary>
        /// Pill badge.
        /// </summary>
        Pill
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypePillBadge"/> enum.
    /// </summary>
    public static class TypePillBadgeExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypePillBadge"/> to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypePillBadge layout)
        {
            return layout switch
            {
                TypePillBadge.Pill => "rounded-pill",
                _ => string.Empty,
            };
        }
    }
}
