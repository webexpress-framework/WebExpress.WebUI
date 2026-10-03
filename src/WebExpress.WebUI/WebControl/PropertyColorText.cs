namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A color value used to set the text (foreground) color of a control, with the predefined colors available for it.
    /// </summary>
    public class PropertyColorText : PropertyColor<TypeColorText>
    {
        /// <summary>
        /// Initializes a new instance of the class with the default color.
        /// </summary>
        public PropertyColorText()
        {
            SystemColor = (TypeColorText)TypeColor.Default;
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified system color.
        /// </summary>
        /// <param name="color">The system color.</param>
        public PropertyColorText(TypeColorText color)
        {
            SystemColor = color;
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified user-defined color.
        /// </summary>
        /// <param name="color">The user-defined color.</param>
        public PropertyColorText(string color)
        {
            SystemColor = (TypeColorText)TypeColor.User;
            UserColor = color;
        }

        /// <summary>
        /// Converts the color to a CSS class.
        /// </summary>
        /// <returns>The CSS class corresponding to the color.</returns>
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
        /// <returns>The CSS style corresponding to the color.</returns>
        public override string ToStyle()
        {
            if ((TypeColor)SystemColor == TypeColor.User)
            {
                if (string.IsNullOrWhiteSpace(UserColor))
                {
                    return null;
                }

                return "color:" + UserColor + ";";
            }

            return null;
        }
    }
}
