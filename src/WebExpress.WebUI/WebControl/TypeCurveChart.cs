namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// How a line dataset runs between its points. A curve reads as a continuous course, which
    /// suits measured quantities; straight segments keep the single values in front.
    /// </summary>
    public enum TypeCurveChart
    {
        /// <summary>
        /// Straight segments from point to point.
        /// </summary>
        Straight = 0,

        /// <summary>
        /// A Bezier curve whose tangents follow the neighbouring points; the tension sets how far
        /// it swings out. It may swing past a point's value between two points.
        /// </summary>
        Bezier = 1,

        /// <summary>
        /// A monotone Bezier curve, which never swings past its neighbouring points, so every
        /// peak in the drawing is a peak in the data.
        /// </summary>
        Monotone = 2
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeCurveChart"/> enumeration.
    /// </summary>
    public static class TypeCurveChartExtensions
    {
        /// <summary>
        /// Converts the curve to the value the client-side chart reads from data-datasetN-curve.
        /// </summary>
        /// <param name="curve">The curve to convert.</param>
        /// <returns>The attribute value, or null for straight segments.</returns>
        public static string ToType(this TypeCurveChart curve)
        {
            return curve switch
            {
                TypeCurveChart.Bezier => "bezier",
                TypeCurveChart.Monotone => "monotone",
                _ => null,
            };
        }
    }
}
