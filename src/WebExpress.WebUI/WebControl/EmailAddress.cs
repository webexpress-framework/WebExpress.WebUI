using System;
using System.Text.RegularExpressions;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Checks and normalizes e-mail addresses. The rule is the one browsers apply to an input of
    /// type email (WHATWG HTML, "valid e-mail address"), so the server accepts exactly what the
    /// client lets through, rather than the full RFC 5322 grammar no mail form offers anyway.
    /// </summary>
    public static partial class EmailAddress
    {
        // RFC 5321 limits a path to 256 octets, of which the angle brackets take two
        private const int MaxLength = 254;
        private const int MaxLocalLength = 64;

        [GeneratedRegex(@"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", RegexOptions.CultureInvariant)]
        private static partial Regex Pattern();

        /// <summary>
        /// Brings an address into its stored form: trimmed, with the domain in lower case. The
        /// local part keeps its case, because only the receiving server may decide whether it matters.
        /// </summary>
        /// <param name="value">The address as written.</param>
        /// <returns>The normalized address, or null if it is no valid address.</returns>
        public static string Normalize(string value)
        {
            var trimmed = value?.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.Length > MaxLength || !Pattern().IsMatch(trimmed))
            {
                return null;
            }

            var at = trimmed.LastIndexOf('@');

            return at > MaxLocalLength
                ? null
                : trimmed[..at] + "@" + trimmed[(at + 1)..].ToLowerInvariant();
        }

        /// <summary>
        /// Determines whether a text is a valid e-mail address.
        /// </summary>
        /// <param name="value">The address as written.</param>
        /// <returns>True if the address is valid.</returns>
        public static bool IsValid(string value)
        {
            return Normalize(value) is not null;
        }

        /// <summary>
        /// Returns the domain of an address in lower case.
        /// </summary>
        /// <param name="value">The address.</param>
        /// <returns>The domain, or null if the text is no valid address.</returns>
        public static string GetDomain(string value)
        {
            var normalized = Normalize(value);

            return normalized?[(normalized.LastIndexOf('@') + 1)..];
        }

        /// <summary>
        /// Determines whether an address belongs to one of the given domains, sub-domains included.
        /// </summary>
        /// <param name="value">The address.</param>
        /// <param name="domain">The domain, such as example.com.</param>
        /// <returns>True if the address is valid and belongs to the domain.</returns>
        public static bool IsInDomain(string value, string domain)
        {
            var own = GetDomain(value);
            var expected = domain?.Trim().TrimStart('@').ToLowerInvariant();

            return own is not null && !string.IsNullOrEmpty(expected)
                && (own == expected || own.EndsWith("." + expected, StringComparison.Ordinal));
        }
    }
}
