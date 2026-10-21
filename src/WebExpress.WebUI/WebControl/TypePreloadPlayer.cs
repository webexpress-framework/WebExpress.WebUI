namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// How much of a video or a sound the browser loads before playback is requested.
    /// </summary>
    public enum TypePreloadPlayer
    {
        /// <summary>
        /// Represents the default value, which is <see cref="Metadata"/>. It shows the length
        /// and the first frame without loading the whole file on every page view.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Nothing is loaded until playback starts. It saves the most data, but the player
        /// knows neither the length nor the picture until then.
        /// </summary>
        None = 1,

        /// <summary>
        /// Only the length, the dimensions and the first frame are loaded.
        /// </summary>
        Metadata = 2,

        /// <summary>
        /// The browser may load the whole file in advance, so playback starts without delay.
        /// </summary>
        Auto = 3
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypePreloadPlayer"/> enumeration.
    /// </summary>
    public static class TypePreloadPlayerExtensions
    {
        /// <summary>
        /// Converts the preload behaviour to the value of the <c>preload</c> attribute.
        /// </summary>
        /// <param name="type">The preload behaviour to convert.</param>
        /// <returns>The value.</returns>
        public static string ToValue(this TypePreloadPlayer type)
        {
            return type switch
            {
                TypePreloadPlayer.None => "none",
                TypePreloadPlayer.Auto => "auto",
                _ => "metadata"
            };
        }
    }
}
