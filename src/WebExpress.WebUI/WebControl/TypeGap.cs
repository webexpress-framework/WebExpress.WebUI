using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the spacing (gap) between flex items.
    /// </summary>
    public enum TypeGap
    {
        /// <summary>
        /// No gap (gap-0).
        /// </summary>
        None = 0,

        /// <summary>
        /// Small gap (gap-1).
        /// </summary>
        One = 1,

        /// <summary>
        /// Medium gap (gap-2).
        /// </summary>
        Two = 2,

        /// <summary>
        /// Large gap (gap-3).
        /// </summary>
        Three = 3,

        /// <summary>
        /// Extra large gap (gap-4).
        /// </summary>
        Four = 4,

        /// <summary>
        /// Very large gap (gap-5).
        /// </summary>
        Five = 5
    }
}

/// <summary>
/// Provides extension methods for the <see cref="TypeWrap"/> enumeration.
/// </summary>
public static class TypeGapExtensions
{
    /// <summary>
    /// Converts the gap value to a CSS class.
    /// </summary>
    public static string ToClass(this TypeGap gap)
    {
        return gap switch
        {
            TypeGap.None => "gap-0",
            TypeGap.One => "gap-1",
            TypeGap.Two => "gap-2",
            TypeGap.Three => "gap-3",
            TypeGap.Four => "gap-4",
            TypeGap.Five => "gap-5",
            _ => string.Empty
        };
    }
}
