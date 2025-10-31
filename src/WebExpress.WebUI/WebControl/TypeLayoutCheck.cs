namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the layout options for a checkbox control.
    /// </summary>
    public enum TypeLayoutCheck
    {
        Default,
        Switch
    }

    /// <summary>
    /// Provides extension methods for converting <see cref="TypeLayoutCheck"/> values 
    /// to their corresponding CSS class representations.
    /// </summary>
    public static class TypeLayoutCheckboxExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeLayoutCheck"/> to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeLayoutCheck layout)
        {
            return layout switch
            {
                TypeLayoutCheck.Switch => "form-check form-switch",
                _ => "form-check"
            };
        }
    }
}
