![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# PhoneCtrl

The `PhoneCtrl` component is a read-only display of a telephone number: the flag of its country followed by the number as a link that dials it (`tel:`). A number is kept in the international E.164 form (`+4930123456`), because that form dials from everywhere and names its country; the display sets the calling code apart (`+49 30123456`).

```text
   [■] +49 30123456
```

## Configuration

| Attribute    | Description                                                                  | Example                       |
|--------------|------------------------------------------------------------------------------|-------------------------------|
| `data-value` | The number, international. Without it, the text content of the host is read. | `data-value="+4930123456"`    |

## Functionality

- **Numbering plans**: `webexpress.webui.PhoneCatalog` holds the calling code, the national prefix and the possible lengths of the national number for every country with a flag. The server keeps the same table in `PhoneCatalog`; a test holds the two equal. The data is taken from the metadata of [libphonenumber-js](https://gitlab.com/catamphetamine/libphonenumber-js) (MIT).
- **Shared calling codes**: Countries sharing a calling code - the members of +1, +7, +44 and a few more - are told apart as libphonenumber does it: in the order of the metadata, the main country first, each by its leading digits or the patterns of its number types. So `+1 416 ...` shows the flag of Canada and `+1 242 ...` the flag of the Bahamas. As the patterns overlap - the Cocos Islands dial australian mobile numbers - `PhoneCatalog.fits(value, country)` tells whether a number may belong to a country, beyond the one country `country(value)` names.
- **Read-Only**: The component creates no form field. A number the user enters belongs in a `ControlFormItemInputPhone`.

## Programmatic Control

```javascript
const ctrl = webexpress.webui.Controller.getInstanceByElement(document.getElementById('hotline'));
ctrl.value = '+44 20 7946 0000';          // announces CHANGE_VALUE_EVENT

const P = webexpress.webui.PhoneCatalog;
P.normalize('030 123456', 'DE');          // "+4930123456"
P.country('+14165551234');                // "CA"
P.format('+4930123456');                  // "+49 30123456"
```

# InputPhoneCtrl

The `InputPhoneCtrl` component is the phone field: a button with the flag and calling code of the chosen country, beside a field for the national number. The button opens a menu of the countries with a filter that finds a country by its name or its calling code.

```text
   ┌──────────────┬────────────────────────┐
   │ [■] +49  [v] │ 30 123456              │
   └──────────────┴────────────────────────┘
```

| Attribute         | Description                                                                                                  |
|-------------------|--------------------------------------------------------------------------------------------------------------|
| `id`, `name`      | Moved onto the hidden input that posts the value.                                                            |
| `data-value`      | The number. An international number selects its country.                                     |
| `data-country`    | The country an empty field starts in. Without it, the region of the page language (`de-AT` → Austria).      |
| `placeholder`     | The text of the empty number field.                                                                          |
| nested options    | `<div class="wx-selection-item" id="DE" data-label="Germany">` elements limit and name the countries offered; without them every country with a numbering plan is offered, named by the browser. |

- **Value**: The value is the E.164 form of the country and the national number. A national number typed with its national prefix (`030 ...` in Germany) loses the prefix; Italy, whose numbers keep their leading zero, keeps it. A number typed or pasted with `+` or `00` selects its country itself.
- **Validation**: `validate()` reports a number that fits no numbering plan, and one that fits none of the countries offered. A number fitting several countries of its calling code is read in the chosen one where it fits it, so a field offering only the Cocos Islands keeps an australian mobile number there. The server checks the same rules and passes the E.164 form to the page.
- **Changing the country** keeps the national number and reads it in the new country.

```csharp
new ControlFormItemInputPhone("phone")
{
    Label = _ => "Phone",
    Country = _ => "DE",
    Countries = _ => ["AT", "CH", "DE"]
};
```

# Table Template

The `phone` template shows the flag and dials the number of a cell read-only, and edits it with the phone field (`data-editable`, `data-country`, `data-placeholder`). On the server it is `ControlTableTemplatePhone`, in a REST table `RestApiTableColumnTemplatePhone`.

```html
<template data-type="phone" data-editable="true" data-country="DE"></template>
```

## Optional Display Flag

For the display control, the country flag is enabled by default. Set `data-show-flag="false"` on the host element to omit it while preserving the text and, for phone numbers, the telephone link. The setting also applies after changing the value from script.

On the server, configure `ControlPhone.ShowFlag` with a render-context function such as `ShowFlag = _ => false`. A missing function retains the enabled default.
