namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The size units.
    /// </summary>
    public enum TypeSizeUnit
    {
        /// <summary>
        /// Represents the default value.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Size unit in pixels.
        /// </summary>
        Pixel = 1,

        /// <summary>
        /// Size unit in percent.
        /// </summary>
        Percent = 2,

        /// <summary>
        /// Size unit in em.
        /// </summary>
        Em = 3,

        /// <summary>
        /// Size unit in rem.
        /// </summary>
        Rem = 4
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeSizeUnit"/> enumeration.
    /// </summary>
    public static class TypeSizeUnitExtensions
    {
        /// <summary>
        /// Converts the TypeSizeUnit to a string representation.
        /// </summary>
        /// <param name="type">The TypeSizeUnit to convert.</param>
        /// <returns>A string representation of the TypeSizeUnit.</returns>
        public static string ToValue(this TypeSizeUnit type)
        {
            return type switch
            {
                TypeSizeUnit.Pixel => "px",
                TypeSizeUnit.Percent => "%",
                TypeSizeUnit.Em => "em",
                TypeSizeUnit.Rem => "rem",
                _ => null
            };
        }
    }
}
