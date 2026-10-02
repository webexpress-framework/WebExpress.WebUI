namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Determines whether the button of a dropdown carries the <c>dropdown-toggle</c> class, which
    /// marks it with a caret. It does not change how the dropdown opens: that is always a click on
    /// the button, whatever the value.
    /// </summary>
    public enum TypeToggleDropdown
    {
        /// <summary>
        /// The button is rendered without the <c>dropdown-toggle</c> class and therefore without a caret.
        /// </summary>
        None,

        /// <summary>
        /// The button is rendered with the <c>dropdown-toggle</c> class and shows a caret.
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
