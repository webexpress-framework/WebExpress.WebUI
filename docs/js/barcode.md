![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# BarcodeCtrl

The `BarcodeCtrl` encodes a value as a scannable graphic - either as a linear symbology (Code 128, Code 39, EAN-13, EAN-8) or as a two-dimensional QR code.

The encoders are part of the control rather than a dependency, because a barcode has to be drawn offline and inside a strict content policy: no CDN, no external image service. Everything is rendered as inline SVG, which stays crisp at any size, prints without artefacts, and inherits the text color through `currentColor`.

```
   // linear (Code 128, Code 39, EAN-13, EAN-8)
   ┌──────────────────────────────────┐
   │  ▌▌ ▌ ▌▌▌ ▌ ▌▌  ▌▌▌ ▌ ▌▌ ▌ ▌▌▌   │
   │  ▌▌ ▌ ▌▌▌ ▌ ▌▌  ▌▌▌ ▌ ▌▌ ▌ ▌▌▌   │
   │  ▌▌ ▌ ▌▌▌ ▌ ▌▌  ▌▌▌ ▌ ▌▌ ▌ ▌▌▌   │
   │           4006381333931          │  ← the value, so it stays readable
   └──────────────────────────────────┘     when the symbol does not scan

   // matrix (QR)
   ┌───────────────┐
   │ ███ ▄▀▄▀ ███  │  ← finder patterns in three corners
   │ █ █ ▀▄█▀ █ █  │
   │ ███ █▄▀▄ ███  │
   │      ▀▄▀      │
   │ ▄▀█▄ ██▀ ▄██  │
   │ ███ ▀▄▀▄ ▀ █  │
   └───────────────┘
```

## Symbologies

| Value       | Symbology | Accepts                                                                 |
|-------------|-----------|-------------------------------------------------------------------------|
| `code128`   | Code 128  | The printable ascii range. The dense general purpose choice, and the default. |
| `code39`    | Code 39   | Digits, upper case letters and `-. $/+%`. Lower case is folded to upper case. Less dense than Code 128, but what many older scanners and label printers expect. |
| `ean13`     | EAN-13    | Thirteen digits. A missing check digit is computed, a supplied one is verified. |
| `ean8`      | EAN-8     | Eight digits, same check digit handling.                                 |
| `qr`        | QR code   | Any text, encoded as UTF-8 in byte mode. Versions 1 to 10, which spans a handful of digits up to roughly 270 bytes. |

A value the symbology cannot express is **refused**, not drawn: the control marks itself `wx-barcode-invalid`, states the problem and fires `DATA_ERROR_EVENT`. A symbol that renders but does not scan fails only at the scanner, which is later and worse.

## Configuration

The behavior is controlled entirely via `data-` attributes on the host element. They are removed after being read, so no configuration leaks into the DOM.

| Attribute       | Description
|-----------------|------------------------------------------------------------------------------------------
| `data-value`    | The value to encode. An empty value draws nothing.
| `data-type`     | The symbology, one of the values above. Default is `code128`.
| `data-level`    | The QR error correction level: `L` (~7% recoverable), `M` (~15%, the default), `Q` (~25%) or `H` (~30%). A higher level survives more damage but leaves less room for data. Ignored by the linear symbologies.
| `data-module`   | The width of a single module in pixels, which is what scales the symbol. Default is `2`. This is the setting to raise when a printed code is not read - not the css size, which scales the svg without giving the scanner more to resolve.
| `data-height`   | The height of the bars in pixels, for the linear symbologies. Default is `60`. A QR code is square and takes its extent from the module width.
| `data-text`     | `"false"` omits the human readable value printed below a linear symbol.
| `data-color-css` / `data-color-style` | The color of the modules - the bars, or the squares of a QR code - as a palette class (`text-primary`) or as an explicit color (`color:#0d6efd;`). The modules are drawn from `currentColor`, so coloring the host is all it takes.
| `data-bgcolor-css` / `data-bgcolor-style` | The color of the quiet zone, in the same two forms.

## Colors

Both colors default to a dark symbol on a light ground and can be set to a palette color or to any css color:

```html
<!-- a palette color -->
<div class="wx-webui-barcode" data-value="WX-2026"
     data-color-css="text-primary" data-bgcolor-css="bg-light"></div>

<!-- an explicit one -->
<div class="wx-webui-barcode" data-value="WX-2026"
     data-color-style="color:#0d6efd;" data-bgcolor-style="background:#fff8e1;"></div>
```

```javascript
barcode.color = "#0d6efd";           // the modules
barcode.backgroundColor = "#fff8e1"; // the quiet zone
barcode.color = null;                // back to the default
```

Two things are worth knowing before picking a color:

- **A scanner reads contrast, not color.** It expects a dark symbol on a light ground. A light color therefore needs a dark ground to stay readable, and two colors close to each other do not scan at all however good they look on screen. Red on white is a classic failure: many laser scanners use a red light source and see red as white.
- **A value that cannot be encoded drops its colors.** The control then states the problem instead of drawing a symbol, and a light color would leave that message unreadable on the light ground. The colors return with the next value that encodes.

The colors travel through every level: the form input passes them to its preview, the smart-edit read view keeps the color the editor previewed in, and the table template hands them to both its states - so a value does not change appearance when an editor opens or closes.

## Programmatic Control

```javascript
const element = document.getElementById("myBarcode");
const barcode = webexpress.webui.Controller.getInstanceByElement(element);

if (barcode) {
    // all three redraw the symbol
    barcode.value = "4006381333931";
    barcode.type = "ean13";
    barcode.level = "H";
}
```

The encoders are reachable on their own, for a caller that wants the modules rather than a drawing:

```javascript
// a linear symbology yields a module string and the human readable text
const linear = webexpress.webui.BarcodeLinear.encode("4006381333931", "ean13");
// { modules: "10100011010...", text: "4006381333931" }

// a QR code yields the matrix
const matrix = webexpress.webui.BarcodeQR.encode("https://example.com", "M");
// { size: 25, version: 2, modules: [[true, false, ...], ...] }
```

Both return `null` for a value they cannot encode.

## Inline editing

Three levels of editability build on the same control.

**As a form input** - `InputBarcodeCtrl` (`wx-webui-input-barcode`) pairs a text field with a live preview:

```html
<div class="wx-webui-input-barcode" name="article" data-value="4006381333931" data-type="ean13"></div>
```

The preview is what makes the pairing worth having. A barcode is not human readable, so a bare text field gives no feedback on whether a value can be encoded at all - an EAN with a mistyped check digit reads perfectly well as text. The preview answers that while the value is typed, and the field is marked `is-invalid` (and `aria-invalid`) as soon as it stops encoding.

The text field itself carries the `name`, so the value reaches a form submit without a hidden field of its own.

**In place** - wrap the input in a `SmartEditCtrl` and the read view becomes the symbol, swapping to the field on double click or through the pen:

```html
<div class="wx-smart-edit" data-object-name="article" data-form-action="/api/v1/articles/7" data-form-method="PUT">
    <div class="wx-webui-input-barcode" data-value="4006381333931" data-type="ean13"></div>
</div>
```

**In a table** - the `barcode` table template does both, selected by `data-editable`:

```html
<template data-type="barcode" data-barcode-type="ean13" data-editable="true"></template>
```

Note that the symbology travels as `data-barcode-type`: `data-type` already names the renderer the template selects.

## Events

- **`webexpress.webui.Event.CHANGE_VALUE_EVENT`**: Fired when the value changes.
  - Payload: `{ value: string }`
- **`webexpress.webui.Event.DATA_ERROR_EVENT`**: Fired when a value cannot be encoded.
  - Payload: `{ value: string, type: string }`

## Styling

| Class                       | Purpose
|-----------------------------|--------------------------------------------------------------
| `.wx-barcode`               | The host. It paints its own light background: scanners need dark-on-light, and on a dark surface an unpainted symbol would read as inverted. Both colors are stated as defaults of `--wx-barcode-color` / `--wx-barcode-bg`, so a configured color wins without needing `!important`.
| `.wx-barcode-graphic`       | The svg.
| `.wx-barcode-invalid`       | Set on the host while the value cannot be encoded.
| `.wx-barcode-error`         | The message shown in that case.
| `.wx-input-barcode`         | The form input.
| `.wx-input-barcode-field`   | Its text field.
| `.wx-input-barcode-preview` | The live preview beside it.

The symbol is drawn from `currentColor`, so a text-color utility recolors it - but a scanner needs contrast, so keep it dark against the light host background.

## Use Case Example

```html
<!-- an article number, printed with its value below the bars -->
<div id="article" class="wx-webui-barcode"
     data-value="4006381333931"
     data-type="ean13"
     data-module="2"
     data-height="70"></div>

<!-- a link to this page, as a QR code that survives a crease -->
<div id="share" class="wx-webui-barcode"
     data-value="https://webexpress-framework.github.io/"
     data-type="qr"
     data-level="H"
     data-module="4"></div>
```

```javascript
// report a value that stopped encoding, rather than letting it fail at the scanner
document.getElementById("article")
    .addEventListener(webexpress.webui.Event.DATA_ERROR_EVENT, function (e) {
        console.warn("not encodable as " + e.detail.type + ": " + e.detail.value);
    });
```

## A note on verification

The QR encoder implements ISO/IEC 18004 from scratch. It is covered by tests that check it mathematically rather than against recorded output: the Reed-Solomon remainder is verified through its syndromes, the block table is cross-checked against the module geometry of each version (the two are derived independently and have to agree), the format and version information are verified through their BCH remainders, and the payload is decoded again through the same interleaving the encoder applied.

That establishes the symbol is *structurally* a valid QR code. Before relying on it for anything printed, scan one.
