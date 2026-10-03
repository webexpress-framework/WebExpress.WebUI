namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The direction of the change shown by a <see cref="ControlStat"/> delta.
    /// </summary>
    public enum TypeStatTrend
    {
        /// <summary>
        /// No change, shown in a neutral color.
        /// </summary>
        Neutral,

        /// <summary>
        /// An increase, shown in a positive color.
        /// </summary>
        Up,

        /// <summary>
        /// A decrease, shown in a negative color.
        /// </summary>
        Down
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeStatTrend"/> enum.
    /// </summary>
    public static class TypeStatTrendExtensions
    {
        /// <summary>
        /// Converts the trend to a CSS class.
        /// </summary>
        /// <param name="trend">The trend.</param>
        /// <returns>The CSS class corresponding to the trend.</returns>
        public static string ToClass(this TypeStatTrend trend)
        {
            return trend switch
            {
                TypeStatTrend.Up => "wx-stat-up",
                TypeStatTrend.Down => "wx-stat-down",
                _ => "wx-stat-neutral",
            };
        }
    }
}
