using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The lit lamp of a <see cref="ControlTrafficLight"/>. A traffic light shows the overall
    /// status of something by lighting exactly one lamp at a time.
    /// </summary>
    public enum TypeTrafficLight
    {
        /// <summary>
        /// No lamp is lit, the traffic light is dark.
        /// </summary>
        Off,

        /// <summary>
        /// The red lamp is lit, signaling a stop, error or critical state.
        /// </summary>
        Red,

        /// <summary>
        /// The yellow lamp is lit, signaling a warning or transitional state.
        /// </summary>
        Yellow,

        /// <summary>
        /// The green lamp is lit, signaling an ok or ready state.
        /// </summary>
        Green
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeTrafficLight"/> enum.
    /// </summary>
    public static class TypeTrafficLightExtensions
    {
        /// <summary>
        /// Converts the state to the lowercase token that the client runtime expects in the
        /// <c>data-value</c> attribute. The token is kept stable and culture independent so the
        /// JavaScript control can match it regardless of the active language.
        /// </summary>
        /// <param name="state">The state.</param>
        /// <returns>The data attribute token corresponding to the state.</returns>
        public static string ToValue(this TypeTrafficLight state)
        {
            return state switch
            {
                TypeTrafficLight.Red => "red",
                TypeTrafficLight.Yellow => "yellow",
                TypeTrafficLight.Green => "green",
                _ => "off",
            };
        }

        /// <summary>
        /// Parses a client token back into a <see cref="TypeTrafficLight"/>. Unknown or empty
        /// tokens fall back to <see cref="TypeTrafficLight.Off"/> so a malformed value never throws.
        /// </summary>
        /// <param name="value">The token, as produced by <see cref="ToValue"/>.</param>
        /// <returns>The parsed state.</returns>
        public static TypeTrafficLight ToTrafficLight(this string value)
        {
            return value?.Trim().ToLowerInvariant() switch
            {
                "red" => TypeTrafficLight.Red,
                "yellow" => TypeTrafficLight.Yellow,
                "green" => TypeTrafficLight.Green,
                _ => TypeTrafficLight.Off,
            };
        }
    }
}
