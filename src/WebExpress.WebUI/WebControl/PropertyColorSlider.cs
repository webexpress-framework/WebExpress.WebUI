namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the color property of the dual-handle slider control.
    /// The chosen color is applied uniformly to the lower handle, the upper
    /// handle and the connecting band (no separate band color is exposed,
    /// keeping the control visually consistent).
    /// </summary>
    public class PropertyColorSlider : PropertyColor<TypeColorSlider>
    {
        /// <summary>
        /// Initializes a new instance with a predefined system color.
        /// </summary>
        /// <param name="color">The system color.</param>
        public PropertyColorSlider(TypeColorSlider color)
        {
            SystemColor = color;
        }

        /// <summary>
        /// Initializes a new instance with a user-defined CSS color expression
        /// (any value valid for a CSS background, e.g. a hex code or a
        /// <c>linear-gradient(...)</c>).
        /// </summary>
        /// <param name="color">The user-defined color.</param>
        public PropertyColorSlider(string color)
        {
            SystemColor = (TypeColorSlider)TypeColor.User;
            UserColor = color;
        }

        /// <summary>
        /// Converts the color to a CSS marker class. The CSS file uses these
        /// markers to override the slider's color custom properties.
        /// </summary>
        /// <returns>The CSS class corresponding to the slider color.</returns>
        public override string ToClass()
        {
            if ((TypeColor)SystemColor != TypeColor.Default && (TypeColor)SystemColor != TypeColor.User)
            {
                return SystemColor.ToClass();
            }

            return null;
        }

        /// <summary>
        /// Converts the color to a CSS style. For user-defined colors the
        /// style overrides the slider's CSS custom properties so the band and
        /// the handle border pick up the supplied color without any extra
        /// JavaScript.
        /// </summary>
        /// <returns>The CSS style corresponding to the slider color.</returns>
        public override string ToStyle()
        {
            if ((TypeColor)SystemColor == TypeColor.User)
            {
                return "--wx-slider-band-bg:" + UserColor + ";--wx-slider-handle-bd:" + UserColor + ";";
            }

            return null;
        }
    }
}
