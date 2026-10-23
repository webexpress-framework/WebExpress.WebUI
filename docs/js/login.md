# Login controls

The login controls provide credential fields and browser navigation to registered OpenID Connect providers. `ControlLogin`, `ControlModalLogin`, `ControlDataLogin`, and `ControlDataModalLogin` use the same external login rendering. The provider list is scoped to the page's application and contains only public labels and authorization links.

Persistence selection uses a switch labelled "Stay signed in" that is enabled by default. Credential requests send `rememberMe` as a JSON boolean. External login links send the same choice to the authorization endpoint, which binds it into the signed correlation cookie. Disabling the switch issues session cookies without an expiration attribute. Refresh tokens retain the signed choice during rotation, and logout deletes both cookie types. Persistent cookies remain bounded by the configured refresh lifetime. Browser session restoration may retain session cookies according to browser settings.

Credential submission in `ControlLogin` uses the application-scoped `/api/auth/login` endpoint with the framework authentication header. `ControlDataLogin` uses its configured REST service. Both paths apply the same persistence semantics.

Provider configuration uses `OpenIdConnectSettings.DisplayName` as the button label, with `ProviderId` as the fallback. The display name can be an internationalization key. Register the provider with `IdentityProviderManager` for the application that owns the login page. Rendering does not contact the identity provider and never includes its client secret.

Browser navigation uses `RedirectUri` as the destination after successful authentication. A control without an explicit destination returns to its current page, including the originally requested protected page when WebApp presents an authentication prompt. Root-relative destinations and absolute destinations on the current origin are accepted by the control. A destination on another origin falls back to the current page.

Authorization starts with a normal browser navigation to `/api/auth/authorize`, including `application`, `provider`, `returnUrl`, and `failureUrl`. The endpoint accepts only bounded root-relative destinations. The provider stores both destinations in the signed correlation cookie alongside state, nonce, and the PKCE verifier. The registered OIDC `RedirectUri` remains the fixed HTTPS callback URL containing the application and provider identifiers.

Callback processing validates the authorization code before issuing the existing protected authentication cookies. A successful browser flow redirects to the destination from the signed challenge. Callback query parameters cannot replace that destination. Calls without a `returnUrl` retain the JSON authentication response.

Failure handling returns correlated browser failures to the original login page with a stable `wx-auth-error` query parameter. The control displays a translated generic retry message, and a login modal opens automatically. Provider descriptions and tokens are not reflected into the page. Missing or expired correlation cannot supply a trusted destination, so those requests receive the JSON error response instead of following caller-provided navigation.

Transport requirements remain unchanged. The authority and registered callback require HTTPS. External login links navigate the browser directly, so empty required username and password fields do not prevent external authentication.
