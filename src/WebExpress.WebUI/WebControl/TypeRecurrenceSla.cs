namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The interval after which a periodic service level agreement starts over
    /// with a fresh time budget.
    /// </summary>
    public enum TypeRecurrenceSla
    {
        /// <summary>
        /// The agreement runs once and never resets.
        /// </summary>
        None,

        /// <summary>
        /// The agreement resets every 24 hours.
        /// </summary>
        Daily,

        /// <summary>
        /// The agreement resets every seven days.
        /// </summary>
        Weekly,

        /// <summary>
        /// The agreement resets on the calendar month, so its cycles inherit the
        /// unequal length of the months they fall into.
        /// </summary>
        Monthly
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeRecurrenceSla"/> enumeration.
    /// </summary>
    public static class TypeRecurrenceSlaExtensions
    {
        /// <summary>
        /// Converts the interval to the token the client reads from the host element.
        /// </summary>
        /// <param name="recurrence">The interval to be converted.</param>
        /// <returns>The data value corresponding to the interval.</returns>
        public static string ToValue(this TypeRecurrenceSla recurrence)
        {
            return recurrence switch
            {
                TypeRecurrenceSla.Daily => "daily",
                TypeRecurrenceSla.Weekly => "weekly",
                TypeRecurrenceSla.Monthly => "monthly",
                _ => string.Empty,
            };
        }
    }
}
