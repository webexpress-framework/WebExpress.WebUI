namespace WebExpress.WebUI.WebControl
{

    /// <summary>
    /// Specifies the order in which the main and side components are arranged.
    /// </summary>
    /// <remarks>This enumeration is used to define the sequence in which the 
    /// main and side components are arranged.</remarks>
    public enum TypeSplitOrder
    {
        /// <summary>
        /// Size unit in pixels.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Size unit in percent.
        /// </summary>
        SideMain = 1,

        /// <summary>
        /// Size unit in em.
        /// </summary>
        MainSide = 2,

    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeSplitOrder"/> enumeration.
    /// </summary>
    public static class TypeSplitOrderExtensions
    {
        /// <summary>
        /// Converts the TypeSplitOrder to a string representation.
        /// </summary>
        /// <param name="type">The TypeSplitOrder to convert.</param>
        /// <returns>A string representation of the TypeSplitOrder.</returns>
        public static string ToValue(this TypeSplitOrder type)
        {
            return type switch
            {
                TypeSplitOrder.SideMain => "side-main",
                TypeSplitOrder.MainSide => "main-side",
                _ => null
            };
        }
    }
}
