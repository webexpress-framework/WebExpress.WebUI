namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The state a service level agreement is in at a given moment.
    /// </summary>
    /// <remarks>
    /// The four states are deliberately exhaustive and mutually exclusive, so a
    /// dashboard can colour a whole wall of agreements without ever having to
    /// fall back on an "unknown" tile. Their precedence is decided by
    /// <see cref="SlaEvaluator"/>.
    /// </remarks>
    public enum TypeStatusSla
    {
        /// <summary>
        /// The agreement is being met - either it still has budget left or the
        /// cycle was settled manually. Shown in green.
        /// </summary>
        Fulfilled,

        /// <summary>
        /// The elapsed time has passed the warning threshold but the deadline
        /// has not been reached yet. Shown in yellow.
        /// </summary>
        AtRisk,

        /// <summary>
        /// The budget of the current cycle is used up. Shown in red.
        /// </summary>
        Violated,

        /// <summary>
        /// The clock is stopped, so neither the deadline nor the next cycle
        /// moves closer. Shown in grey.
        /// </summary>
        Paused
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeStatusSla"/> enumeration.
    /// </summary>
    public static class TypeStatusSlaExtensions
    {
        /// <summary>
        /// Converts the status to the CSS class that colours the widget.
        /// </summary>
        /// <param name="status">The status to be converted.</param>
        /// <returns>The CSS class corresponding to the status.</returns>
        public static string ToClass(this TypeStatusSla status)
        {
            return status switch
            {
                TypeStatusSla.AtRisk => "wx-sla-at-risk",
                TypeStatusSla.Violated => "wx-sla-violated",
                TypeStatusSla.Paused => "wx-sla-paused",
                _ => "wx-sla-fulfilled",
            };
        }

        /// <summary>
        /// Converts the status to the token the client reads from the host element.
        /// </summary>
        /// <param name="status">The status to be converted.</param>
        /// <returns>The data value corresponding to the status.</returns>
        public static string ToValue(this TypeStatusSla status)
        {
            return status switch
            {
                TypeStatusSla.AtRisk => "at-risk",
                TypeStatusSla.Violated => "violated",
                TypeStatusSla.Paused => "paused",
                _ => "fulfilled",
            };
        }
    }
}
