using System.Collections.Generic;

namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Specifies the types of list markers used in Markdown formatting.
    /// </summary>
    public enum MarkdownListType
    {
        /// <summary>
        /// Decimal numbering: 1, 2, 3, ...
        /// </summary>
        Numeric,

        /// <summary>
        /// Uppercase Roman numerals: I, II, III, ...
        /// </summary>
        UpperRoman,

        /// <summary>
        /// Lowercase Roman numerals: i, ii, iii, ...
        /// </summary>
        LowerRoman,

        /// <summary>
        /// Uppercase letters: A, B, C, ...
        /// </summary>
        UpperAlpha,

        /// <summary>
        /// Lowercase letters: a, b, c, ...
        /// </summary>
        LowerAlpha
    }

    /// <summary>
    /// Provides extension methods for parsing HTML list type indicators from strings.
    /// </summary>
    public static class MarkdownListTypeExtensions
    {
        /// <summary>
        /// Converts the enum value into its corresponding HTML string representation.
        /// </summary>
        /// <param name="listType">The type to convert.</param>
        /// <returns>A string suitable for use as the <c>type</c> attribute in an &lt;ol&gt; element.</returns>
        public static string ToHtmlType(this MarkdownListType listType)
        {
            return listType switch
            {
                MarkdownListType.Numeric => "1",
                MarkdownListType.UpperRoman => "I",
                MarkdownListType.LowerRoman => "i",
                MarkdownListType.UpperAlpha => "A",
                MarkdownListType.LowerAlpha => "a",
                _ => "1"
            };
        }

        /// <summary>
        /// Converts a list marker string (e.g. "1.", "I.", "a.") into a corresponding <see cref="HtmlListType"/>.
        /// </summary>
        /// <param name="input">The list marker to analyze.</param>
        /// <returns>
        /// The detected type.
        /// </returns>
        public static MarkdownListType ToListType(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return MarkdownListType.Numeric;
            }

            input = input.Trim().TrimEnd('.');

            // decimal number
            if (int.TryParse(input, out _))
            {
                return MarkdownListType.Numeric;
            }

            // roman numeral (uppercase or lowercase)
            if (TryRomanOrDecimalToInt(input, out _))
            {
                if (char.IsUpper(input[0]))
                {
                    return MarkdownListType.UpperRoman;
                }

                return MarkdownListType.LowerRoman;
            }

            // alphabetic (single letter)
            if (input.Length == 1 && char.IsLetter(input[0]))
            {
                if (char.IsUpper(input[0]))
                {
                    return MarkdownListType.UpperAlpha;
                }

                return MarkdownListType.LowerAlpha;
            }

            return MarkdownListType.Numeric;
        }

        /// <summary>
        /// Attempts to convert a string to an integer, supporting both Roman numerals (e.g. "XIV") 
        /// and decimal numbers (e.g. "42").
        /// </summary>
        /// <param name="input">The input string to convert.</param>
        /// <param name="result">Outputs the numeric value if conversion succeeds; otherwise 0.</param>
        /// <returns>
        /// <c>true</c> if the input was successfully parsed as either Roman or decimal; 
        /// otherwise <c>false</c>.
        /// </returns>
        public static bool TryRomanOrDecimalToInt(string input, out int result)
        {
            result = 0;

            if (string.IsNullOrWhiteSpace(input))
            {
                return false;
            }

            input = input.Trim().TrimEnd('.');

            // try decimal first
            if (int.TryParse(input, out result))
            {
                return true;
            }

            // fallback to roman numeral parsing
            var map = new Dictionary<char, int>
            {
                ['I'] = 1,
                ['V'] = 5,
                ['X'] = 10,
                ['L'] = 50,
                ['C'] = 100,
                ['D'] = 500,
                ['M'] = 1000
            };

            int total = 0;
            int previous = 0;

            foreach (char c in input.ToUpperInvariant())
            {
                if (!map.TryGetValue(c, out int current))
                {
                    return false;
                }

                if (current > previous)
                {
                    total += current - 2 * previous;
                }
                else
                {
                    total += current;
                }

                previous = current;
            }

            result = total;

            return true;
        }
    }
}