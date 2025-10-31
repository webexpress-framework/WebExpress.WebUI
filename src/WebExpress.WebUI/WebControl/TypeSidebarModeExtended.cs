
namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration representing different types of sidebar mode.
    /// </summary>
    public enum TypeSidebarModeExtended
    {
        /// <summary>
        /// Default sidebar mode.
        /// </summary>
        Default,

        /// <summary>
        /// Hide sidebar mode.
        /// </summary>
        Hide,

        /// <summary>
        /// Overlay sidebar mode.
        /// </summary>
        Overlay
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeSidebarMode"/> enumeration.
    /// </summary>
    public static class TypeSidebarModeExtendedExtensions
    {
        /// <summary>
        /// Converts the TypeSidebarMode to a corresponding data value.
        /// </summary>
        /// <param name="layout">The TypeSidebarModeExtended to be converted.</param>
        /// <returns>The data value corresponding to the TypeSidebarModeExtended.</returns>
        public static string ToData(this TypeSidebarModeExtended layout)
        {
            return layout switch
            {
                TypeSidebarModeExtended.Hide => "hide",
                TypeSidebarModeExtended.Overlay => "overlay",
                _ => string.Empty,
            };
        }
    }
}
