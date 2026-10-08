namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The fade animation applied when a control appears or disappears.
    /// </summary>
    public enum TypeFade
    {
        /// <summary>
        /// No fade effect.
        /// </summary>
        None,

        /// <summary>
        /// Fade in effect.
        /// </summary>
        FadeIn,

        /// <summary>
        /// Fade out effect.
        /// </summary>
        FadeOut,

        /// <summary>
        /// Fade show effect.
        /// </summary>
        FadeShow,
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeFade"/> enum.
    /// </summary>
    public static class TypeFadeExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeFade"/> value to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The <see cref="TypeFade"/> value to be converted.</param>
        /// <returns>The CSS class corresponding to the <see cref="TypeFade"/> value.</returns>
        public static string ToClass(this TypeFade layout)
        {
            return layout switch
            {
                TypeFade.FadeIn => "fade in",
                TypeFade.FadeOut => "fade out",
                TypeFade.FadeShow => "fade show",
                _ => string.Empty,
            };
        }
    }
}
