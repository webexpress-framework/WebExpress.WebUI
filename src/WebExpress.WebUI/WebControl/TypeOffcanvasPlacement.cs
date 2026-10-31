namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The edge from which an offcanvas panel slides in.
    /// </summary>
    public enum TypeOffcanvasPlacement
    {
        /// <summary>
        /// Slides in from the start (left in left-to-right layouts).
        /// </summary>
        Start,

        /// <summary>
        /// Slides in from the end (right in left-to-right layouts).
        /// </summary>
        End,

        /// <summary>
        /// Slides in from the top.
        /// </summary>
        Top,

        /// <summary>
        /// Slides in from the bottom.
        /// </summary>
        Bottom
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeOffcanvasPlacement"/> enum.
    /// </summary>
    public static class TypeOffcanvasPlacementExtensions
    {
        /// <summary>
        /// Converts the placement to a CSS class.
        /// </summary>
        /// <param name="placement">The placement.</param>
        /// <returns>The CSS class corresponding to the placement.</returns>
        public static string ToClass(this TypeOffcanvasPlacement placement)
        {
            return placement switch
            {
                TypeOffcanvasPlacement.End => "offcanvas-end",
                TypeOffcanvasPlacement.Top => "offcanvas-top",
                TypeOffcanvasPlacement.Bottom => "offcanvas-bottom",
                _ => "offcanvas-start",
            };
        }
    }
}
