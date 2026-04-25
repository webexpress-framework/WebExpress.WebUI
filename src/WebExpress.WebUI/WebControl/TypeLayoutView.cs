namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The layout options for the view control element.
    /// </summary>
    public enum TypeLayoutView
    {
        /// <summary>
        /// The default layout. The active view's title and description are
        /// displayed and view switching is handled through a dropdown menu.
        /// </summary>
        Default,

        /// <summary>
        /// The toggle group layout. Title and description of the active view
        /// are omitted; views are switched through a compact toggle bar that
        /// shows the available views as labels or icons.
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
