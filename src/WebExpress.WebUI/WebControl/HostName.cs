using System;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Checks and normalizes fully qualified domain names. A name is checked in its ASCII form
    /// (RFC 1123 labels of at most 63 characters, at most 253 in all), so an internationalized
    /// name such as bücher.de is accepted, and is stored in lower case with its Unicode labels,
    /// the way a user reads it. A single label is no fully qualified name, and a name whose last
    /// label is numeric is an IP address rather than a host name.
    /// </summary>
    public static partial class HostName
    {
        private const int MaxLength = 253;

        private static readonly IdnMapping _idn = new() { AllowUnassigned = false, UseStd3AsciiRules = true };

        [GeneratedRegex(@"^(?!-)[a-z0-9-]{1,63}(?<!-)$", RegexOptions.CultureInvariant)]
        private static partial Regex Label();

        /// <summary>
        /// Brings a name into its stored form: trimmed, without a trailing root dot, in lower case.
        /// </summary>
        /// <param name="value">The name as written.</param>
        /// <param name="wildcard">Whether a leading *. label is accepted, as in a certificate name.</param>
        /// <returns>The normalized name, or null if it is no fully qualified domain name.</returns>
        public static string Normalize(string value, bool wildcard = false)
        {
            var name = value?.Trim().TrimEnd('.');
            if (string.IsNullOrEmpty(name))
            {
                return null;
            }

            var prefix = "";
            if (wildcard && name.StartsWith("*.", StringComparison.Ordinal))
            {
                prefix = "*.";
                name = name[2..];
            }

            string ascii;
            try
            {
                ascii = _idn.GetAscii(name).ToLowerInvariant();
            }
            catch (ArgumentException)
            {
                return null;
            }

            var labels = ascii.Split('.');
            if (ascii.Length + prefix.Length > MaxLength
                || labels.Length < 2
                || !labels.All(x => Label().IsMatch(x))
                || labels[^1].All(char.IsAsciiDigit))
            {
                return null;
            }

            return prefix + _idn.GetUnicode(ascii);
        }

        /// <summary>
        /// Determines whether a text is a fully qualified domain name.
        /// </summary>
        /// <param name="value">The name as written.</param>
        /// <param name="wildcard">Whether a leading *. label is accepted.</param>
        /// <returns>True if the name is valid.</returns>
        public static bool IsValid(string value, bool wildcard = false)
        {
            return Normalize(value, wildcard) is not null;
        }

        /// <summary>
        /// Determines whether a name lies within a domain, the domain itself included.
        /// </summary>
        /// <param name="value">The name.</param>
        /// <param name="domain">The domain, such as example.com.</param>
        /// <returns>True if both are valid names and the name lies within the domain.</returns>
        public static bool IsInDomain(string value, string domain)
        {
            var name = Normalize(value, true);
            var expected = Normalize(domain);
            if (name is null || expected is null)
            {
                return false;
            }

            name = name.StartsWith("*.", StringComparison.Ordinal) ? name[2..] : name;

            return name == expected || name.EndsWith("." + expected, StringComparison.Ordinal);
        }
    }
}
