namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The predefined colors that can be applied to a navigation bar.
    /// </summary>
    public class PropertyColorNavbar : PropertyColor<TypeColorNavbar>
    {
        /// <summary>
        /// Initializes a new instance of the class with a specified system color.
        /// </summary>
        /// <param name="color">The system color.</param>
        public PropertyColorNavbar(TypeColorNavbar color)
        {
            SystemColor = color;
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified user color.
        /// </summary>
        /// <param name="color">The user-defined color.</param>
        public PropertyColorNavbar(string color)
        {
            SystemColor = (TypeColorNavbar)TypeColor.User;
            UserColor = color;
        }

        /// <summary>
        /// Converts the color property to a CSS class.
        /// </summary>
        /// <returns>The CSS class corresponding to the navbar color.</returns>
        public override string ToClass()
        {
            if ((TypeColor)SystemColor != TypeColor.Default && (TypeColor)SystemColor != TypeColor.User)
            {
                return ((TypeColorNavbar)SystemColor).ToClass();
            }

            return null;
        }

        /// <summary>
        /// Converts the color property to a CSS style.
        /// </summary>
        /// <returns>The CSS style corresponding to the navbar color.</returns>
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
