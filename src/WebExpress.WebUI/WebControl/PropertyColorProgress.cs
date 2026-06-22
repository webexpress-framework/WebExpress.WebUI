namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The predefined colors used for progress indicators.
    /// </summary>
    public class PropertyColorProgress : PropertyColor<TypeColorProgress>
    {
        /// <summary>
        /// Initializes a new instance of the class with the specified color.
        /// </summary>
        /// <param name="color">The color to be used for the progress element.</param>
        public PropertyColorProgress(TypeColorProgress color)
        {
            SystemColor = color;
        }

        /// <summary>
        /// Initializes a new instance of the class with the specified color.
        /// </summary>
        /// <param name="color">The color to be used for the progress element.</param>
        public PropertyColorProgress(string color)
        {
            SystemColor = (TypeColorProgress)TypeColor.User;
            UserColor = color;
        }

        /// <summary>
        /// Conversion to a CSS class.
        /// </summary>
        /// <returns>The CSS class corresponding to the badge color.</returns>
        public override string ToClass()
        {
            if ((TypeColor)SystemColor != TypeColor.Default && (TypeColor)SystemColor != TypeColor.User)
            {
                return ((TypeColorProgress)SystemColor).ToClass();
            }

            return null;
        }

        /// <summary>
        /// Conversion to a CSS style.
        /// </summary>
        /// <returns>The CSS style corresponding to the progress color.</returns>
        public override string ToStyle()
        {
            {
                if ((TypeColor)SystemColor == TypeColor.User)
                {
                    return "background:" + UserColor + ";";
                }

                return null;
            }
        }
    }
}
