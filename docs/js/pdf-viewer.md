![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# PDF Viewer

`ControlPdfViewer` shows a PDF file inside the page. The file is embedded with an `<object>` element and drawn by the viewer the browser brings along, so the control has **no JavaScript counterpart** and loads no third-party renderer. Scrolling, searching, printing and downloading work the way the reader knows them from the browser.

A browser without an inline viewer - most mobile browsers among them - renders the content of the `<object>` instead: a short note and a link that opens the file on its own.

## Markup

The control renders a single element. The open parameters travel in the fragment of the address, which the browser hands to its viewer without sending it to the server; the fallback link keeps the plain address.

```html
<object class="wx-webui-pdf-viewer" style="height: 600px;"
        data="/api/1/invoice?id=42#page=2&amp;zoom=75&amp;toolbar=0"
        type="application/pdf" aria-label="Invoice 42">
    <div class="wx-webui-pdf-viewer-fallback">
        <p>The PDF document cannot be displayed here.</p>
        <a href="/api/1/invoice?id=42">Open PDF</a>
    </div>
</object>
```

| Attribute     | Source            | Description
|---------------|-------------------|------------------------------------------------------------------------------------------------------------|
| `data`        | `Uri` + open parameters | Address of the file. Omitted without a `Uri`, which leaves only the fallback.                          |
| `type`        | -                 | Always `application/pdf`, so the browser picks its PDF viewer before the response arrives.                 |
| `aria-label`  | `Label`           | Name a screen reader announces for the embedded document. Omitted when empty.                              |
| `style`       | `Height`          | `height: {n}px;` for a positive value; otherwise the stylesheet default applies.                           |

## Properties

| Property  | Type                                   | Default | Description
|-----------|----------------------------------------|---------|-------------------------------------------------------------------------------------------------|
| `Uri`     | `Func<IRenderControlContext, IUri>`    | -       | Address of the PDF file.                                                                        |
| `Label`   | `Func<IRenderControlContext, string>`  | -       | Accessible name of the viewer; may be an i18n key.                                               |
| `Height`  | `Func<IRenderControlContext, int>`     | -       | Height in pixels. Values of 0 or less keep the stylesheet height of `40rem`.                    |
| `Page`    | `Func<IRenderControlContext, int>`     | -       | Page to open at, counting from 1 (`#page=`).                                                     |
| `Zoom`    | `Func<IRenderControlContext, int>`     | -       | Zoom factor in percent (`#zoom=`).                                                               |
| `Toolbar` | `Func<IRenderControlContext, bool>`    | `true`  | `false` asks the viewer to hide its toolbar (`#toolbar=0`). Chromium follows it, Firefox does not. |

An address that already carries a fragment (for example `#nameddest=intro`) keeps it; the open parameters are joined to it with `&`.

## Example

```csharp
new ControlPdfViewer()
{
    Uri = _ => sitemapManager.GetUri<InvoicePdf>(pageContext).Add(new UriQuery("id", "42")),
    Label = _ => "Invoice 42",
    Height = _ => 600,
    Page = _ => 2
};
```

The endpoint should answer with the content type `application/pdf` and an `inline` content disposition; with `attachment` the browser offers the file for download instead of showing it:

```csharp
var response = new ResponseOK { Content = document.ToArray() }
    .AddHeaderContentType("application/pdf");

response.Header.ContentDisposition = "inline; filename=\"invoice-42.pdf\"";
```

## Security

An embedded object is governed by the `object-src` directive of the content security policy. The default policy of the server is `object-src 'self'`, so files of the own server are shown and a file from another site is blocked. To show foreign files, allow their origin in the `ContentSecurityPolicy` setting, and make sure that site permits being embedded (its `X-Frame-Options` / `frame-ancestors`).

## Styling

| Class                            | Purpose
|----------------------------------|------------------------------------------------------------------------------------------|
| `wx-webui-pdf-viewer`            | Block element at full width with a default height of `40rem` and a rounded border.       |
| `wx-webui-pdf-viewer-fallback`   | Centered note and link shown by browsers without an inline viewer.                       |

## Internationalization

| Key                                     | English                                       | German
|-----------------------------------------|-----------------------------------------------|----------------------------------------------------|
| `webexpress.webui:pdfviewer.fallback`   | The PDF document cannot be displayed here.    | Das PDF-Dokument kann hier nicht angezeigt werden. |
| `webexpress.webui:pdfviewer.open`       | Open PDF                                      | PDF öffnen                                         |
