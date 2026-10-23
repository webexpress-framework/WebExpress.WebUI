using System;
using System.Collections.Generic;
using System.Text;

namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Names the twelve faces of the standard fonts the renderer sets text in.
    /// </summary>
    internal enum PdfFontFace
    {
        Helvetica,
        HelveticaBold,
        HelveticaOblique,
        HelveticaBoldOblique,
        TimesRoman,
        TimesBold,
        TimesItalic,
        TimesBoldItalic,
        Courier,
        CourierBold,
        CourierOblique,
        CourierBoldOblique
    }

    /// <summary>
    /// Holds what the layout needs to know about the standard fonts: their names, the width
    /// of every character, and how a character is encoded.
    /// <para>
    /// The standard fonts are not embedded, so the file does not carry their metrics either;
    /// a line can only be broken correctly if the widths are known here. The tables are the
    /// advance widths of the WinAnsi characters 32 to 255 in thousandths of the font size,
    /// taken from Arial and Times New Roman, which were drawn to the metrics of Helvetica and
    /// Times. Courier is monospaced.
    /// </para>
    /// </summary>
    internal static class PdfFont
    {
        /// <summary>
        /// The height of the ascender above the baseline, relative to the font size.
        /// </summary>
        public const float Ascent = 0.75f;

        /// <summary>
        /// The depth of the descender below the baseline, relative to the font size.
        /// </summary>
        public const float Descent = 0.22f;

        /// <summary>
        /// The characters of the range 0x80 to 0x9F, where WinAnsi departs from Latin-1.
        /// Unassigned positions are zero.
        /// </summary>
        private static readonly char[] WinAnsiHigh =
        [
            '\u20AC', '\0', '\u201A', '\u0192', '\u201E', '\u2026', '\u2020', '\u2021',
            '\u02C6', '\u2030', '\u0160', '\u2039', '\u0152', '\0', '\u017D', '\0',
            '\0', '\u2018', '\u2019', '\u201C', '\u201D', '\u2022', '\u2013', '\u2014',
            '\u02DC', '\u2122', '\u0161', '\u203A', '\u0153', '\0', '\u017E', '\u0178'
        ];

        private static readonly Dictionary<char, byte> Reverse = CreateReverse();

        /// <summary>
        /// Characters outside of WinAnsi that have a close stand-in inside it. A question
        /// mark is the honest fallback, but for punctuation that merely has a typographic
        /// variant it would mangle text that reads fine with the plain form.
        /// </summary>
        private static readonly Dictionary<int, string> Substitutes = new()
        {
            [0x2010] = "-",
            [0x2011] = "-",
            [0x2012] = "-",
            [0x2015] = "\u2014",
            [0x2212] = "-",
            [0x2002] = " ",
            [0x2003] = " ",
            [0x2009] = " ",
            [0x200A] = " ",
            [0x202F] = " ",
            [0x2032] = "'",
            [0x2033] = "\"",
            [0x2190] = "<-",
            [0x2192] = "->",
            [0x2194] = "<->",
            [0x21D2] = "=>",
            [0x2264] = "<=",
            [0x2265] = ">=",
            [0x2260] = "!=",
            [0x25CF] = "\u2022",
            [0x25E6] = "\u00B0",
            [0x2219] = "\u00B7"
        };

        /// <summary>
        /// The widths of the proportional faces, in the order of <see cref="PdfFontFace"/>.
        /// </summary>
        private static readonly short[][] Widths =
        [
            // Helvetica
            [
                278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
                556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
                1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
                667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
                333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
                556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 0,
                556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
                0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 0, 500, 667,
                278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 552,
                400, 549, 333, 333, 333, 576, 537, 333, 333, 333, 365, 556, 834, 834, 834, 611,
                667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
                722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
                556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278,
                556, 556, 556, 556, 556, 556, 556, 549, 611, 556, 556, 556, 556, 500, 556, 500
            ],
            // HelveticaBold
            [
                278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
                556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
                975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
                667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
                333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
                611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 0,
                556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
                0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 0, 500, 667,
                278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 552,
                400, 549, 333, 333, 333, 576, 556, 333, 333, 333, 365, 556, 834, 834, 834, 611,
                722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
                722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
                556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278,
                611, 611, 611, 611, 611, 611, 611, 549, 611, 611, 611, 611, 611, 556, 611, 556
            ],
            // HelveticaOblique
            [
                278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
                556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
                1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
                667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
                333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
                556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 0,
                556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
                0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 0, 500, 667,
                278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 552,
                400, 549, 333, 333, 333, 576, 537, 333, 333, 333, 365, 556, 834, 834, 834, 611,
                667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
                722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
                556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278,
                556, 556, 556, 556, 556, 556, 556, 549, 611, 556, 556, 556, 556, 500, 556, 500
            ],
            // HelveticaBoldOblique
            [
                278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
                556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
                975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
                667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
                333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
                611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 0,
                556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
                0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 0, 500, 667,
                278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 552,
                400, 549, 333, 333, 333, 576, 556, 333, 333, 333, 365, 556, 834, 834, 834, 611,
                722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
                722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
                556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278,
                611, 611, 611, 611, 611, 611, 611, 549, 611, 611, 611, 611, 611, 556, 611, 556
            ],
            // TimesRoman
            [
                250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333, 250, 278,
                500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 278, 278, 564, 564, 564, 444,
                921, 722, 667, 667, 722, 611, 556, 722, 722, 333, 389, 722, 611, 889, 722, 722,
                556, 722, 667, 556, 611, 722, 722, 944, 722, 722, 611, 333, 278, 333, 469, 500,
                333, 444, 500, 444, 500, 444, 333, 500, 500, 278, 278, 500, 278, 778, 500, 500,
                500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444, 480, 200, 480, 541, 0,
                500, 0, 333, 500, 444, 1000, 500, 500, 333, 1000, 556, 333, 889, 0, 611, 0,
                0, 333, 333, 444, 444, 350, 500, 1000, 333, 980, 389, 333, 722, 0, 444, 722,
                250, 333, 500, 500, 500, 500, 200, 500, 333, 760, 276, 500, 564, 333, 760, 500,
                400, 549, 300, 300, 333, 576, 453, 333, 333, 300, 310, 500, 750, 750, 750, 444,
                722, 722, 722, 722, 722, 722, 889, 667, 611, 611, 611, 611, 333, 333, 333, 333,
                722, 722, 722, 722, 722, 722, 722, 564, 722, 722, 722, 722, 722, 722, 556, 500,
                444, 444, 444, 444, 444, 444, 667, 444, 444, 444, 444, 444, 278, 278, 278, 278,
                500, 500, 500, 500, 500, 500, 500, 549, 500, 500, 500, 500, 500, 500, 500, 500
            ],
            // TimesBold
            [
                250, 333, 555, 500, 500, 1000, 833, 278, 333, 333, 500, 570, 250, 333, 250, 278,
                500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 333, 333, 570, 570, 570, 500,
                930, 722, 667, 722, 722, 667, 611, 778, 778, 389, 500, 778, 667, 944, 722, 778,
                611, 778, 722, 556, 667, 722, 722, 1000, 722, 722, 667, 333, 278, 333, 581, 500,
                333, 500, 556, 444, 556, 444, 333, 500, 556, 278, 333, 556, 278, 833, 556, 500,
                556, 556, 444, 389, 333, 556, 500, 722, 500, 500, 444, 394, 220, 394, 520, 0,
                500, 0, 333, 500, 500, 1000, 500, 500, 333, 1000, 556, 333, 1000, 0, 667, 0,
                0, 333, 333, 500, 500, 350, 500, 1000, 333, 1000, 389, 333, 722, 0, 444, 722,
                250, 333, 500, 500, 500, 500, 220, 500, 333, 747, 300, 500, 570, 333, 747, 500,
                400, 549, 300, 300, 333, 576, 540, 333, 333, 300, 330, 500, 750, 750, 750, 500,
                722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 389, 389, 389, 389,
                722, 722, 778, 778, 778, 778, 778, 570, 778, 722, 722, 722, 722, 722, 611, 556,
                500, 500, 500, 500, 500, 500, 722, 444, 444, 444, 444, 444, 278, 278, 278, 278,
                500, 556, 500, 500, 500, 500, 500, 549, 500, 556, 556, 556, 556, 500, 556, 500
            ],
            // TimesItalic
            [
                250, 333, 420, 500, 500, 833, 778, 214, 333, 333, 500, 675, 250, 333, 250, 278,
                500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 333, 333, 675, 675, 675, 500,
                920, 611, 611, 667, 722, 611, 611, 722, 722, 333, 444, 667, 556, 833, 667, 722,
                611, 722, 611, 500, 556, 722, 611, 833, 611, 556, 556, 389, 278, 389, 422, 500,
                333, 500, 500, 444, 500, 444, 278, 500, 500, 278, 278, 444, 278, 722, 500, 500,
                500, 500, 389, 389, 278, 500, 444, 667, 444, 444, 389, 400, 275, 400, 541, 0,
                500, 0, 333, 500, 556, 889, 500, 500, 333, 1000, 500, 333, 944, 0, 556, 0,
                0, 333, 333, 556, 556, 350, 500, 889, 333, 980, 389, 333, 667, 0, 389, 556,
                250, 389, 500, 500, 500, 500, 275, 500, 333, 760, 276, 500, 675, 333, 760, 500,
                400, 549, 300, 300, 333, 576, 523, 250, 333, 300, 310, 500, 750, 750, 750, 500,
                611, 611, 611, 611, 611, 611, 889, 667, 611, 611, 611, 611, 333, 333, 333, 333,
                722, 667, 722, 722, 722, 722, 722, 675, 722, 722, 722, 722, 722, 556, 611, 500,
                500, 500, 500, 500, 500, 500, 667, 444, 444, 444, 444, 444, 278, 278, 278, 278,
                500, 500, 500, 500, 500, 500, 500, 549, 500, 500, 500, 500, 500, 444, 500, 444
            ],
            // TimesBoldItalic
            [
                250, 389, 555, 500, 500, 833, 778, 278, 333, 333, 500, 570, 250, 333, 250, 278,
                500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 333, 333, 570, 570, 570, 500,
                832, 667, 667, 667, 722, 667, 667, 722, 778, 389, 500, 667, 611, 889, 722, 722,
                611, 722, 667, 556, 611, 722, 667, 889, 667, 611, 611, 333, 278, 333, 570, 500,
                333, 500, 500, 444, 500, 444, 333, 500, 556, 278, 278, 500, 278, 778, 556, 500,
                500, 500, 389, 389, 278, 556, 444, 667, 500, 444, 389, 348, 220, 348, 570, 0,
                500, 0, 333, 500, 500, 1000, 500, 500, 333, 1000, 556, 333, 944, 0, 611, 0,
                0, 333, 333, 500, 500, 350, 500, 1000, 333, 1000, 389, 333, 722, 0, 389, 611,
                250, 389, 500, 500, 500, 500, 220, 500, 333, 747, 266, 500, 606, 333, 747, 500,
                400, 549, 300, 300, 333, 576, 500, 250, 333, 300, 300, 500, 750, 750, 750, 500,
                667, 667, 667, 667, 667, 667, 944, 667, 667, 667, 667, 667, 389, 389, 389, 389,
                722, 722, 722, 722, 722, 722, 722, 570, 722, 722, 722, 722, 722, 611, 611, 500,
                500, 500, 500, 500, 500, 500, 722, 444, 444, 444, 444, 444, 278, 278, 278, 278,
                500, 556, 500, 500, 500, 500, 500, 549, 500, 556, 556, 556, 556, 444, 500, 444
            ]
        ];

        /// <summary>
        /// Returns the PostScript name of a face, as the file references it.
        /// </summary>
        /// <param name="face">The face.</param>
        /// <returns>The name.</returns>
        public static string BaseFont(PdfFontFace face)
        {
            return face switch
            {
                PdfFontFace.Helvetica => "Helvetica",
                PdfFontFace.HelveticaBold => "Helvetica-Bold",
                PdfFontFace.HelveticaOblique => "Helvetica-Oblique",
                PdfFontFace.HelveticaBoldOblique => "Helvetica-BoldOblique",
                PdfFontFace.TimesRoman => "Times-Roman",
                PdfFontFace.TimesBold => "Times-Bold",
                PdfFontFace.TimesItalic => "Times-Italic",
                PdfFontFace.TimesBoldItalic => "Times-BoldItalic",
                PdfFontFace.Courier => "Courier",
                PdfFontFace.CourierBold => "Courier-Bold",
                PdfFontFace.CourierOblique => "Courier-Oblique",
                _ => "Courier-BoldOblique"
            };
        }

        /// <summary>
        /// Returns the face of a family in a weight and slant.
        /// </summary>
        /// <param name="family">The family.</param>
        /// <param name="bold">Whether the bold face is wanted.</param>
        /// <param name="italic">Whether the italic face is wanted.</param>
        /// <returns>The face.</returns>
        public static PdfFontFace Resolve(PdfFontFamily family, bool bold, bool italic)
        {
            var first = family switch
            {
                PdfFontFamily.Times => PdfFontFace.TimesRoman,
                PdfFontFamily.Courier => PdfFontFace.Courier,
                _ => PdfFontFace.Helvetica
            };

            return first + (bold ? 1 : 0) + (italic ? 2 : 0);
        }

        /// <summary>
        /// Returns the width of encoded text.
        /// </summary>
        /// <param name="face">The face the text is set in.</param>
        /// <param name="encoded">The text as returned by <see cref="Encode"/>.</param>
        /// <param name="size">The font size in points.</param>
        /// <returns>The width in points.</returns>
        public static float Measure(PdfFontFace face, string encoded, float size)
        {
            if (face >= PdfFontFace.Courier)
            {
                return encoded.Length * 600 * size / 1000f;
            }

            var table = Widths[(int)face];
            var sum = 0;

            foreach (var c in encoded)
            {
                sum += c >= 32 && c <= 255 ? table[c - 32] : 0;
            }

            return sum * size / 1000f;
        }

        /// <summary>
        /// Encodes text into the WinAnsi code points the standard fonts are addressed with.
        /// The result is a string of characters from 0 to 255, each standing for one byte,
        /// so it can be measured and later written byte for byte. Characters that have no
        /// code point are substituted or become a question mark; invisible formatting
        /// characters are dropped.
        /// </summary>
        /// <param name="text">The text.</param>
        /// <returns>The encoded text.</returns>
        public static string Encode(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return string.Empty;
            }

            var builder = new StringBuilder(text.Length);

            foreach (var rune in text.EnumerateRunes())
            {
                var value = rune.Value;

                if (value is 0x200B or 0x200C or 0x200D or 0x2060 or 0xFEFF or 0xAD || (value < 32 && value != '\t'))
                {
                    continue;
                }

                if (value == '\t')
                {
                    builder.Append(' ');
                }
                else if (value < 0x7F || (value >= 0xA0 && value <= 0xFF))
                {
                    builder.Append((char)value);
                }
                else if (value < 0x10000 && Reverse.TryGetValue((char)value, out var code))
                {
                    builder.Append((char)code);
                }
                else if (Substitutes.TryGetValue(value, out var substitute))
                {
                    builder.Append(Encode(substitute));
                }
                else
                {
                    builder.Append('?');
                }
            }

            return builder.ToString();
        }

        /// <summary>
        /// Builds the map from the characters of the range 0x80 to 0x9F to their code points.
        /// </summary>
        /// <returns>The map.</returns>
        private static Dictionary<char, byte> CreateReverse()
        {
            var map = new Dictionary<char, byte>();

            for (var i = 0; i < WinAnsiHigh.Length; i++)
            {
                if (WinAnsiHigh[i] != '\0')
                {
                    map[WinAnsiHigh[i]] = (byte)(0x80 + i);
                }
            }

            return map;
        }
    }
}
