namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a property for background color alerts.
    /// </summary>
    public class PropertyColorBackgroundAlert : PropertyColor<TypeColorBackgroundAlert>
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="color">The background color.</param>
        public PropertyColorBackgroundAlert(TypeColorBackgroundAlert color)
        {
            SystemColor = color;
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="color">The background color.</param>
        public PropertyColorBackgroundAlert(string color)
        {
            SystemColor = (TypeColorBackgroundAlert)TypeColor.User;
            UserColor = color;
        }

        /// <summary>
        /// Converts the background color to a CSS class.
        /// </summary>
        /// <returns>The CSS class corresponding to the background color.</returns>
        public override string ToClass()
        {
            if ((TypeColor)SystemColor != TypeColor.Default && (TypeColor)SystemColor != TypeColor.User)
            {
                return ((TypeColorBackgroundAlert)SystemColor).ToClass();
            }

            return null;
        }

        /// <summary>
        /// Converts the background color to a CSS style.
        /// </summary>
        /// <returns>The CSS style corresponding to the background color.</returns>
        public override string ToStyle()
        {
            if ((TypeColor)SystemColor == TypeColor.User)
            {
                return $"background-color: {UserColor};";
            }

            return null;
        }
    }
}
