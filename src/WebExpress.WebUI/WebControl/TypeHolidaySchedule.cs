namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the kind of a holiday, which decides how prominently the
    /// schedule marks the day.
    /// </summary>
    /// <remarks>
    /// The kinds are deliberately the ones that differ in consequence rather
    /// than in origin: a public holiday closes the day, an observance only
    /// names it. A source that does not distinguish them leaves the kind
    /// unset and gets the neutral marking.
    /// </remarks>
    public enum TypeHolidaySchedule
    {
        /// <summary>
        /// No specific kind, marked neutrally.
        /// </summary>
        Default,

        /// <summary>
        /// A statutory holiday on which work is suspended.
        /// </summary>
        Public,

        /// <summary>
        /// A day on which banks and public administration are closed.
        /// </summary>
        Bank,

        /// <summary>
        /// A school holiday, which leaves regular business unaffected.
        /// </summary>
        School,

        /// <summary>
        /// A commemorative day that is named but not free.
        /// </summary>
        Observance,

        /// <summary>
        /// A day that is free only for part of the region or workforce.
        /// </summary>
        Optional
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeHolidaySchedule"/> enumeration.
    /// </summary>
    public static class TypeHolidayScheduleExtensions
    {
        /// <summary>
        /// Converts the holiday kind to the token the client reads.
        /// </summary>
        /// <param name="type">The holiday kind to be converted.</param>
        /// <returns>The data value corresponding to the holiday kind.</returns>
        public static string ToValue(this TypeHolidaySchedule type)
        {
            return type switch
            {
                TypeHolidaySchedule.Public => "public",
                TypeHolidaySchedule.Bank => "bank",
                TypeHolidaySchedule.School => "school",
                TypeHolidaySchedule.Observance => "observance",
                TypeHolidaySchedule.Optional => "optional",
                _ => string.Empty,
            };
        }
    }
}
