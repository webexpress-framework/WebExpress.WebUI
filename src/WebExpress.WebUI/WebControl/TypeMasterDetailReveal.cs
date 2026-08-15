namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The gesture that opens the detail side of a master-detail view while it is
    /// hidden.
    /// </summary>
    public enum TypeMasterDetailReveal
    {
        /// <summary>
        /// Every selection opens the detail side. This is the default: the detail is
        /// the point of the view, so selecting an item shows it.
        /// </summary>
        Click,

        /// <summary>
        /// Only a double click opens a hidden detail side. A single click still moves
        /// the selection through the master, which keeps the list usable as a plain
        /// list until the user asks for the detail. Once the detail is open a single
        /// click swaps its content like it always does.
        /// </summary>
        DoubleClick
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeMasterDetailReveal"/> enumeration.
    /// </summary>
    public static class TypeMasterDetailRevealExtensions
    {
        /// <summary>
        /// Converts the reveal mode to its attribute value.
        /// </summary>
        /// <param name="type">The reveal mode to convert.</param>
        /// <returns>The attribute value, or null for the default mode.</returns>
        public static string ToValue(this TypeMasterDetailReveal type)
        {
            return type switch
            {
                TypeMasterDetailReveal.DoubleClick => "dblclick",
                _ => null
            };
        }
    }
}
