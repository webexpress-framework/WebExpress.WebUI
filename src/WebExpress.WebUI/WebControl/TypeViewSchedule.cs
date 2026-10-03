namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the view a schedule renders its items in.
    /// </summary>
    public enum TypeViewSchedule
    {
        /// <summary>
        /// No specific view is requested, which leaves the client on the month grid.
        /// </summary>
        Default,

        /// <summary>
        /// A chronological list of the items, grouped by day, week or month.
        /// </summary>
        Agenda,

        /// <summary>
        /// A seven day grid with an optional time axis.
        /// </summary>
        Week,

        /// <summary>
        /// A classic calendar grid of the whole month.
        /// </summary>
        Month
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeViewSchedule"/> enumeration.
    /// </summary>
    public static class TypeViewScheduleExtensions
    {
        /// <summary>
        /// Converts the view to the token the client reads.
        /// </summary>
        /// <param name="view">The view to be converted.</param>
        /// <returns>The data value corresponding to the view.</returns>
        public static string ToValue(this TypeViewSchedule view)
        {
            return view switch
            {
                TypeViewSchedule.Agenda => "agenda",
                TypeViewSchedule.Week => "week",
                TypeViewSchedule.Month => "month",
                _ => string.Empty,
            };
        }
    }
}
