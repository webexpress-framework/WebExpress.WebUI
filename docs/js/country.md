![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# CountryCtrl

The `CountryCtrl` component is a read-only display of a country: its flag followed by its name. A country is identified by its ISO 3166-1 alpha-2 code (`DE`, `FR`, `JP`, ...), which is what a page stores and a form posts, because the code stays the same in every language while the name does not. The server renders the name in the language of the request; the client keeps that text and only adds the flag the code selects.

```text
   [■] Germany
   [■] Japan
```

## Configuration

The component is configured declaratively using `data-` attributes. The text content of the host element is the name shown; without one, the browser names the country itself.

| Attribute        | Description                                                                                                                         | Example                    |
|------------------|-------------------------------------------------------------------------------------------------------------------------------------|----------------------------|
| `data-value`     | The ISO 3166-1 alpha-2 code of the country, in any letter case. It selects the flag. An invalid code leaves the display empty.       | `data-value="DE"`          |
| `data-show-name` | Set to `"false"` to show the flag alone. The name is then still read out by screen readers and shown as a tooltip.                   | `data-show-name="false"`   |
| `lang`           | The language a country set from script is named in. Falls back to the `lang` of the document and then to the browser's language.   | `lang="de"`                |

## Functionality

- **DOM Structuring**: Upon initialization, the component clears its host element, adds the `wx-country` class and injects a `<span>` holding the flag (`<i class="wx-flag wx-flag-de">`) and the name.
- **Flags**: The flags are SVG drawings shipped with the framework under `assets/flags`. The stylesheet `webexpress.webui.country.css` maps each code to its drawing through a `wx-flag-{code}` class, so a flag can be placed anywhere with the two classes `wx-flag wx-flag-{code}` - the country input uses the same classes for its options.
- **Names**: The name rendered by the server is kept as it is. A code set from script is named with the browser's `Intl.DisplayNames` in the language of the page.
- **Accessibility**: The flag is hidden from assistive technology, because the name beside it already says which country it is.
- **Read-Only**: The component does not create form fields. A country the user chooses belongs in a `ControlFormItemInputCountry`.

## Programmatic Control

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-country');

// retrieve the controller instance associated with the element
const countryCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (countryCtrl) {
    // the upper-case code of the country shown, or null
    const code = countryCtrl.value;

    // show another country; the flag and the name follow
    countryCtrl.value = 'fr';
}
```

Setting a new value announces it with `webexpress.webui.Event.CHANGE_VALUE_EVENT`; writing back the current value announces nothing.

### Manual Instantiation

```javascript
const container = document.getElementById('dynamic-country');
const dynamicCountryCtrl = new webexpress.webui.CountryCtrl(container);

dynamicCountryCtrl.value = 'JP';
```

## Use Case Examples

### Flag and Name

```html
<div id="my-country" class="wx-webui-country" data-value="DE">Germany</div>
```

### Flag Only

```html
<div class="wx-webui-country" data-value="JP" data-show-name="false">Japan</div>
```

# Country Input

There is no separate client control for choosing a country. The server control `ControlFormItemInputCountry` renders a regular [selection](selection.md) (`wx-webui-input-selection`) whose options are the countries, named and sorted in the language of the request, each with its flag as icon. Search, multiple selection and the keyboard therefore behave exactly as in the selection, and the value posted is the code - several codes separated by a semicolon when multiple selection is on.

```text
   ┌───────────────────────────┐
   │ [■] Germany            [v]│
   └─┬─────────────────────────┘
   ┌─┴─────────────────────────┐
   │ Search...                 │
   │ [■] France                │
   │ [■] Germany               │
   │ [■] Japan                 │
   └───────────────────────────┘
```

On the server, the input refuses a posted code that names no offered country, because the hidden field posts whatever a script puts there. `Countries` limits the offered countries, `Country` presets a choice, `MultiSelect` allows several and `Placeholder` sets the text shown while nothing is chosen.

```csharp
new ControlFormItemInputCountry("country")
{
    Label = _ => "Country",
    Country = _ => "DE",
    Countries = _ => ["AT", "CH", "DE"]
};
```

# Table Template

A table column shows countries through the `country` template. A cell holds the code, several separated by a semicolon; read-only it shows a `CountryCtrl` per code, editable it offers the same picker as the country input.

| Option / attribute     | Description                                                                                                   |
|------------------------|---------------------------------------------------------------------------------------------------------------|
| `data-editable`        | Set to `"true"` to edit the cell inline with the country picker.                                             |
| `data-multiselection`  | Set to `"true"` to let a cell hold several countries.                                                        |
| `data-show-name`       | Set to `"false"` to show the flags alone; the names remain as tooltips and for screen readers.               |
| `data-placeholder`     | The text an edited cell shows while it holds no country.                                                      |
| nested options         | The countries the picker offers, as `<div id="DE" data-label="Germany">` elements. A REST descriptor embeds them as the JSON string `options` (`[{ id, label }]`). Only an editable column carries them; a read-only cell, and a code without a label, is named by the browser in the language of the page. |

```html
<template data-type="country" data-editable="true">
    <div id="DE" class="wx-selection-item" data-label="Germany"></div>
    <div id="FR" class="wx-selection-item" data-label="France"></div>
</template>
```

On the server, `ControlTableTemplateCountry` renders this template; an editable one carries the countries named in the language of the request (`Countries` limits them, `MultiSelect`, `ShowName`, `Placeholder` and `Editable` set the options). A REST table declares it with `RestApiTableColumnTemplateCountry`; passing the culture of the request names the countries on the server, without it the browser names them in the language of the page.

```csharp
new ControlTableColumnTemplate("country", new ControlTableTemplateCountry() { Editable = _ => true });

// in a rest endpoint
new RestApiTableColumnTemplateCountry(editable: true, culture: request.Culture);
```

## Licence

The flag drawings are taken from [flag-icons](https://github.com/lipis/flag-icons) by Panayiotis Lipiridis, published under the MIT licence. See `THIRD-PARTY-NOTICES.md` in the repository root.

## Optional Display Flag

For the display control, the country flag is enabled by default. Set `data-show-flag="false"` on the host element to omit it while preserving the text and, for phone numbers, the telephone link. The setting also applies after changing the value from script.

On the server, configure `ControlCountry.ShowFlag` with a render-context function such as `ShowFlag = _ => false`. A missing function retains the enabled default.
