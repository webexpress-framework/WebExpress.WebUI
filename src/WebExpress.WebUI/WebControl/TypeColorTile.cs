namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration representing different types of color tiles.
    /// </summary>
    public enum TypeColorTile
    {
        /// <summary>
        /// Default color tile card.
        /// </summary>
        Default,

        /// <summary>
        /// Primary color tile card.
        /// </summary>
        Primary,

        /// <summary>
        /// Secondary color tile card.
        /// </summary>
        Secondary,

        /// <summary>
        /// Success color tile card.
        /// </summary>
        Success,

        /// <summary>
        /// Info color tile card.
        /// </summary>
        Info,

        /// <summary>
        /// Warning color tile card.
        /// </summary>
        Warning,

        /// <summary>
        /// Danger color tile card.
        /// </summary>
        Danger,

        /// <summary>
        /// Dark color tile card.
        /// </summary>
        Dark,

        /// <summary>
        /// Light color tile card.
        /// </summary>
        Light,

        /// <summary>
        /// White color tile card.
        /// </summary>
        White,

        /// <summary>
        /// Transparent color tile card.
        /// </summary>
        Transparent
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
                _ => string.Empty,
            };
        }
    }
}
