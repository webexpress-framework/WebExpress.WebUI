using System.Text.RegularExpressions;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// Provides extension methods for the <see cref="IHtmlNode"/> interface.
    /// </summary>
    internal static class IHtmlNodeExtensions
    {
        /// <summary>
        /// Removes extra spaces and line breaks from the input node.
        /// </summary>
        /// <param name="node">The node to clean.</param>
        /// <returns>A string with all consecutive spaces and line breaks reduced to single ones.</returns>
        public static string Trim(this IHtmlNode node)
        {
            if (node is null)
            {
                return string.Empty;
            }

            var withoutExtraLineBreaks = Regex.Replace(node.ToString().Trim(), @"[\r\n]+", "");
            var withoutExtraSpaces = Regex.Replace(withoutExtraLineBreaks, @"\s+", " ");
            var withoutSpacesBetweenBrackets = Regex.Replace(withoutExtraSpaces, @">\s+<", "><");
            var withoutSpacesLeftBrackets = Regex.Replace(withoutSpacesBetweenBrackets, @"\s+<", "<");
            var withoutSpacesRightBrackets = Regex.Replace(withoutSpacesLeftBrackets, @">\s+", ">");

            return withoutSpacesRightBrackets;
        }
    }
}
