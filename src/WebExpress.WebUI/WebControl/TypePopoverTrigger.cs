namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The user interaction that reveals a popover.
    /// </summary>
    public enum TypePopoverTrigger
    {
        /// <summary>
        /// Toggled on click.
        /// </summary>
        Click,

        /// <summary>
        /// Shown while hovering (and focusing, for keyboard users).
        /// </summary>
        Hover,

        /// <summary>
        /// Shown while the trigger has focus.
        /// </summary>
        Focus
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypePopoverTrigger"/> enum.
    /// </summary>
    public static class TypePopoverTriggerExtensions
    {
        /// <summary>
        /// Converts the trigger to the value of the data-bs-trigger attribute.
        /// </summary>
        /// <param name="trigger">The trigger.</param>
        /// <returns>The data attribute value corresponding to the trigger.</returns>
        public static string ToValue(this TypePopoverTrigger trigger)
        {
            return trigger switch
            {
                // pairing hover with focus keeps the popover reachable for keyboard users
                TypePopoverTrigger.Hover => "hover focus",
                TypePopoverTrigger.Focus => "focus",
                _ => "click",
            };
        }
    }
}
