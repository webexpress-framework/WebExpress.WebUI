![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# EmailCtrl

The `EmailCtrl` component is a read-only display of an e-mail address: an envelope followed by the address as a link that writes to it (`mailto:`). The server renders the address normalized - trimmed, with its domain in lower case - and an invalid address renders an empty display rather than a link that leads nowhere.

```text
   [@] grace.hopper@example.com
```

## Configuration

| Attribute    | Description                                                                 | Example                               |
|--------------|-----------------------------------------------------------------------------|---------------------------------------|
| `data-value` | The address. Without it, the text content of the host is read.              | `data-value="grace@example.com"`      |

## Functionality

- **Rule**: An address is valid by the rule browsers apply to an input of type email (WHATWG HTML), the rule the server shares in `EmailAddress`. The local part is at most 64 characters, the address at most 254.
- **Read-Only**: The component creates no form field. An address the user enters belongs in a `ControlFormItemInputEmail`.

## Programmatic Control

```javascript
const ctrl = webexpress.webui.Controller.getInstanceByElement(document.getElementById('contact'));

ctrl.value = 'ada@example.com';                          // announces CHANGE_VALUE_EVENT
const address = ctrl.value;                              // normalized address, or null
const valid = webexpress.webui.EmailCtrl.normalize(x);   // null for an invalid address
```

## Use Case Example

```html
<div class="wx-webui-email" data-value="grace@example.com">grace@example.com</div>
```

# E-mail Input

`ControlFormItemInputEmail` renders a native `<input type="email" autocomplete="email">`, so the browser offers the addresses it knows and checks the notation while the user types. The server applies the same rule, passes the normalized address to the page and, where `Domains` is set, accepts only addresses of those domains and their sub-domains.

```csharp
new ControlFormItemInputEmail("email")
{
    Label = _ => "E-mail",
    Domains = _ => ["example.com"]
};
```

# Table Template

The `email` template links the address of a cell read-only and edits it in an e-mail field (`data-editable`, `data-placeholder`). On the server it is `ControlTableTemplateEmail`, in a REST table `RestApiTableColumnTemplateEmail`.

```html
<template data-type="email" data-editable="true" data-placeholder="name@example.com"></template>
```
