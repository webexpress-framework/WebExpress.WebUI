namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A color value used to set the background color of a control, with the predefined colors available for it.
    /// </summary>
    public class PropertyColorBackground : PropertyColor<TypeColorBackground>
    {
        /// <summary>
        /// Initializes a new instance of the class with the default color.
        /// </summary>
        public PropertyColorBackground()
        {
            SystemColor = (TypeColorBackground)TypeColor.Default;
        }

        /// <summary>
        /// Initializes a new instance of the class with the specified system color.
        /// </summary>
        /// <param name="color">The system color.</param>
        public PropertyColorBackground(TypeColorBackground color)
        {
            SystemColor = color;
        }

        /// <summary>
        /// Initializes a new instance of the class with the specified user color.
        /// </summary>
        /// <param name="color">The user-defined color.</param>
        public PropertyColorBackground(string color)
        {
            SystemColor = (TypeColorBackground)TypeColor.User;
            UserColor = color;
        }

        /// <summary>
        /// Converts the background color property to a CSS class.
        /// </summary>
        /// <returns>The CSS class corresponding to the background color.</returns>
        public override string ToClass()
        {
            if ((TypeColor)SystemColor != TypeColor.Default && (TypeColor)SystemColor != TypeColor.User)
            {
                return SystemColor.ToClass();
            }

            return null;
        }

        /// <summary>
        /// Converts the background color property to a CSS style.
        /// </summary>
        /// <returns>The CSS style corresponding to the background color.</returns>
        public override string ToStyle()
        {
            if ((TypeColor)SystemColor == TypeColor.User)
            {
                return "background:" + UserColor + ";";
            }

            return null;
        }
    }
}
