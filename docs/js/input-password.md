![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# InputPasswordCtrl

The `InputPasswordCtrl` component provides a password input field with an integrated toggle button that allows the user to reveal or hide the entered password. The control manages a hidden input for form submission and a visible input whose type switches between `password` and `text` depending on the current visibility state. A Font Awesome eye icon inside the toggle button reflects the current state. The component is fully configurable via `data-*` attributes on the host element and integrates cleanly into Bootstrap-styled forms.

```
   ┌────────────────────────────┬────────┐
   │ ••••••••                   │  👁   │
   └────────────────────────────┴────────┘
                                    ↕ toggles visibility
   ┌────────────────────────────┬────────┐
   │ mypassword                 │  🙈   │
   └────────────────────────────┴────────┘
```

## Configuration

The control is configured through `data-*` attributes and the `name` attribute on the host element:

| Attribute            | Description                                                                                      |
|----------------------|--------------------------------------------------------------------------------------------------|
| `name`               | The name used for the hidden input element, so the password value is submitted with a form.      |
| `data-name`          | Alternative to the `name` attribute when the attribute cannot be placed directly on the element. |
| `data-value`         | The initial password value. Defaults to an empty string if omitted.                              |
| `data-disabled`      | Set to `"true"` to disable both the password input and the toggle button.                        |
| `data-placeholder`   | Placeholder text displayed in the password input field when it is empty.                         |
| `data-minlength`     | Minimum number of characters required. Maps to the native `minlength` attribute.                 |
| `data-maxlength`     | Maximum number of characters allowed. Maps to the native `maxlength` attribute.                  |

All `data-*` configuration attributes are removed from the host element during initialization to keep the DOM clean.

## Functionality

The control renders an [Bootstrap input group](https://getbootstrap.com/docs/5.0/forms/input-group/) consisting of a password input and a toggle button:

- A **hidden input** (`<input type="hidden">`) is created with the configured `name` and keeps the submitted form value synchronized with the visible input at all times.
- The **visible input** starts as `<input type="password">` and is updated to `<input type="text">` when the user reveals the password.
- The **toggle button** uses a Font Awesome icon (`fa-eye` / `fa-eye-slash`) and fires the `render()` method on each click to update the input type and icon.
- Every keystroke in the visible input fires `CHANGE_VALUE_EVENT` with the current value as payload.
- The `data-disabled` flag disables both the input and the toggle button simultaneously.

## Programmatic Control

The component exposes a `value` property for reading and setting the password programmatically, and a `render()` method for manually refreshing the UI.

### Accessing an Automatically Created Instance

When instantiated by the framework, the instance can be retrieved and controlled from external code:

```javascript
// find the host element
var el = document.getElementById('password1');

// retrieve the controller instance created by the framework
var ctrl = webexpress.webui.Controller.getInstanceByElement(el);

// read the current password value
var current = ctrl ? ctrl.value : null;

// update the password value programmatically
if (ctrl) {
    ctrl.value = 'newSecretPassword';
}
```

### Manual Instantiation

The control can also be created entirely in JavaScript without prior HTML configuration:

```javascript
var el = document.getElementById('password-manual');
var ctrl = new webexpress.webui.InputPasswordCtrl(el);

// set an initial value after creation
ctrl.value = 'initialPassword';
```

## Events

The control dispatches the following framework event:

- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`** — fired on every `input` event of the visible password field. The `detail` object contains `{ value: '<current password>' }`.

Example listener:

```javascript
var el = document.getElementById('password1');
el.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, function (e) {
    console.log('password changed', e.detail ? e.detail.value : '');
});
```

## Use Case Example

Static HTML form integration:

```html
<form action="/login" method="post">
  <div id="password1"
       class="wx-webui-input-password"
       name="password"
       data-placeholder="Enter your password"
       data-minlength="8"
       data-maxlength="64"></div>

  <button type="submit">Log in</button>
</form>
```

Programmatic creation with an initial value and change handler:

```html
<div id="password-manual" class="wx-webui-input-password"></div>
<script>
  var el = document.getElementById('password-manual');
  var ctrl = webexpress.webui.Controller.getInstanceByElement(el);

  el.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, function (e) {
      console.log('password updated', e.detail ? e.detail.value : ctrl.value);
  });
</script>
```
