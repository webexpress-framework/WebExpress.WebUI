![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# ModalCtrl

The `ModalCtrl` component is used to create modal dialog windows based on the Bootstrap framework. It allows for the display of content in an overlay window that blocks the rest of the page until a user interaction occurs. The structure and content of the modal are defined declaratively directly in the HTML by using specific CSS classes to mark the header, content, and footer sections. The component takes these declared sections and constructs the required Bootstrap modal DOM structure at runtime.

```
   ┌──────────────────────────────────────────────────┐
   │                                                  │
   │  ┌────────────────────────────────────────────┐  │
   │  │ [Header Title]                         [x] │  │
   │  ├────────────────────────────────────────────┤  │
   │  │                                            │  │
   │  │         Body Content of the Modal          │  │
   │  │                                            │  │
   │  ├────────────────────────────────────────────┤  │
   │  │                   [Custom Buttons] [Close] │  │
   │  └────────────────────────────────────────────┘  │
   │                                                  │
   └──────────────────────────────────────────────────┘
```

## Configuration

The configuration and content of the modal are defined directly in the HTML markup. The component uses `data-` attributes to control its behavior and specific CSS classes to identify the content areas.

| Attribute         | Description
|-------------------|--------------------------------------------------------------------------------------------------------------
| `data-size`       | Defines the size of the modal. Accepts standard Bootstrap classes like `modal-sm`, `modal-lg`, or `modal-xl`.
| `data-close-label`| Sets the text for the automatically generated "Close" button in the footer.
| `data-auto-show`  | If set to `"true"`, the modal will be displayed automatically when the page loads.

To define the content, the following CSS classes are used within the host element:

- **`.wx-modal-header`**: The content of this element is adopted as the title in the modal's header.
- **`.wx-modal-content`**: The content of this element is placed into the main body of the modal.
- **`.wx-modal-footer`**: The content of this element is inserted into the modal's footer, preceding the default "Close" button.

## Functionality

The `ModalCtrl` is designed as a wrapper around the native Bootstrap modal functionality to allow for simple, declarative usage.

- **Dynamic DOM Construction**: Upon initialization, the component reads the content marked with the `.wx-modal-*` classes, removes it from the original DOM, and inserts it into a newly created, Bootstrap-compliant modal structure.
- **Automatic Controls**: A "Close" button (X) in the header and a "Close" button with text and an icon in the footer are automatically generated to ensure accessibility and consistent user guidance.
- **Programmatic Control**: Through the `show()` and `hide()` methods, the visibility of the modal can be dynamically controlled via JavaScript.

## Programmatic Control

After initialization, the modal can be fully controlled programmatically through its controller instance.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-modal');

// retrieve the controller instance associated with the element
const modalCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (modalCtrl) {
    // programmatically show the modal
    modalCtrl.show();
}
```

### Manual Instantiation

```javascript
// find the container element for the dynamic modal
const container = document.getElementById('dynamic-modal-container');

// create a new instance of ModalCtrl manually
const dynamicModalCtrl = new webexpress.webui.ModalCtrl(container);

// set the properties programmatically
dynamicModalCtrl.header = 'Dynamic Modal';
dynamicModalCtrl.content = '<p>This content was set programmatically.</p>';
dynamicModalCtrl.show();
```

## Events

The component dispatches standardized events to react to changes in its state and to allow for integration into the application logic.

- **`webexpress.webui.Event.MODAL_SHOW_EVENT`**: Fired when the modal is about to be shown.
- **`webexpress.webui.Event.MODAL_HIDE_EVENT`**: Fired after the modal has been completely hidden.

## Use Case Example

The following example shows the complete declarative configuration of a modal that includes a title, text content, and a custom button in the footer.

```html
<!--
    The main container for the modal control.
    It is configured with a large size and will not show automatically.
-->
<div id="my-modal"
     class="wx-webui-modal"
     data-size="modal-lg"
     data-close-label="Cancel">

    <!-- This content becomes the modal title. -->
    <div class="wx-modal-header">
        Important Notice
    </div>

    <!-- This content becomes the modal body. -->
    <div class="wx-modal-content">
        <p>Please confirm the following action to proceed.</p>
    </div>

    <!-- This content is added to the modal footer. -->
    <div class="wx-modal-footer">
        <button type="button" class="btn btn-primary">Confirm Action</button>
    </div>
</div>
```

# ModalPageCtrl

The `ModalPageCtrl` extends the basic functionality of the `ModalCtrl` by adding the capability to dynamically load the content of a modal dialog from an external resource via a URI. This component is specialized to serve as an "empty shell" for a modal that is filled with server-side generated HTML content only after it has been opened. This decouples the page logic from the modal's content logic and allows for the reuse of views or the loading of complex content without impacting the initial load time of the main page.

During the loading process, a placeholder animation (skeleton screen) is displayed to the user to ensure a good user experience and to signal that content is being loaded.

```
   ┌──────────────────────────────────────────────────┐
   │                                                  │
   │  ┌────────────────────────────────────────────┐  │
   │  │ [Header Title]                         [x] │  │
   │  ├────────────────────────────────────────────┤  │
   │  │  ┌──────────────────────────────────────┐  │  │
   │  │  │ [Loading State Placeholder...]       │  │  │
   │  │  └──────────────────────────────────────┘  │  │
   │  ├────────────────────────────────────────────┤  │
   │  │                                    [Close] │  │
   │  └────────────────────────────────────────────┘  │
   │                                                  │
   └──────────────────────────────────────────────────┘
```

## Configuration

Configuration is handled via `data-` attributes on the host element. The component inherits all attributes from `ModalCtrl` and adds two specific attributes for dynamic loading.

| Attribute      | Description
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| `data-uri`     | The mandatory URI from which the HTML content for the modal body should be loaded.
| `data-selector`| An optional CSS selector that specifies which part of the HTML response should be extracted and used as the modal content. By default, the `<body>` content of the response is used.

## Functionality

The `ModalPageCtrl` builds upon the lifecycle of a Bootstrap modal to implement an asynchronous loading process.

- **Inheritance Model**: As a direct extension of `ModalCtrl`, it inherits all of its logic for creating the basic modal structure, including the header, footer, and default close buttons.
- **Asynchronous Loading Cycle**: When the `show()` method is called, the following occurs:
    1.  The modal is immediately displayed with a placeholder graphic (skeleton UI).
    2.  Once the modal's opening animation is complete, a `fetch` request is sent to the specified `data-uri`.
    3.  The HTML response from the server is received.
    4.  Using the `DOMParser`, the response is parsed, and the content area specified by `data-selector` is extracted.
    5.  The placeholder content in the modal body is replaced with the newly loaded content.
- **Selective Content Extraction**: The use of the `data-selector` attribute makes it possible to use only relevant parts of a larger HTML response.

## Programmatic Control

The programmatic interface corresponds to that of `ModalCtrl`, allowing for the explicit showing and hiding of the modal.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-page-modal');

// retrieve the controller instance associated with the element
const modalPageCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (modalPageCtrl) {
    // programmatically show the modal
    // This will display the placeholder and then initiate the fetch request.
    modalPageCtrl.show();
}
```

### Manual Instantiation

```javascript
// find the container element for the dynamic modal page
const container = document.getElementById('dynamic-modal-page-container');

// create a new instance of ModalPageCtrl manually
const dynamicModalPageCtrl = new webexpress.webui.ModalPageCtrl(container);

// set the properties programmatically
dynamicModalPageCtrl.uri = '/path/to/content';
dynamicModalPageCtrl.header = 'Dynamic Content';
dynamicModalPageCtrl.show();
```

## Events

The component extends the event model of its predecessor with two specific events that signal the loading cycle.

- **`webexpress.webui.Event.MODAL_SHOW_EVENT` / `MODAL_HIDE_EVENT`**: Fired when the modal is shown or hidden.
- **`webexpress.webui.Event.DATA_REQUESTED_EVENT`**: Fired just before the `fetch` request to load the content is sent.
- **`webexpress.webui.Event.DATA_ARRIVED_EVENT`**: Fired after the data has been successfully received and the modal content has been updated.

## Use Case Example

The following example shows the configuration of a modal that loads its content from a server endpoint and displays only a specific part of the response.

```html
<!--
    The host element for the modal page.
    'data-uri' points to the content source.
    'data-selector' specifies that only the element with the ID '#profile-details'
    from the response should be used as the modal's body.
-->
<div id="user-profile-modal"
     class="wx-webui-modalpage"
     data-uri="/users/ReneSchwarzer/details"
     data-selector="#profile-details"
     data-size="modal-lg">

    <!-- The title is defined statically in the header. -->
    <div class="wx-modal-header">
        User Profile
    </div>
</div>
```

# ModalFormCtrl

The `ModalFormCtrl` is a specialized component that combines the functionality of a modal dialog (`ModalCtrl`) with the ability to load content (`ModalPageCtrl`) to manage complex HTML forms within a pop-up. Its core purpose is to replace the traditional form submission, which requires a full page reload, with an asynchronous AJAX process. This enables dynamic updates of the form within the modal, for instance, to display validation errors or success messages, without the user leaving the context of the dialog.

```
   ┌──────────────────────────────────────────────────┐
   │                                                  │
   │  ┌────────────────────────────────────────────┐  │
   │  │ [Form Title]                           [x] │  │
   │  ├────────────────────────────────────────────┤  │
   │  │  ┌──────────────────────────────────────┐  │  │
   │  │  │ [Validation Errors Alert]            │  │  │
   │  │  ├──────────────────────────────────────┤  │  │
   │  │  │                                      │  │  │
   │  │  │  Form Fields (Input, Select, etc.)   │  │  │
   │  │  │                                      │  │  │
   │  │  └──────────────────────────────────────┘  │  │
   │  ├────────────────────────────────────────────┤  │
   │  │     [Submit Button] [Reset Button] [Close] │  │
   │  └────────────────────────────────────────────┘  │
   │                                                  │
   └──────────────────────────────────────────────────┘
```

## Functionality

The component builds upon `ModalPageCtrl` and extends its functionality to provide seamless form interaction.

- **Asynchronous Form Submission**: The `ModalFormCtrl` intercepts the form's `submit` event. Instead of reloading the page, it serializes the form data and sends it via a `fetch` request to the URL defined in the form's `action` attribute.
- **Dynamic Content Updates**: After submission, the component expects an HTML response from the server. This response is parsed, and the new form state contained within it is extracted and used to update the modal's content.
- **Intelligent DOM Restructuring**: During initialization and each update, the component restructures the DOM. It wraps the entire modal dialog in a `<form>` element. Buttons of type `submit` or `reset` contained in the server-provided HTML are automatically moved to the modal's footer.
- **Programmatic Error Display**: A dedicated method, `showValidationErrors`, allows for the programmatic display of a list of validation errors. This method generates a summary warning (Bootstrap Alert) at the top of the modal body.

## Programmatic Control

Like its parent classes, the `ModalFormCtrl` can be programmatically controlled to open or close the modal.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-modal-form');

// retrieve the controller instance associated with the element
const modalFormCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (modalFormCtrl) {
    // programmatically show the modal, which will trigger fetching the initial form content
    modalFormCtrl.show();
}
```

### Manual Instantiation

```javascript
// find the container element for the dynamic modal form
const container = document.getElementById('dynamic-modal-form-container');

// create a new instance of ModalFormCtrl manually
const dynamicModalFormCtrl = new webexpress.webui.ModalFormCtrl(container);

// set the properties programmatically
dynamicModalFormCtrl.uri = '/users/create/form';
dynamicModalFormCtrl.show();
```

### Programmatic Error Display

```javascript
// assuming modalFormCtrl is an existing instance
const errors = [
    { field: 'username', message: 'This username is already taken.' },
    { field: 'password', message: 'Password must be at least 8 characters long.' }
];
modalFormCtrl.showValidationErrors(errors);
```

## Events

The component dispatches a series of events to allow for deep integration into the application logic.

- **`webexpress.webui.Event.MODAL_SHOW_EVENT` / `MODAL_HIDE_EVENT`**: Fired when the modal is shown or hidden.
- **`webexpress.webui.Event.DATA_REQUESTED_EVENT` / `DATA_ARRIVED_EVENT`**: Signals the start and completion of the initial loading request for the form content.
- **`webexpress.webui.Event.UPDATED_EVENT`**: A key event that is fired after the modal's content has been successfully updated following a form submission.

## Use Case Example

The configuration is declarative. The host element requires a URI from which the initial form HTML will be loaded.

```html
<!--
    The host element for the modal form.
    The 'data-uri' attribute specifies where to load the form from.
    The controller will automatically handle the form submission found at that URI.
-->
<div id="create-user-modal"
     class="wx-webui-modalform"
     data-uri="/users/create/form"
     data-size="modal-lg">
</div>
```