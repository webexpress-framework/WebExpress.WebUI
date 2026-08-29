namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The layout options for the view control element.
    /// </summary>
    /// <remarks>
    /// The layout decides how the views are offered: named one at a time with a
    /// dropdown to switch, or all at once on the shared presentation switch that
    /// every surface with several views of one subject offers.
    /// </remarks>
    public enum TypeLayoutView
    {
        /// <summary>
        /// The default layout. The title and description of the active view are
        /// shown, and the views are switched through a dropdown beside them.
        /// </summary>
        Default,

        /// <summary>
        /// The toggle group layout. Title and description of the active view are
        /// omitted, so the shared presentation switch stands alone.
        /// </summary>
        ToggleGroup
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeLayoutView"/> enum.
    /// </summary>
    public static class TypeLayoutViewExtensions
    {
        /// <summary>
        /// Converts the layout to its data attribute representation.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The data attribute value corresponding to the layout.</returns>
        public static string ToValue(this TypeLayoutView layout)
        {
            return layout switch
            {
                TypeLayoutView.ToggleGroup => "togglegroup",
                _ => "default",
            };
        }
    }
}
