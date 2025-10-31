namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a property color tag which is a specific type of PropertyColor.
    /// </summary>
    /// <remarks>
    /// This class provides functionality to convert the color to a CSS class or style.
    /// </remarks>
    public class PropertyColorTag : PropertyColor<TypeColorTag>
    {
        /// <summary>
        /// Initializes a new instance of the class with a specified system color.
        /// </summary>
        /// <param name="color">The system color.</param>
        public PropertyColorTag(TypeColorTag color)
        {
            SystemColor = color;
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified user color.
        /// </summary>
        /// <param name="color">The user-defined color.</param>
        public PropertyColorTag(string color)
        {
            SystemColor = (TypeColorTag)TypeColor.User;
            UserColor = color;
        }

        /// <summary>
        /// Converts the color to a CSS class.
        /// </summary>
        /// <returns>The CSS class corresponding to the badge color, or null if the color is default or user-defined.</returns>
        public override string ToClass()
        {
            if ((TypeColor)SystemColor != TypeColor.Default && (TypeColor)SystemColor != TypeColor.User)
            {
                return SystemColor.ToClass();
            }

            return null;
        }

        /// <summary>
        /// Converts the color to a CSS style.
        /// </summary>
        /// <returns>The CSS style corresponding to the progress color, or null if the color is not user-defined.</returns>
        public override string ToStyle()
        {
            if ((TypeColor)SystemColor == TypeColor.User && !string.IsNullOrWhiteSpace(UserColor))
            {
                return $"background: {UserColor};";
            }

            return null;
        }
    }
}
