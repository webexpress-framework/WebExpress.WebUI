using System;
using System.Linq;
using System.Text.RegularExpressions;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Reads the name of a domain account, as a directory such as Active Directory knows it: the
    /// down-level logon name DOMAIN\user or the user principal name user@domain.tld. The rules
    /// follow the limits of the directory - a NetBIOS domain of at most 15 characters, a logon
    /// name of at most 20 and none of the characters it reserves - so a name accepted here can be
    /// handed to a directory without failing on its form.
    /// </summary>
    public static partial class DomainLogon
    {
        private const int MaxNetBiosLength = 15;
        private const int MaxDnsLength = 255;
        private const int MaxLogonLength = 20;
        private const int MaxPrincipalPrefixLength = 64;

        // the characters a sAMAccountName must not contain; the at sign separates a principal name
        private const string ReservedUserCharacters = "\"/\\[]:;|=,+*?<>@";

        // the characters a NetBIOS domain name must not contain
        private const string ReservedDomainCharacters = "\\/:*?\"<>| ";

        [GeneratedRegex(@"^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", RegexOptions.CultureInvariant)]
        private static partial Regex DnsName();

        /// <summary>
        /// Splits an account name into its domain and its user.
        /// </summary>
        /// <param name="value">The account name as written.</param>
        /// <param name="domain">The domain, as written.</param>
        /// <param name="user">The user, as written.</param>
        /// <param name="format">The notation the name is written in.</param>
        /// <returns>True if the name is a valid account name in one of the notations.</returns>
        public static bool TryParse(string value, out string domain, out string user, out TypeDomainFormat format)
        {
            domain = user = null;
            format = TypeDomainFormat.Any;
            var trimmed = value?.Trim();

            if (string.IsNullOrEmpty(trimmed))
            {
                return false;
            }

            var backslash = trimmed.IndexOf('\\');
            if (backslash >= 0)
            {
                domain = trimmed[..backslash];
                user = trimmed[(backslash + 1)..];
                format = TypeDomainFormat.DownLevel;

                return IsDomain(domain) && IsUser(user, MaxLogonLength);
            }

            var at = trimmed.LastIndexOf('@');
            if (at >= 0)
            {
                user = trimmed[..at];
                domain = trimmed[(at + 1)..];
                format = TypeDomainFormat.Principal;

                return IsUser(user, MaxPrincipalPrefixLength)
                    && domain.Length <= MaxDnsLength
                    && DnsName().IsMatch(domain);
            }

            return false;
        }

        /// <summary>
        /// Completes a bare user name with a default domain and checks the result. A domain
        /// written with a dot is a DNS domain and makes a principal name; one without makes a
        /// down-level name, which is what a user typing only "jdoe" expects to sign in as.
        /// </summary>
        /// <param name="value">The account name as written.</param>
        /// <param name="defaultDomain">The domain for a bare user name. Can be null.</param>
        /// <returns>The trimmed, completed account name, or null if it is no valid account name.</returns>
        public static string Normalize(string value, string defaultDomain = null)
        {
            var trimmed = value?.Trim();
            if (string.IsNullOrEmpty(trimmed))
            {
                return null;
            }

            if (!trimmed.Contains('\\') && !trimmed.Contains('@') && !string.IsNullOrWhiteSpace(defaultDomain))
            {
                var domain = defaultDomain.Trim();
                trimmed = domain.Contains('.') ? $"{trimmed}@{domain}" : $"{domain}\\{trimmed}";
            }

            return TryParse(trimmed, out _, out _, out _) ? trimmed : null;
        }

        /// <summary>
        /// Determines whether a domain is a NetBIOS name or a DNS name a down-level name may carry.
        /// </summary>
        /// <param name="domain">The domain.</param>
        /// <returns>True if the domain is valid.</returns>
        private static bool IsDomain(string domain)
        {
            if (string.IsNullOrEmpty(domain) || domain.StartsWith('.'))
            {
                return false;
            }

            return domain.Contains('.')
                ? domain.Length <= MaxDnsLength && DnsName().IsMatch(domain)
                : domain.Length <= MaxNetBiosLength && !domain.Any(x => ReservedDomainCharacters.Contains(x) || char.IsControl(x));
        }

        /// <summary>
        /// Determines whether a user name keeps the limits of the directory.
        /// </summary>
        /// <param name="user">The user name.</param>
        /// <param name="maxLength">The longest name the notation allows.</param>
        /// <returns>True if the user name is valid.</returns>
        private static bool IsUser(string user, int maxLength)
        {
            return !string.IsNullOrEmpty(user)
                && user.Length <= maxLength
                && user.Trim() == user
                && !user.EndsWith('.')
                && !user.Any(x => ReservedUserCharacters.Contains(x) || char.IsControl(x));
        }
    }
}
