using System;
using System.Collections.Generic;
using System.Globalization;

namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Represents an opaque RGB color as it is written into a PDF content stream.
    /// <para>
    /// The parser accepts the notations a stored editor value carries in its inline styles -
    /// hexadecimal, <c>rgb()</c>/<c>rgba()</c> and the common named colors - because those are
    /// the only places a color reaches the PDF renderer from. Transparency has no equivalent in
    /// the drawing model used here; a fully transparent color is therefore read as no color at
    /// all, so a <c>background-color: transparent</c> leaves the page white instead of black.
    /// </para>
    /// </summary>
    public readonly struct PdfColor : IEquatable<PdfColor>
    {
        private static readonly Dictionary<string, PdfColor> Named = new(StringComparer.OrdinalIgnoreCase)
        {
            ["black"] = new(0, 0, 0),
            ["white"] = new(255, 255, 255),
            ["gray"] = new(128, 128, 128),
            ["grey"] = new(128, 128, 128),
            ["silver"] = new(192, 192, 192),
            ["red"] = new(255, 0, 0),
            ["maroon"] = new(128, 0, 0),
            ["green"] = new(0, 128, 0),
            ["lime"] = new(0, 255, 0),
            ["olive"] = new(128, 128, 0),
            ["blue"] = new(0, 0, 255),
            ["navy"] = new(0, 0, 128),
            ["teal"] = new(0, 128, 128),
            ["aqua"] = new(0, 255, 255),
            ["cyan"] = new(0, 255, 255),
            ["fuchsia"] = new(255, 0, 255),
            ["magenta"] = new(255, 0, 255),
            ["purple"] = new(128, 0, 128),
            ["yellow"] = new(255, 255, 0),
            ["orange"] = new(255, 165, 0),
            ["brown"] = new(165, 42, 42),
            ["pink"] = new(255, 192, 203)
        };

        /// <summary>
        /// Returns the black color.
        /// </summary>
        public static PdfColor Black { get; } = new(0, 0, 0);

        /// <summary>
        /// Returns the white color.
        /// </summary>
        public static PdfColor White { get; } = new(255, 255, 255);

        /// <summary>
        /// Returns the red component.
        /// </summary>
        public byte R { get; }

        /// <summary>
        /// Returns the green component.
        /// </summary>
        public byte G { get; }

        /// <summary>
        /// Returns the blue component.
        /// </summary>
        public byte B { get; }

        /// <summary>
        /// Initializes a new instance of the struct.
        /// </summary>
        /// <param name="r">The red component.</param>
        /// <param name="g">The green component.</param>
        /// <param name="b">The blue component.</param>
        public PdfColor(byte r, byte g, byte b)
        {
            R = r;
            G = g;
            B = b;
        }

        /// <summary>
        /// Reads a css color value.
        /// </summary>
        /// <param name="value">The value, for example <c>#d63384</c>, <c>rgb(13, 110, 253)</c> or <c>navy</c>.</param>
        /// <param name="color">The color that was read.</param>
        /// <returns>True when the value names an opaque or semi-opaque color.</returns>
        public static bool TryParse(string value, out PdfColor color)
        {
            color = default;
            var text = value?.Trim();

            if (string.IsNullOrEmpty(text))
            {
                return false;
            }

            if (Named.TryGetValue(text, out color))
            {
                return true;
            }

            if (text.StartsWith('#'))
            {
                return TryParseHex(text[1..], out color);
            }

            if (text.StartsWith("rgb", StringComparison.OrdinalIgnoreCase))
            {
                return TryParseRgb(text, out color);
            }

            return false;
        }

        /// <summary>
        /// Reads a css color value, falling back to a default for anything unreadable.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="fallback">The color returned when the value cannot be read.</param>
        /// <returns>The color.</returns>
        public static PdfColor Parse(string value, PdfColor fallback = default)
        {
            return TryParse(value, out var color) ? color : fallback;
        }

        /// <summary>
        /// Reads the hexadecimal notation in its short and long forms; an alpha channel is
        /// accepted and ignored unless it makes the color invisible.
        /// </summary>
        /// <param name="hex">The digits without the leading hash.</param>
        /// <param name="color">The color that was read.</param>
        /// <returns>True when the digits form a color.</returns>
        private static bool TryParseHex(string hex, out PdfColor color)
        {
            color = default;

            if (hex.Length is 3 or 4)
            {
                hex = string.Concat(hex[0], hex[0], hex[1], hex[1], hex[2], hex[2], hex.Length == 4 ? new string(hex[3], 2) : "");
            }

            if (hex.Length is not (6 or 8) || !uint.TryParse(hex, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var value))
            {
                return false;
            }

            if (hex.Length == 8)
            {
                if ((value & 0xFF) == 0)
                {
                    return false;
                }

                value >>= 8;
            }

            color = new PdfColor((byte)(value >> 16), (byte)(value >> 8), (byte)value);

            return true;
        }

        /// <summary>
        /// Reads the functional notation, which is what a browser hands back when a script
        /// reads a color from the computed style.
        /// </summary>
        /// <param name="text">The value.</param>
        /// <param name="color">The color that was read.</param>
        /// <returns>True when the value forms a color.</returns>
        private static bool TryParseRgb(string text, out PdfColor color)
        {
            color = default;
            var open = text.IndexOf('(');
            var close = text.LastIndexOf(')');

            if (open < 0 || close < open)
            {
                return false;
            }

            var parts = text[(open + 1)..close].Split([',', ' ', '/'], StringSplitOptions.RemoveEmptyEntries);

            if (parts.Length < 3)
            {
                return false;
            }

            var channels = new byte[3];

            for (var i = 0; i < 3; i++)
            {
                if (!TryParseChannel(parts[i], 255, out var channel))
                {
                    return false;
                }

                channels[i] = (byte)channel;
            }

            if (parts.Length > 3 && TryParseChannel(parts[3], 1, out var alpha) && alpha <= 0)
            {
                return false;
            }

            color = new PdfColor(channels[0], channels[1], channels[2]);

            return true;
        }

        /// <summary>
        /// Reads one channel of the functional notation, as a number or a percentage.
        /// </summary>
        /// <param name="text">The channel.</param>
        /// <param name="scale">The value a percentage of one hundred stands for.</param>
        /// <param name="value">The clamped value.</param>
        /// <returns>True when the channel is a number.</returns>
        private static bool TryParseChannel(string text, double scale, out double value)
        {
            var percent = text.EndsWith('%');
            var number = percent ? text[..^1] : text;

            if (!double.TryParse(number, NumberStyles.Float, CultureInfo.InvariantCulture, out value))
            {
                return false;
            }

            value = Math.Clamp(percent ? value / 100 * scale : value, 0, scale);

            return true;
        }

        /// <summary>
        /// Determines whether two colors are equal.
        /// </summary>
        /// <param name="other">The color to compare with.</param>
        /// <returns>True when all components match.</returns>
        public bool Equals(PdfColor other)
        {
            return R == other.R && G == other.G && B == other.B;
        }

        /// <summary>
        /// Determines whether the specified object is an equal color.
        /// </summary>
        /// <param name="obj">The object to compare with.</param>
        /// <returns>True when the object is an equal color.</returns>
        public override bool Equals(object obj)
        {
            return obj is PdfColor other && Equals(other);
        }

        /// <summary>
        /// Returns the hash code of the color.
        /// </summary>
        /// <returns>The hash code.</returns>
        public override int GetHashCode()
        {
            return (R << 16) | (G << 8) | B;
        }

        /// <summary>
        /// Determines whether two colors are equal.
        /// </summary>
        public static bool operator ==(PdfColor left, PdfColor right) => left.Equals(right);

        /// <summary>
        /// Determines whether two colors differ.
        /// </summary>
        public static bool operator !=(PdfColor left, PdfColor right) => !left.Equals(right);

        /// <summary>
        /// Returns the color in hexadecimal notation.
        /// </summary>
        /// <returns>The color, for example <c>#0d6efd</c>.</returns>
        public override string ToString()
        {
            return $"#{R:x2}{G:x2}{B:x2}";
        }
    }
}
