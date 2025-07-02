namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the layout options for a checkbox control.
    /// </summary>
    public enum TypeLayoutCheckbox
    {
        Default,
        Switch
    }

    /// <summary>
    /// Provides extension methods for converting <see cref="TypeLayoutCheckbox"/> values 
    /// to their corresponding CSS class representations.
    /// </summary>
    public static class TypeLayoutCheckboxExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeLayoutCheckbox"/> to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeLayoutCheckbox layout)
        {
            return layout switch
            {
                TypeLayoutCheckbox.Switch => "form-check form-switch",
                _ => "form-check"
            };
        }
    }
}
