using Microsoft.AspNetCore.WebUtilities;
using System.Linq;
using System.Text.Json;
using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIdentity;
using WebExpress.WebCore.WebUri;
using WebExpress.WebCore;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a login control that renders a login interface as part of a web UI.
    /// </summary>
    public class ControlLogin : Control
    {
        /// <summary>
        /// Gets or sets the login name associated with the user.
        /// </summary>
        public Func<IRenderControlContext, string> Username { get; set; }

        /// <summary>
        /// Gets or sets the title of the login dialog.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the outline level of the title. On a page of its own the dialog is the
        /// page, so its title is a second-level heading by default; embedded under other
        /// headings it needs a deeper level to keep the outline in order.
        /// </summary>
        public Func<IRenderControlContext, int?> HeadingLevel { get; set; }

        /// <summary>
        /// Gets or sets the destination after authentication. OIDC accepts only destinations on the current origin.
        /// </summary>
        public Func<IRenderControlContext, IUri> RedirectUri { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlLogin(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The page and request that scope the available identity providers.</param>
        /// <param name="visualTree">The visual tree that owns the rendered control.</param>
        /// <returns>The login host with public, application-scoped provider links.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var username = Username?.Invoke(renderContext);
            var title = Title?.Invoke(renderContext);
            var headingLevel = HeadingLevel?.Invoke(renderContext);
            var application = renderContext.PageContext?.ApplicationContext;
            var providers = application is null ? [] : WebEx.ComponentHub?.IdentityProviderManager
                .GetProviders(application).OfType<OpenIdConnectIdentityProvider>().ToArray() ?? [];
            var currentUri = renderContext.Uri?.ToString();
            var failureUrl = LocalDestination(currentUri, currentUri) ?? "/";
            var returnUrl = LocalDestination(RedirectUri?.Invoke(renderContext)?.ToString(), currentUri) ?? failureUrl;
            var error = renderContext.Request?.GetParameter("wx-auth-error");

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-login", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
            }
                .AddUserAttribute("data-login-uri", application is null ? null :
                    QueryHelpers.AddQueryString("/api/auth/login", "application", application.ApplicationId))
                .AddUserAttribute("data-username", username)
                .AddUserAttribute("data-title", I18N.Translate(renderContext, title))
                .AddUserAttribute("data-heading-level", headingLevel?.ToString())
                .AddUserAttribute("data-external-logins", providers.Length == 0 ? null : JsonSerializer.Serialize(providers.Select(provider => new
                {
                    label = I18N.Translate(renderContext, provider.DisplayName),
                    uri = provider.CreateLoginUri(application, returnUrl, failureUrl)
                })))
                .AddUserAttribute("data-auth-error", error is null ? null : "true");
        }

        /// <summary>
        /// Converts same-origin absolute destinations into local paths and removes stale authentication errors.
        /// </summary>
        /// <param name="value">The configured destination or current request URI.</param>
        /// <param name="current">The request URI used to reject a different absolute origin.</param>
        /// <returns>The local destination, or null when the value does not belong to this origin.</returns>
        private static string LocalDestination(string value, string current)
        {
            if (string.IsNullOrEmpty(value)) { return null; }
            if (!value.StartsWith('/') && Uri.TryCreate(value, UriKind.Absolute, out var absolute) &&
                Uri.TryCreate(current, UriKind.Absolute, out var origin) &&
                absolute.GetLeftPart(UriPartial.Authority) == origin.GetLeftPart(UriPartial.Authority))
            {
                value = absolute.PathAndQuery + absolute.Fragment;
            }
            if (!OpenIdConnectIdentityProvider.IsLocalRedirectUri(value)) { return null; }
            var fragmentIndex = value.IndexOf('#');
            var fragment = fragmentIndex < 0 ? "" : value[fragmentIndex..];
            var pathAndQuery = fragmentIndex < 0 ? value : value[..fragmentIndex];
            var queryIndex = pathAndQuery.IndexOf('?');
            if (queryIndex < 0) { return value; }
            var query = QueryHelpers.ParseQuery(pathAndQuery[queryIndex..]);
            query.Remove("wx-auth-error");
            return QueryHelpers.AddQueryString(pathAndQuery[..queryIndex], query) + fragment;
        }
    }
}
