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

|Attribute            |Description
|---------------------|--------------------------- 
|`data-file-id`       |Optional identity of the file. A host that persists a change to one entry names the file with it.
|`data-file-uri`      |The URL or path to the file. Used as the link target.
|`data-file-icon`     |Optional icon name (e.g., `file-pdf`). If not set, an icon is inferred from the file extension.
|`data-file-image`    |Optional image URL for thumbnail preview.
|`data-file-size`     |File size string (e.g., 1.2 MB).
|`data-file-date`     |Date string (e.g., 2025-08-01).
|`data-file-version`  |Optional version of the file among the entries of the same name. Absent means the file has one version only.
|`data-description`   |Optional description text shown next to the file.

### Architecture and Functionality

The `FileListCtrl` is designed as a lightweight, reactive component for displaying and managing file entries in a structured list.

- **Declarative Setup:** Files are defined using .wx-webui-file elements with data- attributes for URI, size, date, and description.
- **Icon Inference:** Icons are automatically selected based on file extension unless overridden via data-file-icon.
- **Thumbnail Preview:** If data-file-image is set, a preview image is shown alongside the file entry.
- **Metadata Display:** File size, date, and description are rendered in a clean, responsive layout.
- **Accessibility & Responsiveness:** The layout adapts to various screen sizes and supports keyboard navigation.

### Files as Data

The entries are read once from the markup and then kept as data. The `files` property exposes them, and assigning it redraws the list, which is how a data bound host — the `DataFileView` of `WebExpress.WebApp` — feeds a list it loaded from a service into the same control the server renders.

```javascript
fileListCtrl.files = [{ id: "1", name: "report.pdf", uri: "/files/report.pdf", size: "1.2 MB" }];
```

### Versions

An entry that carries a `versions` array is shown as **one row with the earlier versions folded behind it**, so a file that was uploaded several times reads as one file rather than as a repeated name. A toggle in the name cell unfolds them; the count on it includes the row it sits on, because that is what a reader counts. A folded version is a record of what was, so its description is shown for reading only.

```javascript
fileListCtrl.files = [{
    name: "report.pdf", version: 2, uri: "/files/report-2.pdf",
    versions: [{ name: "report.pdf", version: 1, uri: "/files/report-1.pdf" }]
}];
```

### Owning the Description Cell

A host may take over the description column through the `descriptionRenderer` hook. It receives the file and returns the node to place there, which is how a data bound host offers an inline editor without this control having to know how a description is persisted. The hook is asked even for a file that has no description yet — otherwise an editor would be unreachable on exactly the files that most need one — and never for a folded version.

```javascript
fileListCtrl.descriptionRenderer = (file) => buildInlineEditor(file);
```

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