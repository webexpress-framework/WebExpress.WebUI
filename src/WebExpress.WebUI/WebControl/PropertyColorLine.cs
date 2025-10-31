namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a property color line that can be converted to CSS classes or styles.
    /// </summary>
    public class PropertyColorLine : PropertyColor<TypeColorLine>
    {
        /// <summary>
        /// Initializes a new instance of the class with a specified system color.
        /// </summary>
        /// <param name="color">The system color.</param>
        public PropertyColorLine(TypeColorLine color)
        {
            SystemColor = color;
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified user-defined color.
        /// </summary>
        /// <param name="color">The user-defined color.</param>
        public PropertyColorLine(string color)
        {
            SystemColor = (TypeColorLine)TypeColor.User;
            UserColor = color;
        }

        /// <summary>
        /// Converts the property color to a CSS class.
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
        /// Converts the property color to a CSS style.
        /// </summary>
        /// <returns>The CSS style corresponding to the progress color, or null if the color is not user-defined.</returns>
        public override string ToStyle()
        {
            if ((TypeColor)SystemColor == TypeColor.User)
            {
                return "color:" + UserColor + ";";
            }

            return null;
        }
    }
}
