![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# DarkModeCtrl

The `DarkModeCtrl` component renders a toggle button that switches the page between light and dark mode. The current mode is applied by setting the `data-bs-theme` attribute on the root `<html>` element to `"dark"` or `"light"` (Bootstrap 5 convention) and is persisted in a cookie so it survives page reloads. Multiple instances on the same page stay in sync automatically.

```
   ┌──────────┐           ┌──────────┐
   │  🌙 Moon │  (light)  │  ☀ Sun  │  (dark)
   └──────────┘           └──────────┘
```

The module also exposes the singleton `webexpress.webui.DarkMode` so the current mode can be read and changed independently of any button instance.

## Configuration

Configuration is performed via dataset attributes on the host element. All attributes are consumed at construction time and then removed from the DOM.

| Attribute         | Description
|-------------------|----------------------------------------------------------------------------------------------
| `data-icon`       | Icon class used for both light and dark if neither `data-icon-light` nor `data-icon-dark` is set. Default is `fas fa-moon`.
| `data-icon-light` | Icon class shown while light mode is active. Defaults to the value of `data-icon`.
| `data-icon-dark`  | Icon class shown while dark mode is active. Default is `fas fa-sun`.
| `data-title`      | Tooltip text applied as the `title` attribute on the button.

The host element automatically receives the CSS classes `btn`, `wx-button`, and `wx-webui-darkmode-btn`. The button state is reflected via `aria-pressed` and `data-wx-darkmode-active`.

## Functionality

On construction the control reads the persisted mode from the cookie `wx_darkmode` (or `"light"` as the fallback), applies it to the document root, and synchronizes the button icon and ARIA attributes accordingly. When the button is clicked the mode is toggled, the new state is written to the cookie, and a `CHANGE_DARKMODE_EVENT` is dispatched on `document` so all other instances update themselves.

Cookie details:

| Property    | Value
|-------------|------------------------------
| Name        | `wx_darkmode`
| Values      | `"light"` or `"dark"`
| Expiry      | 365 days
| Path        | `/`
| SameSite    | `Strict`

Main behaviors:

- Reads the persisted mode on startup and applies it immediately to minimize flash of unstyled content (FOUC).
- Clicking the button toggles between `"light"` and `"dark"`, updates the icon, writes the cookie, and notifies other instances.
- An `<a>` element with `href="#"` is handled without page navigation (`preventDefault`).
- If `data-title` is set, the `title` attribute on the button is always kept in sync.

## Programmatic Control

### Accessing the Singleton

The `webexpress.webui.DarkMode` singleton is always available regardless of whether any button instance exists on the page:

```javascript
// read current mode ("light" or "dark")
const mode = webexpress.webui.DarkMode.current;

// set explicitly
webexpress.webui.DarkMode.set("dark");
webexpress.webui.DarkMode.set("light");

// toggle and get the resulting mode
const next = webexpress.webui.DarkMode.toggle();

// apply a mode to the DOM without persisting
webexpress.webui.DarkMode.apply("dark");
```

### Accessing an Automatically Created Instance

When the button is auto-initialized by the framework, the instance can be retrieved and re-rendered via the controller:

```javascript
const el = document.querySelector(".wx-webui-darkmode");
const ctrl = webexpress.webui.Controller.getInstanceByElement(el);

// force icon/ARIA sync with the current mode
if (ctrl) {
    ctrl.render();
}
```

### Manual Instantiation

```javascript
const btn = document.getElementById("my-darkmode-btn");
const ctrl = new webexpress.webui.DarkModeCtrl(btn);
```

### Singleton API Reference

| Method / Property        | Description
|--------------------------|----------------------------------------------------------------------------------------------
| `current` *(getter)*     | Returns the current mode string (`"light"` or `"dark"`).
| `set(mode)`              | Sets the mode, writes the cookie, applies to the DOM, and notifies listeners. Returns the normalized mode. No-op if the mode is already active.
| `toggle()`               | Toggles between `"light"` and `"dark"`. Returns the new mode.
| `apply(mode)`            | Applies the mode to `document.documentElement` without touching the cookie or firing events. Useful for server-side rendering or testing.

## Events

### Dispatched events

| Event                               | Dispatched on | Payload                   | When
|-------------------------------------|---------------|---------------------------|----------------------------------------------
| `CHANGE_VALUE_EVENT`                | button element| `{ value: "dark"|"light" }` | After each button click.
| `CHANGE_DARKMODE_EVENT`             | `document`    | `{ mode: "dark"|"light" }` | After each mode change via `set()` or `toggle()`.

### Listening for mode changes

Use `CHANGE_DARKMODE_EVENT` to react to any mode change (button click, programmatic call, or another instance):

```javascript
document.addEventListener(webexpress.webui.Event.CHANGE_DARKMODE_EVENT, (e) => {
    const mode = e.detail?.mode;
    console.log("Dark mode changed to:", mode);

    // example: swap a custom logo
    document.querySelector("#logo").src = mode === "dark" ? "/logo-dark.svg" : "/logo.svg";
});
```

Use `CHANGE_VALUE_EVENT` on the button element when you only need to react to direct user interaction with a specific button:

```javascript
const btn = document.querySelector(".wx-webui-darkmode");
btn.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, (e) => {
    console.log("Button toggled, new mode:", e.detail?.value);
});
```

## Use Case Examples

### Declarative usage — server-side control

The button is rendered by the C# `ControlButtonDarkmode` control and auto-initialized by the framework:

```html
<button type="button"
        class="wx-webui-darkmode"
        data-icon-light="fas fa-moon"
        data-icon-dark="fas fa-sun"
        data-title="Toggle dark mode">
    <i class="wx-webui-darkmode-icon"></i>
</button>
```

### Programmatic dark mode without a button

```javascript
// enable dark mode immediately (e.g., after user login preference is loaded)
webexpress.webui.DarkMode.set("dark");
```

### Listening and responding to mode changes

```javascript
document.addEventListener(webexpress.webui.Event.CHANGE_DARKMODE_EVENT, (e) => {
    document.querySelectorAll("canvas").forEach(canvas => {
        redrawChart(canvas, e.detail?.mode === "dark");
    });
});
```

### Custom icon configuration

```html
<button type="button"
        class="wx-webui-darkmode"
        data-icon-light="bi bi-brightness-high"
        data-icon-dark="bi bi-moon-stars-fill"
        data-title="Switch theme">
    <i></i>
</button>
```
