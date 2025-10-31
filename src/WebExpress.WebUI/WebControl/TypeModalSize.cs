namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the size of a modal dialog.
    /// </summary>
    public enum TypeModalSize
    {
        /// <summary>
        /// The default modal size.
        /// </summary>
        Default,

        /// <summary>
        /// A small modal size.
        /// </summary>
        Small,

        /// <summary>
        /// A large modal size.
        /// </summary>
        Large,

        /// <summary>
        /// An extra large modal size.
        /// </summary>
        ExtraLarge,

        /// <summary>
        /// A fullscreen modal size.
        /// </summary>
        Fullscreen
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeModalSize"/> enum.
    /// </summary>
    public static class TypeModalSizeExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeActive"/> value to a corresponding CSS class.
        /// </summary>
        /// <param name="size">The <see cref="TypeModalSize"/> value to be converted.</param>
        /// <returns>The CSS class corresponding to the <see cref="TypeModalSize"/> value.</returns>
        public static string ToClass(this TypeModalSize size)
        {
            return size switch
            {
                TypeModalSize.Small => "modal-sm",
                TypeModalSize.Large => "modal-lg",
                TypeModalSize.ExtraLarge => "modal-xl",
                TypeModalSize.Fullscreen => "modal-fullscreen",
                _ => string.Empty,
            };
        }
    }
}
