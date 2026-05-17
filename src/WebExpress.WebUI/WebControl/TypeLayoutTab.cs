namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The layout options for the tab control element.
    /// </summary>
    public enum TypeLayoutTab
    {
        /// <summary>
        /// The default layout.
        /// </summary>
        Default,

        /// <summary>
        /// The menu layout.
        /// </summary>
        Menu,

        /// <summary>
        /// The tab layout.
        /// </summary>
        Tab,

        /// <summary>
        /// The pill layout.
        /// </summary>
        Pill,

        /// <summary>
        /// The underline layout.
        /// </summary>
        Underline
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeLayoutTab"/> enum.
    /// </summary>
    public static class TypeLayoutTabExtensions
    {
        /// <summary>
        /// Converts the layout to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeLayoutTab layout)
        {
            return layout switch
            {
                TypeLayoutTab.Tab => "nav-tabs",
                TypeLayoutTab.Pill => "nav-pills",
                TypeLayoutTab.Underline => "nav-underline",
                _ => string.Empty,
            };
        }
    }
}
