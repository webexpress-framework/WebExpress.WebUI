namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a property for background color for the graph control.
    /// </summary>
    public class PropertyColorBackgroundGraph : PropertyColor<TypeColorBackgroundGraph>
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="color">The background color.</param>
        public PropertyColorBackgroundGraph(TypeColorBackgroundGraph color)
        {
            SystemColor = color;
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="color">The background color.</param>
        public PropertyColorBackgroundGraph(string color)
        {
            SystemColor = (TypeColorBackgroundGraph)TypeColor.User;
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
                return ((TypeColorBackgroundGraph)SystemColor).ToClass();
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
                return UserColor;
            }

            return null;
        }
    }
}
