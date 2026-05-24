namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration of color types used by the dual-handle slider control.
    /// A single value styles the lower handle, the upper handle, and the
    /// connecting band together so the control stays visually coherent.
    /// </summary>
    public enum TypeColorSlider
    {
        /// <summary>
        /// Default slider color (theme-driven blue/violet gradient).
        /// </summary>
        Default = 0,

        /// <summary>
        /// Primary slider color.
        /// </summary>
        Primary = 1,

        /// <summary>
        /// Secondary slider color.
        /// </summary>
        Secondary = 2,

        /// <summary>
        /// Success slider color.
        /// </summary>
        Success = 3,

        /// <summary>
        /// Info slider color.
        /// </summary>
        Info = 4,

        /// <summary>
        /// Warning slider color.
        /// </summary>
        Warning = 5,

        /// <summary>
        /// Danger slider color.
        /// </summary>
        Danger = 6,

        /// <summary>
        /// Dark slider color.
        /// </summary>
        Dark = 7,

        /// <summary>
        /// Light slider color.
        /// </summary>
        Light = 8,

        /// <summary>
        /// Highlight slider color.
        /// </summary>
        Highlight = 13
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeColorSlider"/> enum.
    /// </summary>
    public static class TypeColorSliderExtensions
    {
        /// <summary>
        /// Converts the slider color to its CSS marker class. The CSS file
        /// uses these marker classes to override the slider's color custom
        /// properties (band, handle border) in a single place.
        /// </summary>
        /// <param name="color">The slider color to convert.</param>
        /// <returns>The CSS class corresponding to the slider color.</returns>
        public static string ToClass(this TypeColorSlider color)
        {
            return color switch
            {
                TypeColorSlider.Primary => "wx-slider-color-primary",
                TypeColorSlider.Secondary => "wx-slider-color-secondary",
                TypeColorSlider.Success => "wx-slider-color-success",
                TypeColorSlider.Info => "wx-slider-color-info",
                TypeColorSlider.Warning => "wx-slider-color-warning",
                TypeColorSlider.Danger => "wx-slider-color-danger",
                TypeColorSlider.Light => "wx-slider-color-light",
                TypeColorSlider.Dark => "wx-slider-color-dark",
                TypeColorSlider.Highlight => "wx-slider-color-highlight",
                _ => string.Empty,
            };
        }
    }
}
