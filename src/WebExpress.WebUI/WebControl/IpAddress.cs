using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Text.RegularExpressions;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Checks and normalizes IPv4 and IPv6 addresses, optionally with a prefix length as in
    /// CIDR notation (192.0.2.0/24). The parser of the runtime is lenient - it reads "10.1" as
    /// 10.0.0.1 - so an IPv4 address is held to the dotted-decimal form with four parts and no
    /// leading zeros, the only form every system reads alike. An IPv6 address is stored in the
    /// canonical text form of RFC 5952, lower case and with the longest run of zeros compressed.
    /// A zone index (fe80::1%eth0) names an interface of one machine and is not accepted.
    /// </summary>
    public static partial class IpAddress
    {
        // [0-9], not \d: in .NET \d matches every Unicode digit, and an address written in
        // arabic-indic digits is no address any other system reads
        [GeneratedRegex(@"^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$", RegexOptions.CultureInvariant)]
        private static partial Regex Version4();

        [GeneratedRegex(@"^(?:0|[1-9][0-9]{0,2})$", RegexOptions.CultureInvariant)]
        private static partial Regex PrefixLength();

        /// <summary>
        /// Brings an address into its stored form.
        /// </summary>
        /// <param name="value">The address as written, with a prefix length where allowed.</param>
        /// <param name="version">The version the address must belong to.</param>
        /// <param name="allowPrefix">Whether a prefix length is accepted.</param>
        /// <returns>The normalized address, or null if it is no such address.</returns>
        public static string Normalize(string value, TypeIpVersion version = TypeIpVersion.Any, bool allowPrefix = false)
        {
            return Check(value, version, allowPrefix, out var normalized) == IpAddressError.None ? normalized : null;
        }

        /// <summary>
        /// Determines whether a text is such an address.
        /// </summary>
        /// <param name="value">The address as written.</param>
        /// <param name="version">The version the address must belong to.</param>
        /// <param name="allowPrefix">Whether a prefix length is accepted.</param>
        /// <returns>True if the address is valid.</returns>
        public static bool IsValid(string value, TypeIpVersion version = TypeIpVersion.Any, bool allowPrefix = false)
        {
            return Normalize(value, version, allowPrefix) is not null;
        }

        /// <summary>
        /// Checks an address and tells what is wrong with it, so a form can say more than "invalid".
        /// </summary>
        /// <param name="value">The address as written.</param>
        /// <param name="version">The version the address must belong to.</param>
        /// <param name="allowPrefix">Whether a prefix length is accepted.</param>
        /// <param name="normalized">The normalized address, or null if it is not accepted.</param>
        /// <returns>What is wrong with the address, or <see cref="IpAddressError.None"/>.</returns>
        public static IpAddressError Check(string value, TypeIpVersion version, bool allowPrefix, out string normalized)
        {
            normalized = null;
            var text = value?.Trim();
            if (string.IsNullOrEmpty(text))
            {
                return IpAddressError.Invalid;
            }

            string prefix = null;
            var slash = text.IndexOf('/');
            if (slash >= 0)
            {
                prefix = text[(slash + 1)..];
                text = text[..slash];
            }

            string address;
            int maxPrefix;
            TypeIpVersion found;
            if (Version4().IsMatch(text))
            {
                address = text;
                maxPrefix = 32;
                found = TypeIpVersion.Version4;
            }
            else if (text.Contains(':') && !text.Contains('%')
                && IPAddress.TryParse(text, out var parsed) && parsed.AddressFamily == AddressFamily.InterNetworkV6)
            {
                address = parsed.ToString();
                maxPrefix = 128;
                found = TypeIpVersion.Version6;
            }
            else
            {
                return IpAddressError.Invalid;
            }

            if (version != TypeIpVersion.Any && version != found)
            {
                return version == TypeIpVersion.Version4 ? IpAddressError.NotVersion4 : IpAddressError.NotVersion6;
            }

            if (prefix is not null)
            {
                if (!allowPrefix)
                {
                    return IpAddressError.PrefixNotAllowed;
                }

                if (!PrefixLength().IsMatch(prefix)
                    || !int.TryParse(prefix, NumberStyles.None, CultureInfo.InvariantCulture, out var length)
                    || length > maxPrefix)
                {
                    return IpAddressError.Prefix;
                }

                address += "/" + prefix;
            }

            normalized = address;

            return IpAddressError.None;
        }
    }

    /// <summary>
    /// What is wrong with an address, as <see cref="IpAddress.Check"/> tells it.
    /// </summary>
    public enum IpAddressError
    {
        /// <summary>
        /// The address is accepted.
        /// </summary>
        None,

        /// <summary>
        /// The text is no IP address.
        /// </summary>
        Invalid,

        /// <summary>
        /// The address is valid, but an IPv4 address is required.
        /// </summary>
        NotVersion4,

        /// <summary>
        /// The address is valid, but an IPv6 address is required.
        /// </summary>
        NotVersion6,

        /// <summary>
        /// The prefix length is no number or exceeds the length of the address.
        /// </summary>
        Prefix,

        /// <summary>
        /// The address carries a prefix length where none is accepted.
        /// </summary>
        PrefixNotAllowed
    }
}
