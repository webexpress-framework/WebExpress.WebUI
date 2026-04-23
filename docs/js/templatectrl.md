![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# TemplateCtrl

The `TemplateCtrl` is a declarative rendering component for DOM templates. It clones a `<template>` element, resolves placeholders against a model, applies conditional and list rendering, and maps template-specific attributes to WebExpress actions and bindings.

```
   ┌──────────────────────────────────────┐
   │ Host (.wx-webui-template)            │
   │   └─ <template>                      │
   │        ├─ {{placeholder}}            │
   │        ├─ data-if / data-if-not      │
   │        ├─ data-foreach               │
   │        └─ data-bind / data-action    │
   └──────────────────────────────────────┘
```

## Configuration

The control is configured via `data-` attributes on the host element and inside template nodes.

### Host Element Attributes

| Attribute       | Description | Example |
|-----------------|-------------|---------|
| `data-template` | Optional reference to a template id or `data-template-name`. If omitted, the first child `<template>` is used. | `data-template="person-template"` |
| `data-model`    | Initial model as JSON string. | `data-model='{"items":[{"name":"Aragorn"}]}'` |

### Template Node Attributes

> Note: `data-template` on the **host element** selects the root template source, while `data-template` on a **template node** includes/renders a nested template at that node.

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-foreach` | Repeats the node for each item in the referenced list. | `data-foreach="items"` |
| `data-if` | Renders node only if expression is truthy. | `data-if="isVisible"` |
| `data-if-not` | Renders node only if expression is falsy. | `data-if-not="isHidden"` |
| `data-if-empty` | Renders node only if expression is empty (`null`, `""`, empty list/object). | `data-if-empty="note"` |
| `data-if-not-empty` | Renders node only if expression is not empty. | `data-if-not-empty="name"` |
| `data-template` | Renders referenced nested template into current node. | `data-template="person-details"` |
| `data-template-context` | Defines model scope for nested template. | `data-template-context="detail"` |
| `data-bind` | Binds node value/text to model path. | `data-bind="name"` |
| `data-action` | Action alias mapped to `data-wx-primary-action`. | `data-action="frame"` |
| `data-action-param` | Action parameter mapped to `data-wx-primary-param`. | `data-action-param="{{id}}"` |
| `data-class-*` | Dynamic class toggling by expression. | `data-class-active="isActive"` |
| `data-style-*` | Dynamic inline style value by expression. | `data-style-color="color"` |
| `data-aria-*` | Dynamic aria attribute by expression. | `data-aria-label="name"` |

### Placeholders

Template text and attribute values can contain placeholders:

- `{{name}}`
- `{{role}}`
- `{{value}}`
- `{{$index}}`
- `{{$item.property}}`
- `{{$root.property}}`

## Programmatic Control

After initialization, the control instance can be accessed and updated through the central controller.

### Accessing an Automatically Created Instance

```javascript
const element = document.getElementById("people");
const templateCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (templateCtrl) {
    templateCtrl.setData({ items: [{ name: "Legolas", role: "Archer" }] });
    templateCtrl.updateData({ title: "Fellowship" });
    templateCtrl.setValue("items.0.name", "Gimli");
}
```

### Manual Instantiation

```javascript
const element = document.getElementById("dynamic-template");
const templateCtrl = new webexpress.webui.TemplateCtrl(element);
templateCtrl.setData({ value: "Hello Template" });
```

### API Reference

| Method / Property | Description |
|-------------------|-------------|
| `render()` | Renders template content into host element. |
| `model` (get/set) | Gets/sets the proxied model object. |
| `setData(data)` | Replaces the entire model and re-renders. |
| `updateData(partial)` | Merges partial properties into model. |
| `setValue(path, value)` | Sets model value by dot path (e.g. `items.0.name`). |

## Events

`TemplateCtrl` itself does not introduce a dedicated event set.  
Elements rendered from templates can trigger standard WebExpress events through mapped attributes such as:

- `data-action` → `data-wx-primary-action`
- `data-bind` for registered bind behaviors

## Use Case Example

```html
<div id="people"
     class="wx-webui-template"
     data-model='{"items":[{"id":1,"name":"Aragorn","role":"Ranger","active":true}]}'>
    <template>
        <article class="person" data-foreach="items" data-class-active="active">
            <h4 data-bind="name">{{name}}</h4>
            <small data-if-not-empty="role">{{role}}</small>
            <button data-action="frame" data-action-param="{{id}}">
                Open
            </button>
        </article>
    </template>
</div>
```
