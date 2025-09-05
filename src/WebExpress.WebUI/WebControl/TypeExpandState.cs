namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the expansion state of a tree node.
    /// </summary>
    public enum TypeExpandState
    {
        /// <summary>
        /// No expansion state.
        /// </summary>
        None,

        /// <summary>
        /// The tree node is visible.
        /// </summary>
        Visible,

        /// <summary>
        /// The tree node is collapsed.
        /// </summary>
        Collapsed
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeExpandState"/> enumeration.
    /// </summary>
    public static class TypeExpandStateExtensions
    {
        /// <summary>
        /// Converts the expansion state to a CSS class.
        /// </summary>
        /// <param name="expand">The expansion state.</param>
        /// <returns>The CSS class corresponding to the expansion state.</returns>
        public static string ToClass(this TypeExpandState expand)
        {
            return expand switch
            {
                TypeExpandState.Collapsed => "tree-node-hide",
                _ => string.Empty,
            };
        }
    }
}
