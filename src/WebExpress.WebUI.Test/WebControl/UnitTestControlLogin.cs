using Microsoft.AspNetCore.WebUtilities;
using System.Text.Json;
using System.Xml.Linq;
using WebExpress.WebCore.WebIdentity;
using WebExpress.WebCore.WebSetting;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the login control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlLogin
    {
        /// <summary>
        /// Exposes only application-scoped public provider data and keeps retry destinations free of previous errors.
        /// </summary>
        /// <param name="destination">The optional destination configured by the application.</param>
        /// <param name="expectedDestination">The local destination that the provider link must contain.</param>
        [Theory]
        [InlineData(null, "/login?lang=de")]
        [InlineData("https://localhost/workspace?view=mine", "/workspace?view=mine")]
        [InlineData("https://other.test/workspace", "/login?lang=de")]
        public void ExternalProvidersAreScopedAndDoNotExposeCredentials(string destination, string expectedDestination)
        {
            // arrange
            var hub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = hub.ApplicationManager.Applications.First();
            using var provider = new LoginProvider("company", "Company SSO");
            using var otherProvider = new LoginProvider("other", "Other application");
            hub.IdentityProviderManager.Register(provider, application);
            hub.IdentityProviderManager.Register(otherProvider, new WebExpress.WebCore.WebApplication.ApplicationContext());
            var request = UnitTestControlFixture.CreateRequestMock("GET /login?lang=de&wx-auth-error=old HTTP/1.1\r\nCookie:\r\n\r\n",
                "https://localhost/login?lang=de&wx-auth-error=old");
            var context = new RenderControlContext(null, UnitTestControlFixture.CreatePageContextMock(application), request);
            var tree = new VisualTreeControl(hub, context.PageContext);
            var control = new ControlLogin { RedirectUri = _ => destination is null ? null : new UriEndpoint(destination) };

            // act
            var html = control.Render(context, tree).ToString();
            var element = XElement.Parse(html);
            using var metadata = JsonDocument.Parse(element.Attribute("data-external-logins").Value);
            var entry = metadata.RootElement.EnumerateArray().Single();
            var uri = entry.GetProperty("uri").GetString();
            var query = QueryHelpers.ParseQuery(uri[uri.IndexOf('?')..]);

            // validation
            Assert.Equal(QueryHelpers.AddQueryString("/api/auth/login", "application", application.ApplicationId),
                element.Attribute("data-login-uri").Value);
            Assert.Equal("Company SSO", entry.GetProperty("label").GetString());
            Assert.Equal(application.ApplicationId, query["application"]);
            Assert.Equal("company", query["provider"]);
            Assert.Equal(expectedDestination, query["returnUrl"]);
            Assert.Equal("/login?lang=de", query["failureUrl"]);
            Assert.DoesNotContain("private-secret", html);
            Assert.DoesNotContain("Other application", html);
            Assert.Equal("true", element.Attribute("data-auth-error").Value);
        }

        /// <summary>
        /// Reopens the framed login after external cancellation so the retry message is visible.
        /// </summary>
        [Fact]
        public void ExternalFailureReopensLoginModal()
        {
            // arrange
            var hub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var request = UnitTestControlFixture.CreateRequestMock("GET /login?wx-auth-error=authentication_failed HTTP/1.1\r\nCookie:\r\n\r\n");
            var context = new RenderControlContext(null, UnitTestControlFixture.CreatePageContextMock(), request);
            var tree = new VisualTreeControl(hub, context.PageContext);

            // act
            var html = new ControlModalLogin("login").Render(context, tree).ToString();

            // validation
            Assert.Contains("data-auto-show=\"true\"", html);
            Assert.Contains("data-auth-error=\"true\"", html);
        }

        /// <summary>
        /// Supplies a configured provider without contacting an external service while rendering controls.
        /// </summary>
        private sealed class LoginProvider : OpenIdConnectIdentityProvider
        {
            /// <summary>
            /// Associates a public label with private credentials to test the rendering boundary.
            /// </summary>
            /// <param name="id">The provider selection key.</param>
            /// <param name="label">The public login label.</param>
            public LoginProvider(string id, string label) : base(new OpenIdConnectSettings
            {
                ProviderId = id, DisplayName = label, Authority = "https://identity.test", ClientId = "client",
                ClientSecret = "private-secret", RedirectUri = "https://localhost/api/auth/callback"
            })
            {
            }
        }

        /// <summary>
        /// Tests the id property of the login control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-login""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-login""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-webui-login""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLogin(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the username property of the login control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-login""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-login"" data-username=""abc""></div>")]
        public void Username(string login, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLogin()
            {
                Username = _ => login
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the login control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-login""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-login"" data-title=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-login"" data-title=""WebExpress.WebUI""></div>")]
        public void Title(string title, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLogin()
            {
                Title = _ => title
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
