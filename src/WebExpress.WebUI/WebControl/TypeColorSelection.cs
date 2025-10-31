namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration of selection color types.
    /// </summary>
    public enum TypeColorSelection
    {
        /// <summary>
        /// Default button color.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Primary button color.
        /// </summary>
        Primary = 1,

        /// <summary>
        /// Secondary button color.
        /// </summary>
        Secondary = 2,

        /// <summary>
        /// Success button color.
        /// </summary>
        Success = 3,

        /// <summary>
        /// Info button color.
        /// </summary>
        Info = 4,

        /// <summary>
        /// Warning button color.
        /// </summary>
        Warning = 5,

        /// <summary>
        /// Danger button color.
        /// </summary>
        Danger = 6,

        /// <summary>
        /// Dark button color.
        /// </summary>
        Dark = 7,

        /// <summary>
        /// Light button color.
        /// </summary>
        Light = 8
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeColorSelection"/> enumeration.
    /// </summary>
    public static class TypeColorSelectionExtensions
    {
        /// <summary>
        /// Conversion to a CSS class.
        /// </summary>
        /// <param name="color">Die Farbe, welches umgewandelt werden soll</param>
        /// <param name="outline">Die Outline-Eigenschaft</param>
        /// <returns>The CSS class belonging to the layout</returns>
        public static string ToClass(this TypeColorSelection color, bool outline = false)
        {
            switch (color)
            {
                case TypeColorSelection.Primary:
                    return "wx-selection-primary";
                case TypeColorSelection.Secondary:
                    return "wx-selection-secondary";
                case TypeColorSelection.Success:
                    return "wx-selection-success";
                case TypeColorSelection.Info:
                    return "wx-selection-info";
                case TypeColorSelection.Warning:
                    return "wx-selection-warning";
                case TypeColorSelection.Danger:
                    return "wx-selection-danger";
                case TypeColorSelection.Light:
                    return "wx-selection-light";
                case TypeColorSelection.Dark:
                    return "wx-selection-dark";
            }

            return string.Empty;
        }
    }
}
