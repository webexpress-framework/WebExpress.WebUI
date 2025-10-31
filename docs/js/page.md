![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# InlinePageCtrl

The InlinePageCtrl is a lightweight component for embedding external HTML content into a regular container element, serving as a minimal alternative to iframes. It loads a target document via URI, extracts the content of a specified selector (default: `body`), and injects the markup into the host element. During the loading process, events are emitted before and after the request to signal status changes and enable UI reactions. A skeleton placeholder visualizes the loading state, while errors are displayed using a collapsible alert.

## Configuration

Initialization and behavior are controlled exclusively via `data-` attributes on the host element. The attributes are removed after reading to avoid leaking configuration into the DOM.

| Attribute         | Description
|-------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `data-uri`        | Absolute or relative URL of the resource to be loaded. If empty or missing, the container is cleared.                                                |
| `data-selector`   | CSS selector to extract from the loaded document. Default is `"body"`.                                                                              |
| `data-autoload`   | Controls automatic loading when the instance is created. Any value except `"false"` will trigger autoload. Default is `"true"` (not case-sensitive). |

Additional behavior:
- Requests use `fetch()` with `credentials: "same-origin"`.
- While loading, a skeleton placeholder is inserted (`placeholder`, `placeholder-glow`, and other utility classes).
- In case of errors, a collapsible error box is shown via `ExpandableCtrl` with internationalized texts.

## Functionality

During construction, `data-uri`, `data-selector`, and `data-autoload` are read and then removed from the host element. If autoload is enabled, `load()` is executed immediately.

The `load()` method first inserts a placeholder and emits `webexpress.webui.Event.DATA_REQUESTED_EVENT`. The resource is loaded using `fetch(this._uri, { credentials: "same-origin" })`. Upon a successful response, the HTML text is parsed, the desired area is determined via `this._selector` (fallback: `document.body`), and its `innerHTML` is transferred to the host element. Afterwards, `webexpress.webui.Event.DATA_ARRIVED_EVENT` is emitted.

If an error occurs (network error or `!response.ok`), the container is cleared and a collapsible error alert with headline, details, and stacktrace is shown. The alert uses i18n keys:
- `webexpress.webui:page.contentNotLoaded.label` (default: "Content could not be loaded.")
- `webexpress.webui:page.contentNotLoaded.details` (default: empty)

The class is registered under the key `"wx-webui-inline-page"` and can be automatically instantiated via `data-controller`.

## Programmatic Control

After initialization, the instance can be controlled using the API.

### Accessing an Automatically Created Instance

```html
<div id="my-inline" data-controller="wx-webui-inline-page"
     data-uri="/docs/partials/intro.html"
     data-selector="#content"
     data-autoload="true"></div>
```

```javascript
// find host element
const element = document.getElementById("my-inline");

// retrieve controller instance bound to the element
const inlineCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (inlineCtrl) {
    // update the uri and trigger an immediate reload
    inlineCtrl.setUri("/docs/partials/advanced.html", true);

    // reload current uri explicitly
    inlineCtrl.refresh();

    // listen to lifecycle events (scoped handling recommended)
    document.addEventListener(webexpress.webui.Event.DATA_REQUESTED_EVENT, function (e) {
        if (e && e.detail && e.detail.uri === "/docs/partials/advanced.html") {
            // handle start of fetch
        }
    });
    document.addEventListener(webexpress.webui.Event.DATA_ARRIVED_EVENT, function (e) {
        if (e && e.detail && typeof e.detail.response === "string") {
            // handle successful content arrival
        }
    });
}
```

### Manual Instantiation

```javascript
// create or select the host container
const container = document.createElement("div");
container.id = "dynamic-inline";
document.body.appendChild(container);

// create controller instance manually
const ctrl = new webexpress.webui.InlinePageCtrl(container);

// configure source and load content
ctrl.setUri("/pages/snippets/help.html", false);
ctrl.load();

// later: refresh or point to a different uri
if (ctrl) {
    ctrl.refresh();
    ctrl.setUri("/pages/snippets/faq.html", true);
}
```

## Events

InlinePageCtrl emits two core events to inform application state.

- `webexpress.webui.Event.DATA_REQUESTED_EVENT`: Emitted immediately before the network request starts.
  - Payload: `{ uri: string }`
- `webexpress.webui.Event.DATA_ARRIVED_EVENT`: Emitted after the host element is updated successfully.
  - Payload: `{ uri: string, response: string }` (raw HTML string from the response)

Note on event handling: For component-local reactions, it is recommended to check the target or payload to assign listeners to the correct host element.

## Example Usage

```html
<!--
    An inline container loading a section from an external page.
    The #article-content area of the loaded document will be displayed.
-->
<div id="article-view"
     data-controller="wx-webui-inline-page"
     data-uri="/articles/intro.html"
     data-selector="#article-content"
     data-autoload="true">
</div>
```

```javascript
// optionally: dynamic update of the target
const el = document.getElementById("article-view");
const instance = webexpress.webui.Controller.getInstanceByElement(el);

if (instance) {
    // swap to a different article on demand
    instance.setUri("/articles/deep-dive.html", true);
}
```

```html
<!--
    Error demo: invalid URL. InlinePageCtrl shows a collapsible error alert,
    including localized headline, icon, red alert styling, and stacktrace.
-->
<div id="broken-view"
     data-controller="wx-webui-inline-page"
     data-uri="/not/found.html"
     data-autoload="true">
</div>
```

```javascript
// optionally: react to loading start and finish
document.addEventListener(webexpress.webui.Event.DATA_REQUESTED_EVENT, function (e) {
    // show a global loader if required
});
document.addEventListener(webexpress.webui.Event.DATA_ARRIVED_EVENT, function (e) {
    // hide global loader, update breadcrumbs, etc.
});
```

```javascript
// security note: only embed trusted html or ensure server-side sanitization.
// scripts injected via innerHTML do not execute automatically.
```

```javascript
// styling note: the loading skeleton relies on utility classes like 'placeholder' and 'placeholder-glow'.
// if not present in your css stack, the markup renders unstyled but remains functional.
```

```javascript
// registration: the controller is available via the registry key "wx-webui-inline-page".
webexpress.webui.Controller.registerClass("wx-webui-inline-page", webexpress.webui.InlinePageCtrl);
```