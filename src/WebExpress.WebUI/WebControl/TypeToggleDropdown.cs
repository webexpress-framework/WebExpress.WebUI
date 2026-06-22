namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// How a dropdown is opened (for example on click or on hover).
    /// </summary>
    public enum TypeToggleDropdown
    {
        /// <summary>
        /// No toggle dropdown.
        /// </summary>
        None,

        /// <summary>
        /// Toggle dropdown.
        /// </summary>
        Toggle
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeToggleDropdown"/> enum.
    /// </summary>
    public static class TypeToggleDropdownExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeToggleDropdown"/> value to a CSS class.
        /// </summary>
        /// <param name="layout">The <see cref="TypeToggleDropdown"/> value to be converted.</param>
        /// <returns>The CSS class corresponding to the <see cref="TypeToggleDropdown"/> value.</returns>
        public static string ToClass(this TypeToggleDropdown layout)
        {
            return layout switch
            {
                TypeToggleDropdown.Toggle => "dropdown-toggle",
                _ => string.Empty,
            };
        }
    }
}
