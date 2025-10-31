![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# FileListCtrl

The `FileListCtrl` is a declaratively configurable component for rendering a structured fillist – a visual file list with metadata, icons, and optional preview images. It’s ideal for displaying uploaded files or predefined file entries in web applications.

```
   ┌───────────────────────────────────────┐
   │ [file name] [description] [meta data] │
   │ [file name] [description] [meta data] │
   │ [file name] [description] [meta data] │
   │ ...         ...           ...         │
   └───────────────────────────────────────┘
```

### Declarative Configuration

The `FileListCtrl` component is initialized using data- attributes and child elements inside the host container. Each file entry is defined using a `wx-webui-file` element, which provides metadata and display options for the visual fillist.

File Entry Attributes:

|Attribute          |Description
|-------------------|--------------------------- 
|`data-file-uri`    |The URL or path to the file. Used as the link target.
|`data-file-icon`   |Optional Font Awesome icon class (e.g., fas fa-file-pdf). If not set, an icon is inferred from the file extension.
|`data-file-image`  |Optional image URL for thumbnail preview.
|`data-file-size`   |File size string (e.g., 1.2 MB).
|`data-file-date`   |Date string (e.g., 2025-08-01).
|`data-description` |Optional description text shown next to the file.

### Architecture and Functionality

The `FileListCtrl` is designed as a lightweight, reactive component for displaying and managing file entries in a structured list.

- **Declarative Setup:** Files are defined using .wx-webui-file elements with data- attributes for URI, size, date, and description.
- **Icon Inference:** Icons are automatically selected based on file extension unless overridden via data-file-icon.
- **Thumbnail Preview:** If data-file-image is set, a preview image is shown alongside the file entry.
- **Metadata Display:** File size, date, and description are rendered in a clean, responsive layout.
- **Accessibility & Responsiveness:** The layout adapts to various screen sizes and supports keyboard navigation.

### Programmatic Control

The component can be fully controlled via its JavaScript instance after initialization. There are two primary ways to obtain or create an instance.

#### 1. Accessing an Automatically Created Instance

```javascript
const element = document.getElementById('my-upload');
const fileListCtrl = webexpress.webui.Controller.getInstanceByElement(element);
```

#### 2. Manual Instantiation

```javascript
const container = document.getElementById('upload-container');
const fileListCtrl = new webexpress.webui.FileListCtrl(container);
```

### Event Handling

The `FileListCtrl` is a purely visual component and does not dispatch any custom events.

### Use Case Example

```html
<!-- Host element for file list -->
<div id="my-upload" class="wx-webui-file-list">
    <div class="wx-webui-file"
         data-file-uri="/files/report.pdf"
         data-file-size="1.2 MB"
         data-file-date="2025-08-01"
         data-description="Quarterly Report Q2">
        report.pdf
    </div>
</div>
```