
namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration representing different types of sidebar mode.
    /// </summary>
    public enum TypeSidebarMode
    {
        /// <summary>
        /// Default sidebar mode.
        /// </summary>
        Default,

        /// <summary>
        /// Hide sidebar mode.
        /// </summary>
        Hide
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeSidebarMode"/> enumeration.
    /// </summary>
    public static class TypeSidebarModeExtensions
    {
        /// <summary>
        /// Converts the TypeSidebarMode to a corresponding data value.
        /// </summary>
        /// <param name="layout">The TypeSidebarMode to be converted.</param>
        /// <returns>The data value corresponding to the TypeSidebarMode.</returns>
        public static string ToData(this TypeSidebarMode layout)
        {
            return layout switch
            {
                TypeSidebarMode.Hide => "hide",
                _ => string.Empty,
            };
        }
    }
}
