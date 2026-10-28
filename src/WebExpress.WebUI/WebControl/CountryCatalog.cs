using System;
using System.Collections.Generic;
using System.Collections.Frozen;
using System.Globalization;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The countries the framework ships a flag and a name for. A country is named by its
    /// ISO 3166-1 alpha-2 code, which is what a form posts and a page stores, because a code
    /// stays the same in every language while the name does not. The list is fixed to the
    /// flags under Assets/flags, so a code accepted here always has a drawing to show.
    /// </summary>
    public static class CountryCatalog
    {
        private static readonly FrozenSet<string> _known = new[]
        {
            "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR",
            "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE",
            "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ",
            "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD",
            "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR",
            "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
            "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI",
            "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
            "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS",
            "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU",
            "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
            "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
            "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK",
            "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
            "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ",
            "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
            "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU",
            "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
            "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS",
            "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI",
            "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV",
            "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK",
            "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA",
            "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
            "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
        }.ToFrozenSet(StringComparer.Ordinal);

        /// <summary>
        /// Returns the codes of all known countries in upper case.
        /// </summary>
        public static IEnumerable<string> Codes => _known.Order(StringComparer.Ordinal);

        /// <summary>
        /// Brings a code into the upper-case form the catalog keys on. A code that names no
        /// known country yields null, so a caller cannot render a flag that does not exist.
        /// </summary>
        /// <param name="code">The code in any letter case, surrounding blanks allowed.</param>
        /// <returns>The upper-case code, or null for an unknown or empty code.</returns>
        public static string Normalize(string code)
        {
            var normalized = code?.Trim().ToUpperInvariant();

            return normalized is not null && _known.Contains(normalized)
                ? normalized
                : null;
        }

        /// <summary>
        /// Determines whether the code names a known country, regardless of letter case.
        /// </summary>
        /// <param name="code">The code to check.</param>
        /// <returns>True if a flag and a name exist for the code.</returns>
        public static bool IsKnown(string code)
        {
            return Normalize(code) is not null;
        }

        /// <summary>
        /// Returns the name of a country in the language of the request. Without a translation
        /// the code itself is returned, which still identifies the country unambiguously.
        /// </summary>
        /// <param name="renderContext">The context that carries the language of the request.</param>
        /// <param name="code">The code of the country.</param>
        /// <returns>The localized name, the code without a translation, or null for an unknown code.</returns>
        public static string GetName(IRenderControlContext renderContext, string code)
        {
            return GetName(code, key => I18N.Translate(renderContext, key));
        }

        /// <summary>
        /// Returns the name of a country in the given language, for callers such as a rest
        /// endpoint that hold the culture of the request but no render context.
        /// </summary>
        /// <param name="culture">The language of the name.</param>
        /// <param name="code">The code of the country.</param>
        /// <returns>The localized name, the code without a translation, or null for an unknown code.</returns>
        public static string GetName(CultureInfo culture, string code)
        {
            return GetName(code, key => I18N.Translate(culture, key));
        }

        /// <summary>
        /// Looks up the name of a country through the given translation.
        /// </summary>
        /// <param name="code">The code of the country.</param>
        /// <param name="translate">Translates an internationalization key.</param>
        /// <returns>The localized name, the code without a translation, or null for an unknown code.</returns>
        private static string GetName(string code, Func<string, string> translate)
        {
            var normalized = Normalize(code);
            if (normalized is null)
            {
                return null;
            }

            var key = $"webexpress.webui:country.{normalized.ToLowerInvariant()}";
            var name = translate(key);

            return string.IsNullOrWhiteSpace(name) || name == key
                ? normalized
                : name;
        }

        /// <summary>
        /// Narrows the catalog to the given codes. Null offers every country; unknown codes
        /// and duplicates are dropped, so a caller never offers a country without a flag.
        /// </summary>
        /// <param name="countries">The codes to offer, in any letter case, or null for all.</param>
        /// <returns>The upper-case codes offered.</returns>
        public static IEnumerable<string> Restrict(IEnumerable<string> countries)
        {
            return countries is null
                ? Codes
                : countries.Select(Normalize).Where(x => x is not null).Distinct();
        }

        /// <summary>
        /// Renders countries as the option elements the client's selection reads, named and
        /// sorted in the language of the request, each with its flag as icon. The form input
        /// and the table template share them, so a country reads the same in both.
        /// </summary>
        /// <param name="renderContext">The context that carries the language of the request.</param>
        /// <param name="codes">The normalized codes to render.</param>
        /// <returns>The option elements.</returns>
        public static IEnumerable<IHtmlNode> RenderOptions(IRenderControlContext renderContext, IEnumerable<string> codes)
        {
            var culture = renderContext?.Request?.Culture ?? CultureInfo.CurrentUICulture;
            var comparer = StringComparer.Create(culture, CompareOptions.IgnoreCase);

            // the selection keys its options on their ids, so the code is the id
            return codes
                .Select(x => (Code: x, Name: GetName(renderContext, x)))
                .OrderBy(x => x.Name, comparer)
                .Select(x => new HtmlElementTextContentDiv()
                {
                    Id = x.Code,
                    Class = "wx-selection-item"
                }
                    .AddUserAttribute("data-label", x.Name)
                    .AddUserAttribute("data-icon", GetFlagClass(x.Code)));
        }

        /// <summary>
        /// Returns the css classes that draw the flag of a country. The flags are background
        /// images of webexpress.webui.country.css, whose relative urls resolve against the
        /// stylesheet itself, so neither the server nor the client needs to know where the
        /// application mounts its assets.
        /// </summary>
        /// <param name="code">The code of the country.</param>
        /// <returns>The css classes, or null for an unknown code.</returns>
        public static string GetFlagClass(string code)
        {
            var normalized = Normalize(code);

            return normalized is null
                ? null
                : $"wx-flag wx-flag-{normalized.ToLowerInvariant()}";
        }
    }
}
