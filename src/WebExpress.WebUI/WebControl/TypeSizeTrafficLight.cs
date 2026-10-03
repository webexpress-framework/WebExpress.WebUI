namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The size of a traffic light. <see cref="Default"/> is intentionally compact so the control
    /// fits inline next to text or in a table cell; the larger steps are for prominent status
    /// displays such as a dashboard tile.
    /// </summary>
    public enum TypeSizeTrafficLight
    {
        /// <summary>
        /// The default, compact size.
        /// </summary>
        Default,

        /// <summary>
        /// Extra small size.
        /// </summary>
        ExtraSmall,

        /// <summary>
        /// Small size.
        /// </summary>
        Small,

        /// <summary>
        /// Large size.
        /// </summary>
        Large,

        /// <summary>
        /// Extra large size.
        /// </summary>
        ExtraLarge
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeSizeTrafficLight"/> enum.
    /// </summary>
    public static class TypeSizeTrafficLightExtensions
    {
        /// <summary>
        /// Converts the size to the lowercase token the client runtime reads from the
        /// <c>data-size</c> attribute, for example in the table template.
        /// </summary>
        /// <param name="size">The size.</param>
        /// <returns>The data attribute token, or an empty string for the default.</returns>
        public static string ToValue(this TypeSizeTrafficLight size)
        {
            return size switch
            {
                TypeSizeTrafficLight.ExtraSmall => "xs",
                TypeSizeTrafficLight.Small => "sm",
                TypeSizeTrafficLight.Large => "lg",
                TypeSizeTrafficLight.ExtraLarge => "xl",
                _ => string.Empty,
            };
        }

        /// <summary>
        /// Converts the size to its CSS modifier class. The class only scales the lamp metrics
        /// through a custom property, so the default size emits no class at all.
        /// </summary>
        /// <param name="size">The size.</param>
        /// <returns>The CSS class, or an empty string for the default.</returns>
        public static string ToClass(this TypeSizeTrafficLight size)
        {
            var token = size.ToValue();

            return string.IsNullOrEmpty(token) ? string.Empty : "wx-traffic-light-" + token;
        }
    }
}
