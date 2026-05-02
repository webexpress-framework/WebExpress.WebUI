
namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration representing different types of color date.
    /// </summary>
    public enum TypeColorDate
    {
        /// <summary>
        /// Default color callout.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Primary color callout.
        /// </summary>
        Primary = 1,

        /// <summary>
        /// Secondary color callout.
        /// </summary>
        Secondary = 2,

        /// <summary>
        /// Success color callout.
        /// </summary>
        Success = 3,

        /// <summary>
        /// Info color callout.
        /// </summary>
        Info = 4,

        /// <summary>
        /// Warning color callout.
        /// </summary>
        Warning = 5,

        /// <summary>
        /// Danger color callout.
        /// </summary>
        Danger = 6,

        /// <summary>
        /// Dark color callout.
        /// </summary>
        Dark = 7,

        /// <summary>
        /// Light color callout.
        /// </summary>
        Light = 8,

        /// <summary>
        /// Highlight color.
        /// </summary>
        Highlight = 13
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeColorDate"/> enumeration.
    /// </summary>
    public static class TypeColorDateExtensions
    {
        /// <summary>
        /// Converts the TypeColorTag to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The TypeColorTag to be converted.</param>
        /// <returns>The CSS class corresponding to the TypeColorTag.</returns>
        public static string ToClass(this TypeColorDate layout)
        {
            return layout switch
            {
                TypeColorDate.Primary => "bg-primary",
                TypeColorDate.Secondary => "bg-secondary",
                TypeColorDate.Success => "bg-success",
                TypeColorDate.Info => "bg-info",
                TypeColorDate.Warning => "bg-warning",
                TypeColorDate.Danger => "bg-danger",
                TypeColorDate.Light => "bg-light",
                TypeColorDate.Dark => "bg-dark",
                TypeColorDate.Highlight => "bg-highlight",
                _ => string.Empty,
            };
        }
    }
}
