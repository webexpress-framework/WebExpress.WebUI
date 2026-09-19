namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a property for background color specifically for badges.
    /// </summary>
    /// <remarks>
    /// This class extends the <see cref="PropertyColorBackground"/> class to provide 
    /// additional functionality for handling badge-specific background colors.
    /// </remarks>
    public class PropertyColorBackgroundBadge : PropertyColor<TypeColorBackgroundBadge>
    {
        /// <summary>
        /// Initializes a new instance of the class with a specified badge color.
        /// </summary>
        /// <param name="color">The badge color.</param>
        public PropertyColorBackgroundBadge(TypeColorBackgroundBadge color)
        {
            SystemColor = color;
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified badge color.
        /// </summary>
        /// <param name="color">The badge color.</param>
        public PropertyColorBackgroundBadge(string color)
        {
            SystemColor = (TypeColorBackgroundBadge)TypeColor.User;
            UserColor = color;
        }

        /// <summary>
        /// Converts the color to a CSS class with an option to outline.
        /// </summary>
        /// <returns>The CSS class corresponding to the button color.</returns>
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
        /// <returns>The CSS style corresponding to the button color.</returns>
        public override string ToStyle()
        {
            if ((TypeColor)SystemColor == TypeColor.User)
            {
                // the text on a fill the author chose takes whichever of black and white reads on it
                var contrast = ContrastColor.On(UserColor);

                return "background:" + UserColor + ";" + (contrast is not null ? "color:" + contrast + ";" : string.Empty);
            }

            return null;
        }

        /// <summary>
        /// Converts the color to a CSS style with an option to outline.
        /// </summary>
        /// <param name="outline">Determines whether the background color is removed.</param>
        /// <returns>The CSS style corresponding to the button color.</returns>
        public virtual string ToStyle(bool outline)
        {
            if ((TypeColor)SystemColor == TypeColor.User)
            {
                if (outline)
                {
                    return "border-color:" + UserColor + ";";
                }

                var contrast = ContrastColor.On(UserColor);

                return "background:" + UserColor + ";border-color:" + UserColor + ";" + (contrast is not null ? "color:" + contrast + ";" : string.Empty);
            }

            return null;
        }
    }
}
