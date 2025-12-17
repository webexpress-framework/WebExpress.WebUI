![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# InputCascadingCtrl

This document describes the `InputCascadingCtrl` component, which implements a multi-level cascading selection. The control reads a static options structure from the DOM hierarchy of `.wx-selection-item` elements, renders an `InputSelectionCtrl` per level, and ensures that when a selection is made at one level the immediate child options are loaded and displayed. The implementation is intended for declarative initialization in HTML and allows programmatic control via the associated controller instance.

```
     ┌──────────────┐
     │ Level 0     ▼│
     └──────────────┘
     ┌──────────────┐
     │ Level 1     ▼│
     └──────────────┘
     ┌──────────────┐
     │ Level ...   ▼│
     └──────────────┘
```

## Declarative configuration

The component is activated by a host element with the class `wx-webui-input-cascading`. Initial options are extracted from the host element’s direct `.wx-selection-item` children. Configuration elements:

| Attribute             | Description
|-----------------------|---------------------------------------------------
| `name`                | Name for the hidden input used for form submission.
| `placeholder`         | Placeholder text for each rendered InputSelection host.
| `data-multiselection` | Removed during internal setup; the component operates with single selection per level.

### Definition of an option node

A `.wx-selection-item` represents an option node within the hierarchical selection tree. Nodes may be nested to arbitrary depth. Each nesting level corresponds to a selection stage that is rendered as its own `InputSelection` element. A node without child elements is considered a terminal node.

| Attribute          | Description
|--------------------|-------------------------------------------------------------------------------
| `id`               | Unique identifier of the node (important for path formation and child lookup).
| `data-label`       | Visible label text (alternatively the element’s direct text node is used).
| `data-label-color` | Optional color class for the label.
| `data-icon`        | Optional icon class.
| `data-image`       | Optional image URL.
| `disabled`         | Presence indicates the element is disabled.

### Additional structural notes

The order of nodes determines the order of displayed options.

- Multiple child elements under a `.wx-selection-item` produce the next selection level.
- Empty nodes (without label and without children) should be avoided because they may cause inconsistent UI states.
- IDs must be unique across the entire tree, not only within a single level.
- Internally the component constructs a selection path such as `continent/europe/germany/berlin` based on the `id` attributes.

Example (declarative, HTML):

```html
<div class="wx-webui-input-cascading" name="location" placeholder="Please choose">
  <div class="wx-selection-item" id="country_de" data-label="Germany">
    <div class="wx-selection-item" id="state_by" data-label="Bavaria">
      <div class="wx-selection-item" id="city_muc" data-label="Munich"></div>
      <div class="wx-selection-item" id="city_nbg" data-label="Nuremberg"></div>
    </div>
  </div>
  <div class="wx-selection-item" id="country_us" data-label="USA">
    <div class="wx-selection-item" id="state_ca" data-label="California">
      <div class="wx-selection-item" id="city_sf" data-label="San Francisco"></div>
      <div class="wx-selection-item" id="city_la" data-label="Los Angeles"></div>
    </div>
  </div>
  <div class="wx-selection-item" id="country_at" data-label="Austria">
    <div class="wx-selection-item" id="state_v" data-label="Vorarlberg"></div>
  </div>
</div>
```

## Programmatic control

The controller instance is retrievable via the host element. The `value` accessor returns and sets the current path.

### Accessing an Automatically Created Instance

When the component is initialized declaratively through a host element with the class `wx-webui-input-cascading`, the corresponding controller instance can be retrieved programmatically. The controller exposes the current selection path through the value accessor and also allows updating it.

Example: obtain instance and set value.

```javascript
// retrieve controller instance from host element
const host = document.querySelector(".wx-webui-input-cascading");
const ctrl = webexpress.webui.Controller.getInstanceByElement(host);
if (ctrl) {
    // set a path by array of ids (single-selection-per-level enforced)
    ctrl.value = ["country_de", "state_by", "city_muc"];
    // set a path by semicolon-separated string
    ctrl.value = "country_de;state_by;city_muc";
    // clear selection
    ctrl.value = null;
}
```

### Manual Instantiation

Manual instantiation is useful when the component needs to be created dynamically in JavaScript and attached to an existing or newly constructed host element structure. It is important to note that the constructor parses the DOM hierarchy of the .wx-selection-item children at the moment the instance is created, so the desired structure must already exist before the controller instance is initialized.

Example:

```
// create host element and populate with selection items
const host = document.createElement("div");
host.classList.add("wx-webui-input-cascading");
host.setAttribute("name", "location");
host.setAttribute("placeholder", "Please choose");

// insert hierarchical .wx-selection-item nodes before instantiation
host.innerHTML = ''
  + '<div class="wx-selection-item" id="country_de" data-label="Germany">'
  + '  <div class="wx-selection-item" id="state_by" data-label="Bavaria">'
  + '    <div class="wx-selection-item" id="city_muc" data-label="Munich"></div>'
  + '    <div class="wx-selection-item" id="city_nbg" data-label="Nuremberg"></div>'
  + '  </div>'
  + '</div>'
  + '<div class="wx-selection-item" id="country_us" data-label="USA">'
  + '  <div class="wx-selection-item" id="state_ca" data-label="California">'
  + '    <div class="wx-selection-item" id="city_sf" data-label="San Francisco"></div>'
  + '    <div class="wx-selection-item" id="city_la" data-label="Los Angeles"></div>'
  + '  </div>'
  + '</div>'
  + '<div class="wx-selection-item" id="country_at" data-label="Austria">'
  + '  <div class="wx-selection-item" id="state_v" data-label="Vorarlberg"></div>'
  + '</div>';

// attach host to the document so that any measurements or rendering work
document.body.appendChild(host);

// instantiate the controller; constructor will parse the DOM and render level 0
const ctrl = new webexpress.webui.InputCascadingCtrl(host);

// programmatic operations after instantiation
if (ctrl) {
    // set selection path by array of ids
    ctrl.value = ["country_de", "state_by", "city_muc"];

    // or set by semicolon-separated string
    ctrl.value = "country_de;state_by;city_muc";

    // clear selection
    ctrl.value = null;
}

// listen for changes emitted by the control
host.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, function (e) {
    // handle path change
    console.log("current path:", e.detail.value);
});
```

## Events

The component dispatches standardized events to notify about changes.

- `webexpress.webui.Event.CHANGE_VALUE_EVENT`: Fired when the overall selection (path) changes. The event detail contains the current path as an array of ids.

Example of listening:

```javascript
// listen for path changes on the host element
host.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, function (e) {
    // detail.value contains array of selected ids
    console.log("current path:", e.detail.value);
});
```

## Use cases and styling

The component is suitable for selection chains such as country → state → city, category → subcategory → product, etc. Styling is applied via the usual CSS classes of the host element and the rendered InputSelection instances. Icons, images and label colors are taken from the data attributes of the `.wx-selection-item` nodes.

## Common causes & troubleshooting

If selecting an item at level 0 does not display level 1, common causes include:

- Missing or non-unique `id` attributes on `.wx-selection-item` nodes. The component uses `id` to resolve child nodes.
- Mismatch between the return formats of `InputSelectionCtrl` and the expected key values. Some implementations of `InputSelectionCtrl` return primitive values (e.g. strings) in the `value` array; others return objects like `{ value: "...", label: "..." }`. If only `id` fields are set without an additional `value` field in the option objects, later comparison logic may fail to correctly map the selection.

Recommendation: When setting the option objects on `InputSelectionCtrl`, ensure each option includes a `value` field, and normalize both shapes (primitive and object-with-value) when evaluating the selection. A possible correction example in vanilla JS:

```javascript
// example: build options for InputSelectionCtrl
const items = nodes.map(function (node) {
    return {
        // include value so the selection widget returns a comparable value
        value: node.id,
        id: node.id,
        label: node.label,
        labelColor: node.labelColor,
        icon: node.icon,
        image: node.image,
        content: node.content,
        disabled: node.disabled
    };
});

// example: normalize selection returned by selectionCtrl
// selectionCtrl.value might be e.g. ["country_de"] or [{ value: "country_de", label: "Germany" }]
function normalizeSelectedFirst(selectionValueArray) {
    // inline comment: normalize possible return shapes (primitive or object with value)
    if (selectionValueArray && selectionValueArray.length > 0) {
        const first = selectionValueArray[0];
        if (first && typeof first === "object" && ("value" in first)) {
            return first.value;
        }
        return first;
    }
    return null;
}
```
