namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Whether a <see cref="ControlTrafficLight"/> stacks its lamps vertically (like a real
    /// traffic light) or lines them up horizontally to save vertical space, for example inside a
    /// table cell or a status bar.
    /// </summary>
    public enum TypeOrientationTrafficLight
    {
        /// <summary>
        /// Lamps are stacked top to bottom. This is the default and matches a physical signal.
        /// </summary>
        Vertical,

        /// <summary>
        /// Lamps are arranged left to right.
        /// </summary>
        Horizontal
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeOrientationTrafficLight"/> enum.
    /// </summary>
    public static class TypeOrientationTrafficLightExtensions
    {
        /// <summary>
        /// Converts the orientation to the lowercase token the client runtime reads from the
        /// <c>data-orientation</c> attribute.
        /// </summary>
        /// <param name="orientation">The orientation.</param>
        /// <returns>The data attribute token corresponding to the orientation.</returns>
        public static string ToValue(this TypeOrientationTrafficLight orientation)
        {
            return orientation switch
            {
                TypeOrientationTrafficLight.Horizontal => "horizontal",
                _ => "vertical",
            };
        }
    }
}
