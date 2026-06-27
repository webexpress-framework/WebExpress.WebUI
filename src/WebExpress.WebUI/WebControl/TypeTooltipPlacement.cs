namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The side on which a tooltip is shown relative to its trigger.
    /// </summary>
    public enum TypeTooltipPlacement
    {
        /// <summary>
        /// Above the trigger.
        /// </summary>
        Top,

        /// <summary>
        /// To the right of the trigger.
        /// </summary>
        Right,

        /// <summary>
        /// Below the trigger.
        /// </summary>
        Bottom,

        /// <summary>
        /// To the left of the trigger.
        /// </summary>
        Left
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeTooltipPlacement"/> enum.
    /// </summary>
    public static class TypeTooltipPlacementExtensions
    {
        /// <summary>
        /// Converts the placement to the value of the data-bs-placement attribute.
        /// </summary>
        /// <param name="placement">The placement.</param>
        /// <returns>The data attribute value corresponding to the placement.</returns>
        public static string ToValue(this TypeTooltipPlacement placement)
        {
            return placement switch
            {
                TypeTooltipPlacement.Right => "right",
                TypeTooltipPlacement.Bottom => "bottom",
                TypeTooltipPlacement.Left => "left",
                _ => "top",
            };
        }
    }
}
