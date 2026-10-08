namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies how the agenda view groups the chronological item list.
    /// </summary>
    public enum TypeGroupingScheduleAgenda
    {
        /// <summary>
        /// No specific grouping is requested, which leaves the client on the daily grouping.
        /// </summary>
        Default,

        /// <summary>
        /// One heading per day.
        /// </summary>
        Day,

        /// <summary>
        /// One heading per week, carrying the week number.
        /// </summary>
        Week,

        /// <summary>
        /// One heading per month.
        /// </summary>
        Month
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeGroupingScheduleAgenda"/> enumeration.
    /// </summary>
    public static class TypeGroupingScheduleAgendaExtensions
    {
        /// <summary>
        /// Converts the grouping to the token the client reads.
        /// </summary>
        /// <param name="grouping">The grouping to be converted.</param>
        /// <returns>The data value corresponding to the grouping.</returns>
        public static string ToValue(this TypeGroupingScheduleAgenda grouping)
        {
            return grouping switch
            {
                TypeGroupingScheduleAgenda.Day => "day",
                TypeGroupingScheduleAgenda.Week => "week",
                TypeGroupingScheduleAgenda.Month => "month",
                _ => string.Empty,
            };
        }
    }
}
