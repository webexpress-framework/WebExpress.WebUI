namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a property color date which is a specific type of PropertyColor.
    /// </summary>
    /// <remarks>
    /// This class provides functionality to convert the color to a CSS class or style.
    /// </remarks>
    public class PropertyColorDate : PropertyColor<TypeColorDate>
    {
        /// <summary>
        /// Initializes a new instance of the class with a specified system color.
        /// </summary>
        /// <param name="color">The system color.</param>
        public PropertyColorDate(TypeColorDate color)
        {
            SystemColor = color;
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified user color.
        /// </summary>
        /// <param name="color">The user-defined color.</param>
        public PropertyColorDate(string color)
        {
            SystemColor = (TypeColorDate)TypeColor.User;
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
