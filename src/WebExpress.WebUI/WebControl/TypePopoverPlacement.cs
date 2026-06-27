namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The side on which a popover is shown relative to its trigger.
    /// </summary>
    public enum TypePopoverPlacement
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
    /// Provides extension methods for the <see cref="TypePopoverPlacement"/> enum.
    /// </summary>
    public static class TypePopoverPlacementExtensions
    {
        /// <summary>
        /// Converts the placement to the value of the data-bs-placement attribute.
        /// </summary>
        /// <param name="placement">The placement.</param>
        /// <returns>The data attribute value corresponding to the placement.</returns>
        public static string ToValue(this TypePopoverPlacement placement)
        {
            return placement switch
            {
                TypePopoverPlacement.Right => "right",
                TypePopoverPlacement.Bottom => "bottom",
                TypePopoverPlacement.Left => "left",
                _ => "top",
            };
        }
    }
}
