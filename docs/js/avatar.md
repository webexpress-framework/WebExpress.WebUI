![WebExpress-Framework](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# AvatarCtrl

AvatarCtrl is a read-only avatar display with a name, optional subtitle, badge, and a hover info card. The image is loaded from a URL; if no image is available or a load error occurs, an initials tile is shown automatically. The info card appears on hover or focus and can be populated with custom content by providing a child element. Basic form integration is supported via a hidden field.

```
    ┌────────────────────┐
    │ [thumb] [name]     │ ← Avatar (image/initials) + text
    │         [subtitle] │
    │         [badge]    │
    └─┬──────────────────┘
    ┌─┴────────────────┐
    │ [custom content] │ ← hover card
    └──────────────────┘
```

## Declarative Configuration

Initialize declaratively on a host element, for example `<div class="wx-webui-avatar">`. Texts and behavior are configured via standard attributes and `data-*` attributes.

| Attribute        | Description                                                                                    | Example
|------------------|------------------------------------------------------------------------------------------------|---------
| `id`             | Identifier of the host; used for ARIA references and as the default value of the hidden field. | `id="user42"`
| `data-name`      | Display name for the avatar, card title, and ARIA descriptions.                                | `data-name="Max Mustermann"`
| `data-subtitle`  | Subtitle below the name and fallback content of the card if no info element is provided.       | `data-subtitle="Engineering"`
| `data-src`       | Image URL. On error or empty value, the component falls back to initials.                      | `data-src="/img/users/max.png"`
| `data-initials`  | Initials fallback; if not set, derived from `data-name`.                                       | `data-initials="MM"`
| `data-shape`     | Thumbnail shape: `circle` (default) or `rect`.                                                 | `data-shape="rect"`
| `data-size`      | Edge length of the thumbnail in pixels; range 24…512, default 64.                              | `data-size="96"`
| `data-placement` | Position of the hover card relative to the host: `top` (default), `right`, `bottom`, `left`.   | `data-placement="right"`
| `data-badge`     | Small badge text label on the thumbnail.                                                       | `data-badge="PRO"`

Optionally, provide a child element with the class `.wx-avatar-info`. This element is cloned before the DOM is rebuilt and used as the content of the card body.

## Structure and Behavior

- Rendering
  - The host element receives the class `wx-avatar` and ARIA attributes. Inside, the thumbnail, name, subtitle, and the hover card are created.
  - The thumbnail shows either the loaded image or initials. When the image loads successfully, initials are hidden; on load error, initials are shown.
  - The badge is only displayed if `data-badge` is non-empty.
  - The shape (`circle`/`rect`) is applied via CSS classes.

- Info Card
  - The card title is the display name.
  - The body uses the provided `.wx-avatar-info` child (cloned) if present. If no info element is found, the subtitle is shown as simple text (if set).
  - The card appears on mouse hover and keyboard focus, and hides when leaving or on focus loss. Positioning depends on `data-placement` and is recalculated on window resize and scroll.

- Initials
  - Derivation: first letter of the first and last word (uppercase). For single-word names, the first two letters are used. Whitespace is normalized.

## Form Integration

If the host has a `name` attribute, a hidden field is created:

- `type="hidden"`, `name` equals the host’s `name` attribute.
- `value` is taken from `data-value`; otherwise, the host’s `id` (or empty if none).

The hidden field is intended to carry an identifier in forms. The visual representation (image/initials/badge) does not affect the value; no client-side image upload happens here.

## Programmatic Control

The instance can be obtained to update the name or image source at runtime.

```javascript
// get host element
const host = document.getElementById('user-avatar');

// get controller instance
const avatar = webexpress.webui.Controller.getInstanceByElement(host);

if (avatar) {
    // set display name (recomputes initials and re-renders)
    avatar.name = 'Alex Example';

    // set image source (falls back to initials on load error)
    avatar.src = '/assets/avatars/alex.png';
}
```

Note: The public API exposes the properties `name` and `src`. Internal methods are not intended for stable use.

## Accessibility

- Host
  - `role="group"`, `tabindex="0"` for keyboard focus.
- Thumbnail
  - `role="img"` with `aria-label` “Avatar of {Name}” or “Avatar” if no name is set.
- Card
  - `role="dialog"`, `aria-hidden` toggles while showing/hiding.
  - If the name line has an id, `aria-labelledby` points to it.
- Keyboard
  - The card shows on focus gain and hides on focus loss.

## Events

No custom events are emitted.

## Examples

Simple avatar with initials (circle, default size):

```html
<div id="u1"
     class="wx-webui-avatar"
     data-name="Max Mustermann"
     data-subtitle="Engineering">
</div>
```

Avatar with image, badge, and right-positioned card:

```html
<div id="u2"
     class="wx-webui-avatar"
     data-name="Sara Sommer"
     data-subtitle="Product"
     data-src="/img/users/sara.png"
     data-badge="PRO"
     data-placement="right"
     data-size="80">
</div>
```

Avatar with custom info content inside the card:

```html
<div id="u3"
     class="wx-webui-avatar"
     data-name="Chris Winter"
     data-subtitle="Design">
  <div class="wx-avatar-info">
    <p><strong>Contact</strong></p>
    <p>c.winter@example.com</p>
  </div>
</div>
```

# InputAvatarCtrl

InputAvatarCtrl is a versatile control for uploading and optionally cropping a profile image. It supports drag & drop, file dialog selection, and zoom/pan/pinch gestures. For raster formats (PNG, JPEG, WebP, AVIF, BMP), it provides a square workspace with a configurable mask (circle or square) to crop the image. For formats where pixel cropping is not meaningful (SVG, GIF), the control uses a pass-through mode: the original file is preserved without any cropping.

```
   ┌─────────────────────────────────┐
   │ ┌─────────────────────────────┐ │
   │ │           [canvas]          │ │ ← crop, mask, overlay (raster)
   │ └─────────────────────────────┘ │
   │             [Zoom]              │
   │         [Select image]          │
   └─────────────────────────────────┘
```

## Declarative Configuration

Initialize declaratively on a host element (e.g., `<div class="wx-webui-input-avatar">`). Texts and behavior are configured via standard attributes and `data-*` attributes. The preview uses a canvas with a fixed CSS size; the logical resolution adapts to the device pixel ratio.

| Attribute             | Description                                                                                        | Example
|-----------------------|----------------------------------------------------------------------------------------------------|-----------------------------------------------
| `name`                | Enables form integration; creates a hidden field to participate in submit.                         | `name="avatar"`
| `accept`              | Allowed file types; overrides the default.                                                         | `accept="image/png,image/svg+xml"`
| `placeholder`         | Placeholder text in the dropzone.                                                                  | `placeholder="Drop image here or double click"`
| `data-field`          | Name of the hidden field; default is `${name}_data`.                                               | `data-field="avatar_data"`
| `data-viewport`       | Edge length of the preview area in CSS pixels (square).                                            | `data-viewport="320"`
| `data-shape`          | Crop mask: `circle` (default) or `rect`.                                                           | `data-shape="rect"`
| `data-size`           | Target output size in pixels (square).                                                             | `data-size="512"`
| `data-output-format`  | Output MIME type for raster formats (e.g., `image/png`, `image/jpeg`, `image/webp`, `image/avif`). | `data-output-format="image/png"`
| `data-output-quality` | Quality factor for compressed raster formats (0…1).                                                | `data-output-quality="0.92"`
| `data-overlay-alpha`  | Opacity of the outside overlay (0…1) for raster cropping.                                          | `data-overlay-alpha="0.5"`

Default `accept` (if not provided):  
`image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp,image/svg+xml`

## Supported Formats and Behavior

- Cropping (raster): PNG, JPEG, WebP, AVIF, BMP
  - Zoom, pan, pinch, and mask overlay available.
  - Output image is rendered at `data-size` with `data-output-format` and `data-output-quality`.
- Pass-through (no cropping): SVG, GIF
  - No overlay or mask; zoom control is disabled.
  - The original file is preserved and submitted as-is.
  - Preview: SVG is rasterized by the browser for display; GIF shows its first frame.

Note: `data-output-format` and `data-output-quality` affect raster formats only. SVG and GIF are not converted.

## Form Integration

When the host has a `name` attribute, a hidden input is created (name from `data-field` or default `${name}_data`). On form submit:

- Raster images: the cropped result is generated according to the configuration and serialized as a Data URL (`data:<mime>;base64,…`) into the hidden field.
- SVG/GIF (pass-through): the original file is serialized as a Data URL (`image/svg+xml` or `image/gif`) into the hidden field.

Server-side guidance:
- Decode the Data URL to obtain the file bytes and content type.
- For SVG, consider sanitizing/validating content due to potential active payloads.

Alternative: Instead of the hidden field, intercept submit and send a `FormData` with the cropped `Blob` (raster) or original `File` (SVG/GIF) via `fetch` for `multipart/form-data`.

## Programmatic Control

Obtain the controller instance to trigger actions like resetting the crop or exporting a blob.

```javascript
// get the host element
const host = document.getElementById('my-avatar');

// get the controller instance
const avatarCtrl = webexpress.webui.Controller.getInstanceByElement(host);

if (avatarCtrl) {
    // reset crop to initial cover state (raster only)
    if (typeof avatarCtrl._resetCrop === 'function') {
        avatarCtrl._resetCrop();
    }

    // export as Blob:
    // - cropped raster output (configured size/format/quality)
    // - original file for SVG/GIF (pass-through)
    avatarCtrl._exportCroppedBlob().then(blob => {
        // e.g., upload via fetch/FormData
    });
}
```

Note: The API is primarily designed for declarative use. Methods prefixed with an underscore are internal and may change.

## Accessibility

- Dropzone is keyboard-accessible (`role="button"`, `tabindex="0"`).  
  - Open file dialog via Enter/Space; double-click supported.
- The crop canvas is non-focusable; interactions occur via pointer/gesture input.

## Events

- `webexpress.webui.Event.FILE_SELECTED_EVENT`  
  Fired after a file was selected. The `detail` object includes the original `File` and a reference to the host element.

## Examples

```html
<!-- Raster image with circle crop, output as PNG 512×512 -->
<div id="avatar"
     class="wx-webui-input-avatar"
     name="avatar"
     data-viewport="320"
     data-shape="circle"
     data-size="512"
     data-output-format="image/png"
     data-output-quality="0.92"
     placeholder="Drop image here or double click">
</div>
```

```html
<!-- SVG pass-through (no cropping), hidden field explicitly named "logo_svg" -->
<div id="logo"
     class="wx-webui-input-avatar"
     name="logo"
     data-field="logo_svg"
     accept="image/svg+xml"
     placeholder="Drop SVG here or double click">
</div>
```

```html
<!-- Broad accept list, square mask crop -->
<div id="picture"
     class="wx-webui-input-avatar"
     name="picture"
     data-viewport="360"
     data-shape="rect"
     data-size="720"
     data-overlay-alpha="0.35"
     accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp,image/svg+xml">
</div>
```
