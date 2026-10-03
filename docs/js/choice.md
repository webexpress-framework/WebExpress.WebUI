![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# InputChoiceCtrl

The `InputChoiceCtrl` component offers a small, fixed set of mutually exclusive options as a row of buttons instead of folding them into a drop-down. It suits a field whose options are few and worth reading at a glance — a priority, a severity, a size — where the drop-down would hide exactly the information the user is comparing.

The selected value is stored in a hidden input, so the control submits like any other form field. Each option may carry an accent dot, which makes an ordered scale readable without reading the labels.

A second ability sets the control apart from a plain radio group: the visible options can be narrowed to the value of another input. One control can therefore carry the options of every context — the priorities of every class, for instance — and show only those of the context the user has chosen elsewhere in the form.

```
   ┌──────────────────────────────────────────────┐
   │ Priority                                     │
   │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
   │ │ ● P1 │ │ ● P2 │ │ ● P3 │ │ ● P4 │          │
   │ └──────┘ └──────┘ └══════┘ └──────┘          │
   └──────────────────────────────────────────────┘
```

## Configuration

Initialization is handled declaratively. The host element carries the class `wx-webui-input-choice`; each option is a child element with the class `wx-choice-option`.

### Host Attributes

| Attribute            | Description                                                                                          | Example
|----------------------|------------------------------------------------------------------------------------------------------|----------------------------------
| `name`               | The name the selected value is submitted under. The controller moves it onto the hidden input.       | `name="Priority"`
| `data-value`         | The initially selected value. A value no option carries is ignored.                                   | `data-value="P3"`
| `data-required`      | Marks the control as required. A hidden input is barred from native constraint validation, so the controller declares it through `data-wx-required` for the form controller instead. | `data-required="true"`
| `data-disabled`      | Renders every option disabled.                                                                        | `data-disabled="true"`
| `data-filter-source` | (Optional) The name of another input the visible options are narrowed to.                             | `data-filter-source="ClassId"`

### Option Attributes

| Attribute            | Description                                                                                          | Example
|----------------------|------------------------------------------------------------------------------------------------------|----------------------------------
| `data-value`         | The value the option submits.                                                                         | `data-value="P1 - Critical"`
| `data-description`   | (Optional) The longer wording of the option, shown as its tooltip.                                    | `data-description="System outage"`
| `data-color-css`     | (Optional) A CSS class for the accent dot in front of the label.                                      | `data-color-css="bg-danger"`
| `data-color-style`   | (Optional) An inline style for the accent dot, for a colour outside the palette.                      | `data-color-style="background-color: #dc3545"`
| `data-filter-value`  | (Optional) The value of the bound input this option belongs to. An option without one is always shown. | `data-filter-value="8f1e…"`

The text content of the option element becomes its label.

## Functionality

- **Segmented Selection**: The controller replaces the declared options with buttons and keeps the selected value in a hidden input carrying the declared name. Clicking the selected option again clears the selection.
- **Narrowing to Another Input**: When `data-filter-source` names an input, only the options whose `data-filter-value` equals the current value of that input remain visible; an option without a filter value is always shown. The bound input is usually written programmatically by another control, which raises no native change event, so the bubbling `CHANGE_VALUE_EVENT` is listened for as well.
- **No Stale Selection**: A selection the new filter no longer offers is dropped rather than submitted unseen. Setting a value also re-reads the filter first, so a value arriving together with the value it is filtered by does not depend on which of the two lands first.
- **Accessibility**: The option row is a `radiogroup`, each option a `radio` carrying `aria-checked`. The accent dot is decorative and adds no text.

## Events

| Event                    | Trigger                                | Detail
|--------------------------|----------------------------------------|--------------------------
| `CHANGE_VALUE_EVENT`     | The selection changed.                 | `{ value }`

## Programmatic Control

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('priority');

// retrieve the controller instance associated with the element
const choiceCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (choiceCtrl) {
    // read the selected value
    const current = choiceCtrl.value;

    // select an option programmatically; a value that is not offered clears the selection
    choiceCtrl.value = "P1 - Critical";
}
```

Note that a control which stores its value in a hidden input is registered against its
host element, not against that input. Resolve it from an input with
`webexpress.webui.Controller.getClosestInstance(input)`.

## Use Case Example

The following example offers four priorities, coloured from most to least severe, with the third one preselected.

```html
<div id="priority"
     class="wx-webui-input-choice"
     name="Priority"
     data-value="P3"
     data-required="true">

    <div class="wx-choice-option" data-value="P1" data-description="System outage"
         data-color-style="background-color: #dc3545">P1</div>
    <div class="wx-choice-option" data-value="P2" data-description="Severe degradation"
         data-color-style="background-color: #fd7e14">P2</div>
    <div class="wx-choice-option" data-value="P3" data-description="Moderate impact"
         data-color-style="background-color: #0d6efd">P3</div>
    <div class="wx-choice-option" data-value="P4" data-description="Minor issue"
         data-color-style="background-color: #6c757d">P4</div>
</div>
```

### Narrowing the Options to Another Input

Here the control carries the priorities of two classes and shows only those of the class selected elsewhere in the same form.

```html
<!-- written by another control, for example a tile picker -->
<input type="hidden" name="ClassId" value="" />

<div class="wx-webui-input-choice" name="Priority" data-filter-source="ClassId">
    <div class="wx-choice-option" data-value="Blocker" data-filter-value="cls-bug">Blocker</div>
    <div class="wx-choice-option" data-value="Minor"   data-filter-value="cls-bug">Minor</div>
    <div class="wx-choice-option" data-value="P1"      data-filter-value="cls-incident">P1</div>
    <div class="wx-choice-option" data-value="P4"      data-filter-value="cls-incident">P4</div>
</div>
```
