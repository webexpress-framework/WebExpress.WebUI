using System.Net;
using System.Globalization;
using WebExpress.WebCore.WebUri;
using System.Text.Json;
using System.Text.RegularExpressions;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Verifies the server boundary for application-owned consent configuration.
    /// </summary>
    public class UnitTestControlCookieBanner
    {
        /// <summary>
        /// Preserves each mode and inert application text in the browser configuration.
        /// </summary>
        /// <param name="mode">The configured operating mode.</param>
        /// <param name="expected">The corresponding browser mode.</param>
        [Theory]
        [InlineData(TypeCookieBannerMode.Notice, "notice")]
        [InlineData(TypeCookieBannerMode.Consent, "consent")]
        public void RenderConfiguration(TypeCookieBannerMode mode, string expected)
        {
            // arrange
            var control = new ControlCookieBanner("privacy")
            {
                Mode = _ => mode,
                StorageKey = _ => "application:privacy",
                Header = _ => "<script>\" & test</script>",
                Categories = _ => [new CookieBannerCategory { Id = "stats", Label = "Statistics" }]
            };

            // act
            var html = Render(control);
            var categories = ReadAttribute(html, "data-categories");
            using var config = JsonDocument.Parse(categories);

            // validation
            Assert.Contains("wx-webui-cookie-banner", html);
            Assert.Contains("&quot; &amp; test", html);
            Assert.DoesNotContain("data-cookie-config", html);
            Assert.Equal(expected, ReadAttribute(html, "data-mode"));
            Assert.Equal("application:privacy", ReadAttribute(html, "data-storage-key"));
            Assert.Equal("<script>\" & test</script>", ReadAttribute(html, "data-header"));
            Assert.False(config.RootElement[0].GetProperty("necessary").GetBoolean());
        }

        /// <summary>
        /// Keeps independently configured privacy settings and durations culture invariant.
        /// </summary>
        [Fact]
        public void RenderPrivacySettings()
        {
            // arrange
            var culture = CultureInfo.CurrentCulture;
            var control = new ControlCookieBanner
            {
                StorageKey = _ => "application:privacy",
                PrivacyUri = _ => new UriEndpoint("/privacy"),
                PrivacyLabel = _ => "Our privacy information",
                Lifetime = _ => TimeSpan.FromTicks(15000)
            };

            // act
            string html;
            try
            {
                CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("de-DE");
                html = Render(control);
            }
            finally
            {
                CultureInfo.CurrentCulture = culture;
            }

            // validation
            Assert.Equal("/privacy", ReadAttribute(html, "data-privacy-uri"));
            Assert.Equal("Our privacy information", ReadAttribute(html, "data-privacy-label"));
            Assert.Equal("1.5", ReadAttribute(html, "data-lifetime"));
        }

        /// <summary>
        /// Rejects ambiguous storage scopes before emitting a usable control.
        /// </summary>
        /// <param name="key">The invalid application storage key.</param>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData(" ")]
        public void RejectMissingScope(string key)
        {
            // arrange
            var control = new ControlCookieBanner { StorageKey = _ => key };

            // act
            var exception = Record.Exception(() => Render(control));

            // validation
            Assert.IsType<ArgumentException>(exception);
        }

        /// <summary>
        /// Prevents two purposes from silently sharing one permission identifier.
        /// </summary>
        [Fact]
        public void RejectDuplicateCategories()
        {
            // arrange
            var control = new ControlCookieBanner
            {
                StorageKey = _ => "application:privacy",
                Categories = _ =>
                [
                    new CookieBannerCategory { Id = "stats", Label = "First" },
                    new CookieBannerCategory { Id = "stats", Label = "Second" }
                ]
            };

            // act
            var exception = Record.Exception(() => Render(control));

            // validation
            Assert.IsType<ArgumentException>(exception);
        }

        /// <summary>
        /// Rejects lifetimes outside the supported browser timestamp range.
        /// </summary>
        /// <param name="days">The invalid lifetime in days.</param>
        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(3651)]
        public void RejectInvalidLifetime(int days)
        {
            // arrange
            var control = new ControlCookieBanner
            {
                StorageKey = _ => "application:privacy",
                Lifetime = _ => TimeSpan.FromDays(days)
            };

            // act
            var exception = Record.Exception(() => Render(control));

            // validation
            Assert.IsType<ArgumentException>(exception);
        }

        /// <summary>
        /// Reads preferences from actual request headers and rejects invalid browser payloads.
        /// </summary>
        /// <param name="scenario">The payload variation crossing the server boundary.</param>
        [Theory]
        [InlineData("allowed")]
        [InlineData("denied")]
        [InlineData("expired")]
        [InlineData("policy")]
        [InlineData("required")]
        [InlineData("unknown")]
        [InlineData("malformed")]
        [InlineData("missing")]
        public void ReadServerDecision(string scenario)
        {
            // arrange
            var control = new ControlCookieBanner
            {
                Mode = _ => TypeCookieBannerMode.Consent,
                StorageKey = _ => "server-test",
                Categories = _ => [new CookieBannerCategory { Id = "required", Label = "Required", Necessary = true },
                    new CookieBannerCategory { Id = "stats", Label = "Statistics" }]
            };
            var html = Render(control);
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var categories = new Dictionary<string, bool> { ["required"] = scenario != "required", ["stats"] = scenario != "denied" };
            if (scenario == "unknown") { categories["unknown"] = true; }
            var payload = JsonSerializer.Serialize(new
            {
                policy = scenario == "policy" ? "old" : ReadAttribute(html, "data-server-policy"),
                decidedAt = now - 10000,
                expiresAt = scenario == "expired" ? now - 1 : now + 60000,
                categories
            });
            var cookie = ReadAttribute(html, "data-cookie-name") + "=" +
                Uri.EscapeDataString(scenario == "malformed" ? "{" : payload);
            var request = UnitTestControlFixture.CreateRequestMock("GET / HTTP/1.1\r\nHost: localhost\r\n" +
                (scenario == "missing" ? "" : "Cookie: " + cookie + "\r\n") + "\r\n");
            var context = new RenderControlContext(null, UnitTestControlFixture.CreatePageContextMock(), request);

            // act
            var decision = control.GetDecision(context);

            // validation
            if (scenario is "allowed" or "denied")
            {
                Assert.NotNull(decision);
                Assert.True(decision.IsAllowed("required"));
                Assert.Equal(scenario == "allowed", decision.IsAllowed("stats"));
                Assert.False(decision.IsAllowed("unknown"));
                Assert.True(decision.ExpiresAt > decision.DecidedAt);
            }
            else
            {
                Assert.Null(decision);
            }
        }

        /// <summary>
        /// Reads encoded attributes without coupling assertions to attribute ordering.
        /// </summary>
        /// <param name="html">The rendered control markup.</param>
        /// <param name="name">The attribute to inspect.</param>
        /// <returns>The decoded attribute value.</returns>
        private static string ReadAttribute(string html, string name)
        {
            return WebUtility.HtmlDecode(Regex.Match(html, name + "=\"([^\"]*)\"").Groups[1].Value);
        }

        /// <summary>
        /// Uses the same render context as the existing control tests.
        /// </summary>
        /// <param name="control">The configured control under test.</param>
        /// <returns>The rendered HTML representation.</returns>
        private static string Render(ControlCookieBanner control)
        {
            var hub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            return control.Render(context, new VisualTreeControl(hub, context.PageContext)).ToString();
        }
    }
}
