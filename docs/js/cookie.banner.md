# Cookie banner

The cookie banner provides application-configured information and consent decisions. WebExpress supplies the control, persistence, accessible settings dialog and change notifications. Applications own their policy text, purposes and provider integrations.

## Server configuration

The C# control follows the contextual property pattern used by other WebUI controls. Each application must assign a unique storage key and use the same configuration on all pages sharing that key. Render one banner per policy on each page.

```csharp
new ControlCookieBanner("privacy")
{
    Mode = _ => TypeCookieBannerMode.Consent,
    StorageKey = _ => "my-application:privacy",
    Version = _ => "1",
    Lifetime = _ => TimeSpan.FromDays(180),
    Categories = _ =>
    [
        new CookieBannerCategory
        {
            Id = "necessary",
            Label = "Necessary",
            Description = "Required application functions.",
            Necessary = true
        },
        new CookieBannerCategory
        {
            Id = "statistics",
            Label = "Statistics",
            Description = "Optional application statistics."
        }
    ]
}
```

The operating mode determines what a decision means. `TypeCookieBannerMode.Notice`, the default, stores only an acknowledgement and never exposes category permissions. `TypeCookieBannerMode.Consent` provides accept-all, necessary-only and individual selection actions. Optional categories start disabled and necessary categories cannot be deselected.

The presentation can be configured through `Header`, `Text`, `PrivacyUri`, `PrivacyLabel` and `Theme`. Heading, explanatory text and category text accept server translation keys. Null heading and text use localized browser defaults. The privacy destination and its optional label appear in both the banner and the settings dialog. Standard actions are available in German and English. Privacy links accept HTTP, HTTPS and relative web destinations. Application text is rendered as inert text.

The configuration requires unique nonempty category identifiers and labels, a nonempty version and storage key, and a positive lifetime of at most 3650 days. The default lifetime is 180 days and is a technical default that applications should configure for their policy. Change `Version` whenever the purposes or policy change. Changes to category identifiers, required flags or mode also invalidate earlier decisions automatically.

## Browser integration

The controller is available through the regular WebUI instance lookup after controller initialization. `subscribe` immediately delivers the current decision, including a restored decision, so services registered after initialization do not miss their initial state.

```javascript
const element = document.getElementById("privacy");
const consent = webexpress.webui.Controller.getInstanceByElement(element);

// service activation and cleanup belong to the application
const unsubscribe = consent.subscribe(state => {
    if (state.categories.statistics === true) {
        statisticsService.start();
    } else {
        statisticsService.stop();
        statisticsService.clearData();
    }
});

// release the subscription when its application component is destroyed
unsubscribe();
```

The service integration must make activation and cleanup idempotent. Do not preload optional scripts, frames, pixels or provider resources before permission exists. WebExpress does not scan or intercept existing scripts or network traffic. A provider that cannot be stopped after loading needs an application-specific withdrawal strategy. This also applies to external cookies and data that browser JavaScript cannot remove.

The browser API exposes the following operations. Call decision-changing methods only in response to the visitor's explicit choice.

| Member | Purpose |
| --- | --- |
| `state` | Detached snapshot containing mode, decided, version, decidedAt, expiresAt and categories. |
| `isAllowed(id)` | Returns true only for a known permitted category. Notice mode always returns false. |
| `subscribe(callback)` | Delivers current state immediately and subsequent changes; returns an unsubscribe function. |
| `openSettings()` | Reopens the notice or the consent dialog without changing the decision. |
| `acceptAll()` | Records all configured purposes; notice mode records acknowledgement only. |
| `rejectOptional()` | Records a decision retaining only necessary purposes. |
| `saveSelection(ids)` | Records the selected category identifiers, always retaining necessary purposes. |
| `reset()` | Removes the current decision and immediately revokes optional permissions. |

