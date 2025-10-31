![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# UploadCtrl

The UploadCtrl component is used for uploading files via drag-and-drop or manual selection. It provides a user-friendly interface that allows users to drop files directly onto a designated area or choose them through a file picker. Once selected, the files are automatically sent to a configured server endpoint using a multipart/form-data POST request.
The component is designed to be declaratively configured via HTML data- attributes and can be fully controlled programmatically after initialization. It supports multiple files, visual feedback during drag operations, and customizable upload behavior.

```
   ┌────────────────────────────────────┐
   │                                    │
   │ 📁 Drag files here                 │  // Dropzone
   │ or click to select                 │
   │                                    │
   └────────────────────────────────────┘

   ┌────────────────────────────────────┐
   │ index.html                         │
   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  75%      │  // Progress bar
   └────────────────────────────────────┘

```

### Declarative Configuration

Initialization is handled through `data-` attributes on the host element. The component automatically binds drag-and-drop and file input events to enable seamless file selection and upload.

Host Element Attributes:

**Host Element Attributes:**

| Attribute         | Description
|-------------------|------------------------------------------------------------------------------------------------------
| `data-upload-url` | The server endpoint to which files will be uploaded.
| `data-multiple`   | If set to `false`, only a single file can be selected. Default is `true`.
| `data-accept`     | A comma-separated list of accepted MIME types (e.g., `image/*,application/pdf`).
| `data-autoupload` | If `true`, files are uploaded immediately after selection. If `false`, manual triggering is required.
| `data-label`      | Custom label text displayed inside the dropzone.
| `data-progress`   | If `true`, a visual progress bar is shown during upload.

### Architecture and Functionality

The `UploadCtrl` is designed as a lightweight, reactive component.

- **Drag-and-Drop Support:** The dropzone reacts to drag events with visual feedback and accepts dropped files.
- **File Selection:** Clicking the dropzone opens a native file picker. Selected files are handled identically to dropped files.
- **Automatic Upload:** If data-autoupload is enabled, files are sent immediately to the server using fetch() and FormData.
- **Progress Feedback (optional):** The component can be extended to show upload progress using XMLHttpRequest or fetch with streams.
- **Error Handling:** Upload failures are logged and can be intercepted via event listeners.
- **Progress Feedback:** A progress bar is shown per file using XMLHttpRequest with onprogress.
- **Server-Side Validation:** The upload proceeds only if the server returns a positive validation result.

### Programmatic Control

The component can be fully controlled via its JavaScript instance after initialization. There are two primary ways to obtain or create an instance.

#### 1. Accessing an Automatically Created Instance

```javascript
const element = document.getElementById('my-upload');
const uploadCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (uploadCtrl) {
    // manually trigger upload
    uploadCtrl.upload();

    // access selected files
    console.log(uploadCtrl.files);
}

```

#### 2. Manual Instantiation

```javascript
const container = document.getElementById('upload-container');
const uploadCtrl = new webexpress.webui.UploadCtrl(container, {
    uploadUrl: '/api/upload',
    multiple: true,
    accept: 'image/*',
    autoupload: false
});

// manually trigger upload
uploadCtrl.upload();

```

### Event Handling

The `UploadCtrl` component dispatches events to communicate upload status and user interactions.

- **webexpress.webui.Event.FILE_SELECTED_EVENT**: Fired when files are selected or dropped. event.detail.files contains the list of selected files.
- **webexpress.webui.Event.UPLOAD_SUCCESS_EVENT**: Fired after successful upload. event.detail.response contains the server response.
- **webexpress.webui.Event.UPLOAD_ERROR_EVENT**: Fired if the upload fails. event.detail.error contains the error object.
- **webexpress.webui.Event.VALIDATION_SUCCESS_EVENT**: Fired after successful server-side validation.
- **webexpress.webui.Event.VALIDATION_ERROR_EVENT**: Fired if validation fails.
- **webexpress.webui.Event.UPLOAD_PROGRESS_EVENT**:	Fired during upload with progress percentage.

```javascript
document.addEventListener(webexpress.webui.Event.UPLOAD_SUCCESS_EVENT, (event) => {
    console.log('Upload erfolgreich:', event.detail.response);
});
```

### Use Case Example

```html
<!--
    Host element for file upload.
    Automatically initialized as UploadCtrl.
-->
<div id="my-upload"
     class="wx-webui-upload"
     data-upload-url="/api/upload"
     data-validate-url="/api/validate"
     data-multiple="true"
     data-accept="image/*,application/pdf"
     data-autoupload="true"
     data-progress="true"
     data-label="Drag files here or click to upload">
</div>
```