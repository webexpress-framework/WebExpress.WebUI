
namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration representing different types of color tag.
    /// </summary>
    public enum TypeColorTag
    {
        /// <summary>
        /// Default tag color.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Primary tag color.
        /// </summary>
        Primary = 1,

        /// <summary>
        /// Secondary tag color.
        /// </summary>
        Secondary = 2,

        /// <summary>
        /// Success tag color.
        /// </summary>
        Success = 3,

        /// <summary>
        /// Info tag color.
        /// </summary>
        Info = 4,

        /// <summary>
        /// Warning tag color.
        /// </summary>
        Warning = 5,

        /// <summary>
        /// Danger tag color.
        /// </summary>
        Danger = 6,

        /// <summary>
        /// Dark tag color.
        /// </summary>
        Dark = 7,

        /// <summary>
        /// Light tag color.
        /// </summary>
        Light = 8,

        /// <summary>
        /// Highlight tag color.
        /// </summary>
        Highlight = 13
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeColorTag"/> enumeration.
    /// </summary>
    public static class TypeColorTagExtensions
    {
        /// <summary>
        /// Converts the TypeColorTag to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The TypeColorTag to be converted.</param>
        /// <returns>The CSS class corresponding to the TypeColorTag.</returns>
        public static string ToClass(this TypeColorTag layout)
        {
            return layout switch
            {
                TypeColorTag.Primary => "wx-tag-primary",
                TypeColorTag.Secondary => "wx-tag-secondary",
                TypeColorTag.Success => "wx-tag-success",
                TypeColorTag.Info => "wx-tag-info",
                TypeColorTag.Warning => "wx-tag-warning",
                TypeColorTag.Danger => "wx-tag-danger",
                TypeColorTag.Light => "wx-tag-light",
                TypeColorTag.Dark => "wx-tag-dark",
                TypeColorTag.Highlight => "wx-tag-highlight",
                _ => string.Empty,
            };
        }
    }
}
