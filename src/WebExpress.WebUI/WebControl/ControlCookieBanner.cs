using System;
using System.Collections.Generic;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Linq;
using System.Text.Json;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Provides application-configured notices and consent choices without loading providers.
    /// </summary>
    public class ControlCookieBanner : Control
    {
        /// <summary>
        /// Gets or sets an explicit theme, otherwise the surrounding theme is inherited.
        /// </summary>
        public Func<IRenderControlContext, TypeTheme> Theme { get; set; }

        /// <summary>
        /// Gets or sets whether the control acknowledges a notice or collects consent.
        /// </summary>
        public Func<IRenderControlContext, TypeCookieBannerMode> Mode { get; set; }

        /// <summary>
        /// Gets or sets an application-specific storage key shared by its pages.
        /// </summary>
        public Func<IRenderControlContext, string> StorageKey { get; set; }

        /// <summary>
        /// Gets or sets the policy version whose changes invalidate earlier decisions.
        /// </summary>
        public Func<IRenderControlContext, string> Version { get; set; } = _ => "1";

        /// <summary>
        /// Gets or sets how long a decision remains valid. The default is 180 days.
        /// </summary>
        public Func<IRenderControlContext, TimeSpan> Lifetime { get; set; } = _ => TimeSpan.FromDays(180);

        /// <summary>
        /// Gets or sets the heading or translation key. Null selects the localized default.
        /// </summary>
        public Func<IRenderControlContext, string> Header { get; set; }

        /// <summary>
        /// Gets or sets the explanation or translation key. Null selects the mode-specific default.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the application-owned privacy information destination.
        /// </summary>
        public Func<IRenderControlContext, IUri> PrivacyUri { get; set; }

        /// <summary>
        /// Gets or sets the privacy link label or translation key. Null selects the localized default.
        /// </summary>
        public Func<IRenderControlContext, string> PrivacyLabel { get; set; }

        /// <summary>
        /// Gets or sets the purposes available in consent mode.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<CookieBannerCategory>> Categories { get; set; }

        /// <summary>
        /// Creates a control whose state is scoped explicitly by the application.
        /// </summary>
        /// <param name="id">The control identifier used for instance lookup.</param>
        public ControlCookieBanner(string id = null) : base(id)
        {
        }

        /// <summary>
        /// Emits encoded configuration for the browser controller without executing optional services.
        /// </summary>
        /// <param name="renderContext">The context used to resolve application configuration.</param>
        /// <param name="visualTree">The tree containing the control.</param>
        /// <returns>The host with safe serialized configuration.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var mode = Mode?.Invoke(renderContext) ?? TypeCookieBannerMode.Notice;
            var storageKey = StorageKey?.Invoke(renderContext);
            var version = Version?.Invoke(renderContext);
            var lifetime = Lifetime?.Invoke(renderContext) ?? TimeSpan.FromDays(180);
            var categories = Categories?.Invoke(renderContext)?.ToArray() ?? [];
            if (!Enum.IsDefined(mode) || string.IsNullOrWhiteSpace(storageKey) ||
                string.IsNullOrWhiteSpace(version) || lifetime <= TimeSpan.Zero || lifetime.TotalDays > 3650)
            {
                throw new ArgumentException("Cookie banner mode, storage key, version and a lifetime of at most 3650 days are required.");
            }
            if (categories.Any(x => x is null || string.IsNullOrWhiteSpace(x.Id) || string.IsNullOrWhiteSpace(x.Label)) ||
                categories.Select(x => x.Id).Distinct(StringComparer.Ordinal).Count() != categories.Length)
            {
                throw new ArgumentException("Cookie banner categories require unique identifiers and labels.");
            }

            var categorySettings = categories.Select(x => new
            {
                id = x.Id,
                label = I18N.Translate(renderContext, x.Label),
                description = I18N.Translate(renderContext, x.Description),
                necessary = x.Necessary
            });

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-cookie-banner", GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("data-wx-theme", (Theme?.Invoke(renderContext) ?? TypeTheme.None).ToValue())
                .AddUserAttribute("data-mode", mode == TypeCookieBannerMode.Consent ? "consent" : "notice")
                .AddUserAttribute("data-storage-key", storageKey)
                .AddUserAttribute("data-cookie-name", GetCookieName(renderContext))
                .AddUserAttribute("data-server-policy", GetPolicy(renderContext))
                .AddUserAttribute("data-version", version)
                .AddUserAttribute("data-lifetime", lifetime.TotalMilliseconds.ToString(CultureInfo.InvariantCulture))
                .AddUserAttribute("data-header", I18N.Translate(renderContext, Header?.Invoke(renderContext)))
                .AddUserAttribute("data-text", I18N.Translate(renderContext, Text?.Invoke(renderContext)))
                .AddUserAttribute("data-privacy-uri", PrivacyUri?.Invoke(renderContext)?.ToString())
                .AddUserAttribute("data-privacy-label", I18N.Translate(renderContext, PrivacyLabel?.Invoke(renderContext)))
                .AddUserAttribute("data-categories", JsonSerializer.Serialize(categorySettings));
        }
        /// <summary>
        /// Reads the browser decision accompanying this request, rejecting stale or malformed data.
        /// The result expresses a preference and must not be used as an authorization credential.
        /// </summary>
        /// <param name="renderContext">The request context and application policy configuration.</param>
        /// <returns>The validated decision, or null when no current decision accompanied the request.</returns>
        public CookieBannerDecision GetDecision(IRenderControlContext renderContext)
        {
            var values = renderContext.Request?.Header?.Cookies?
                .Where(x => x.Name == GetCookieName(renderContext)).ToArray();
            if (values is null || values.Length != 1 || values[0].Value.Length > 3800)
            {
                return null;
            }
            try
            {
                using var document = JsonDocument.Parse(Uri.UnescapeDataString(values[0].Value));
                var root = document.RootElement;
                if (root.GetProperty("policy").GetString() != GetPolicy(renderContext))
                {
                    return null;
                }
                var decidedAt = root.GetProperty("decidedAt").GetInt64();
                var expiresAt = root.GetProperty("expiresAt").GetInt64();
                var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var lifetime = Lifetime?.Invoke(renderContext) ?? TimeSpan.FromDays(180);
                if (decidedAt < 0 || decidedAt > now || expiresAt <= now || expiresAt <= decidedAt ||
                    expiresAt - decidedAt > lifetime.TotalMilliseconds)
                {
                    return null;
                }
                var configured = (Mode?.Invoke(renderContext) ?? TypeCookieBannerMode.Notice) == TypeCookieBannerMode.Consent
                    ? Categories?.Invoke(renderContext)?.ToArray() ?? [] : [];
                var categories = root.GetProperty("categories").EnumerateObject().ToArray();
                if (categories.Length != configured.Length || categories.Select(x => x.Name).Distinct().Count() != categories.Length ||
                    configured.Any(c => !categories.Any(x => x.Name == c.Id &&
                        (x.Value.ValueKind == JsonValueKind.True || (!c.Necessary && x.Value.ValueKind == JsonValueKind.False)))))
                {
                    return null;
                }
                return new CookieBannerDecision(DateTimeOffset.FromUnixTimeMilliseconds(decidedAt),
                    DateTimeOffset.FromUnixTimeMilliseconds(expiresAt),
                    categories.ToDictionary(x => x.Name, x => x.Value.GetBoolean(), StringComparer.Ordinal));
            }
            catch (Exception exception) when (exception is JsonException or InvalidOperationException or
                KeyNotFoundException or FormatException or ArgumentException)
            {
                return null;
            }
        }

        /// <summary>
        /// Derives a bounded cookie name shared across pages using the same storage key.
        /// </summary>
        /// <param name="renderContext">The context resolving the application storage scope.</param>
        /// <returns>A cookie token containing no application-supplied separators.</returns>
        private string GetCookieName(IRenderControlContext renderContext)
        {
            return "wx-consent-" + Convert.ToHexString(SHA256.HashData(
                Encoding.UTF8.GetBytes(StorageKey?.Invoke(renderContext) ?? ""))).ToLowerInvariant();
        }

        /// <summary>
        /// Binds browser preferences to the current policy without depending on translated labels.
        /// </summary>
        /// <param name="renderContext">The context resolving the current policy.</param>
        /// <returns>A stable fingerprint of the permission configuration.</returns>
        private string GetPolicy(IRenderControlContext renderContext)
        {
            var mode = Mode?.Invoke(renderContext) ?? TypeCookieBannerMode.Notice;
            var categories = mode == TypeCookieBannerMode.Consent
                ? Categories?.Invoke(renderContext)?.ToArray() ?? [] : [];
            var policy = JsonSerializer.Serialize(new
            {
                mode,
                version = Version?.Invoke(renderContext),
                lifetime = (Lifetime?.Invoke(renderContext) ?? TimeSpan.FromDays(180)).TotalMilliseconds,
                categories = categories.OrderBy(x => x.Id, StringComparer.Ordinal).Select(x => new { x.Id, x.Necessary })
            });
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(policy))).ToLowerInvariant();
        }
    }
}
