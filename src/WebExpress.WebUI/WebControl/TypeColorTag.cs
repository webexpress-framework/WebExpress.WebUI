
namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration representing different types of color tag.
    /// </summary>
    public enum TypeColorTag
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
        Light = 8
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
                _ => string.Empty,
            };
        }
    }
}
