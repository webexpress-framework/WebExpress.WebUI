namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration representing different types of color tiles.
    /// </summary>
    public enum TypeColorTile
    {
        /// <summary>
        /// Default tile card color.
        /// </summary>
        Default,

        /// <summary>
        /// Primary tile card color.
        /// </summary>
        Primary,

        /// <summary>
        /// Secondary tile card color.
        /// </summary>
        Secondary,

        /// <summary>
        /// Success tile card color.
        /// </summary>
        Success,

        /// <summary>
        /// Info tile card color.
        /// </summary>
        Info,

        /// <summary>
        /// Warning tile card color.
        /// </summary>
        Warning,

        /// <summary>
        /// Danger tile card color.
        /// </summary>
        Danger,

        /// <summary>
        /// Dark tile card color.
        /// </summary>
        Dark,

        /// <summary>
        /// Light tile card color.
        /// </summary>
        Light,

        /// <summary>
        /// White tile card color.
        /// </summary>
        White,

        /// <summary>
        /// Transparent tile card color.
        /// </summary>
        Transparent,

        /// <summary>
        /// Highlight tile card color.
        /// </summary>
        Highlight
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeColorCallout"/> enumeration.
    /// </summary>
    public static class TypeColorBackgroundTileExtensions
    {
        /// <summary>
        /// Converts the TypeColorCallout to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The TypeColorCallout to be converted.</param>
        /// <returns>The CSS class corresponding to the TypeColorCallout.</returns>
        public static string ToClass(this TypeColorTile layout)
        {
            return layout switch
            {
                TypeColorTile.Primary => "wx-tile-primary",
                TypeColorTile.Secondary => "wx-tile-secondary",
                TypeColorTile.Success => "wx-tile-success",
                TypeColorTile.Info => "wx-tile-info",
                TypeColorTile.Warning => "wx-tile-warning",
                TypeColorTile.Danger => "wx-tile-danger",
                TypeColorTile.Light => "wx-tile-light",
                TypeColorTile.Dark => "wx-tile-dark",
                TypeColorTile.White => "wx-tile-white",
                TypeColorTile.Transparent => "wx-tile-transparent",
                TypeColorTile.Highlight => "wx-tile-highlight",
                _ => string.Empty,
            };
        }
    }
}
