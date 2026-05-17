namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration of button color types.
    /// </summary>
    public enum TypeColorButton
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
        Light = 8,

        /// <summary>
        /// Highlight button color.
        /// </summary>
        Highlight = 13
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeColorButton"/> enumeration.
    /// </summary>
    public static class TypeColorButtonExtensions
    {
        /// <summary>
        /// Conversion to a CSS class.
        /// </summary>
        /// <param name="color">Die Farbe, welches umgewandelt werden soll</param>
        /// <param name="outline">Die Outline-Eigenschaft</param>
        /// <returns>The CSS class belonging to the layout</returns>
        public static string ToClass(this TypeColorButton color, bool outline = false)
        {
            if (outline)
            {
                switch (color)
                {
                    case TypeColorButton.Primary:
                        return "btn-outline-primary";
                    case TypeColorButton.Secondary:
                        return "btn-outline-secondary";
                    case TypeColorButton.Success:
                        return "btn-outline-success";
                    case TypeColorButton.Info:
                        return "btn-outline-info";
                    case TypeColorButton.Warning:
                        return "btn-outline-warning";
                    case TypeColorButton.Danger:
                        return "btn-outline-danger";
                    case TypeColorButton.Dark:
                        return "btn-outline-dark";
                    case TypeColorButton.Highlight:
                        return "btn-outline-highlight";
                }
            }
            else
            {
                switch (color)
                {
                    case TypeColorButton.Primary:
                        return "btn-primary";
                    case TypeColorButton.Secondary:
                        return "btn-secondary";
                    case TypeColorButton.Success:
                        return "btn-success";
                    case TypeColorButton.Info:
                        return "btn-info";
                    case TypeColorButton.Warning:
                        return "btn-warning";
                    case TypeColorButton.Danger:
                        return "btn-danger";
                    case TypeColorButton.Light:
                        return "btn-light";
                    case TypeColorButton.Dark:
                        return "btn-dark";
                    case TypeColorButton.Highlight:
                        return "btn-highlight";
                }
            }

            return string.Empty;
        }
    }
}