The bubbling `webexpress.webui.cookie.change` event reports `detail.state` and `detail.reason`. Reasons are `selection`, `reset`, `expired` and `storage`. The event also includes the standard sender and id fields. Use `subscribe` when an initial snapshot is required, since construction does not announce a user decision.

## Persistence and lifetime

The decision uses the existing `webexpress.webui.LocalStorage` helper. Missing, damaged, expired or incompatible records are treated as no decision. Storage keys are origin-local, and distinct applications on the same origin must use distinct keys. LocalStorage is browser state, not a server authorization mechanism or an audit trail.

The runtime retains a decision on the current page if browser storage is unavailable. Persistence across navigation cannot be guaranteed in that situation; a decision that cannot be stored removes the earlier one, so the next visit asks again instead of restoring a withdrawn grant. Storage events synchronize other tabs on the same origin; a tab still showing an older policy version withdraws its own permissions when a newer version decides, but leaves that version's server cookie in place. expiry timers and visibility checks revoke expired permissions on open pages. The controller also mirrors valid decisions into an application-keyed cookie with Path=/, SameSite=Lax and Secure on HTTPS. The next HTTP request carries that preference to C#. Missing or blocked cookies and payloads exceeding 3800 encoded characters yield no server decision. Reset and expiry delete the cookie. No request is sent merely by changing the selection.

## Accessibility and tutorial

The initial banner is a labeled, nonmodal section that does not steal focus on page load. Settings use a native dialog with an explicit Tab cycle and browser-managed Escape cancellation. Buttons retain visible keyboard focus. A permanent button remains in the control host after a decision so visitors can revisit it. Place that host in a persistent location such as the page footer.

The WebUI tutorial provides separate Cookie banner and Notice pages configured entirely through C# controls. The consent example declares Necessary, Statistics and External media categories. Its standard event log displays the decision and category permissions after each selection. The tutorial requires no example-specific JavaScript and contacts no external provider.


## Declarative attributes

The renderer emits separate settings instead of a combined configuration object. The browser controller reads `data-mode`, `data-storage-key`, `data-version`, `data-lifetime` (milliseconds), `data-header`, `data-text`, `data-privacy-uri` and `data-privacy-label`. Only `data-categories` contains a JSON array of category objects with `id`, `label`, `description` and `necessary` fields. The former `data-cookie-config` attribute is not supported.

The necessary-only action uses the primary button style in both the initial banner and the settings dialog. Accept-all, settings, save and cancel retain the secondary style.

## Fragment integration

The `FragmentControlCookieBanner` base class exposes the same configuration properties as `ControlCookieBanner` and implements `IFragmentControl<ControlCookieBanner>`. Its render method checks the fragment conditions and identity policies before emitting the banner. Derive an application fragment, register it for the desired section and scope, and configure its storage key and privacy destination in the constructor.

The tutorial demonstrates this registration on the Cookie banner / Fragment page using `CookieBannerFragment` in `SectionBodySecondary`. Its dedicated scope prevents a second banner from appearing on the standalone control examples. The application-owned Privacy page supplies localized sample information and is linked through `SitemapManager.GetUri<Privacy>()` from the consent, notice and fragment examples. Applications replace that sample content with information matching their actual services.

## C# decision access

The control validates the cookie against its configured policy, category identifiers and expiration before exposing a snapshot. Configure the same control policy on each page that reads the decision. A missing, invalid or outdated record returns null, which differs from an explicit rejection of optional categories.

```csharp
var decision = banner.GetDecision(new RenderControlContext(renderContext));
var hasDecision = decision is not null;
var statisticsAllowed = decision?.IsAllowed("statistics") == true;
```

The result provides `Categories`, `DecidedAt`, `ExpiresAt` and `IsAllowed(id)`. The cookie is supplied by the browser and represents preferences, not authentication or proof of consent. C# reads the snapshot accompanying the current request. Reload or send a subsequent application request to observe a newly saved choice. The tutorial shows this round trip without custom JavaScript.
