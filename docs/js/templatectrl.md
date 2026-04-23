![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# TemplateCtrl

`TemplateCtrl` renders DOM templates against a JavaScript model.

## Host element

Use `wx-webui-template` on a container with a `<template>` child.

```html
<div id="people" class="wx-webui-template" data-model='{"items":[{"name":"Aragorn","role":"Ranger"}]}'>
    <template>
        <div class="person" data-foreach="items">
            <span data-bind="name">{{name}}</span>
            <small>{{role}}</small>
        </div>
    </template>
</div>
```

## Supported template features

- Placeholder replacement: `{{name}}`, `{{role}}`, `{{value}}`
- Conditions:
  - `data-if="path"`
  - `data-if-not="path"`
  - `data-if-empty="path"`
  - `data-if-not-empty="path"`
- List rendering: `data-foreach="items"`
- Nested template references:
  - `data-template="template-id-or-name"`
  - `data-template-context="path"`
- Dynamic attributes:
  - `data-class-<className>="expression"`
  - `data-style-<css-property>="expression"`
  - `data-aria-<aria-name>="expression"`
- Action mapping:
  - `data-action="actionName"` → `data-wx-primary-action`
  - `data-action-param="value"` → `data-wx-primary-param`
- Binding registration:
  - `data-bind="property"`

## Data model API

After initialization you can control the instance:

```javascript
const el = document.getElementById("people");
const ctrl = webexpress.webui.Controller.getInstanceByElement(el);

ctrl.setData({ items: [{ name: "Legolas", role: "Archer" }] });
ctrl.updateData({ title: "Fellowship" });
ctrl.setValue("items.0.name", "Gimli");
```

Model updates trigger automatic re-rendering and binding refresh.

## Registration

`TemplateCtrl` is auto-registered as:

```javascript
webexpress.webui.Controller.registerClass("wx-webui-template", webexpress.webui.TemplateCtrl);
```
