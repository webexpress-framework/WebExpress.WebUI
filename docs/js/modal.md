![WebExpress-Framework](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

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
     data-uri="/users/webexpress-framework/details"
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

# ModalSidebarPanel

The `ModalSidebarPanel` component provides a modal dialog with a left-hand navigation tree and a right-hand content area. It extends the `ModalCtrl` base component and builds the modal body into a two-pane layout, using SplitCtrl for a resizable sidebar and TreeCtrl for hierarchical navigation. Pages (panels) can be autoloaded via a registry key or added programmatically. Validation can be scoped to either all pages or only the currently active one. A submit button is managed by the base class and is wired into `ModalSidebarPanel` via an element ID; on successful validation the modal closes, otherwise an error alert is shown above the split control.

```
   ┌──────────────────────────────────────────────────────┐
   │                                                      │
   │  ┌────────────────────────────────────────────────┐  │
   │  │ [Form Title]                               [x] │  │
   │  ├─────────────────────┬─┬────────────────────────┤  │
   │  │                     │░│                        │  │
   │  │ ▼ [Icon] Node 1     │░│ Panel content          │  │
   │  │   ► [Icon] Node 1.1 │░│ (active pane)          │  │
   │  │   ► [Icon] Node 1.2 │▓│                        │  │
   │  │ ► [Icon] Node 2     │░│                        │  │
   │  │                     │░│                        │  │
   │  │                     │░│                        │  │
   │  ├─────────────────────┴─┴────────────────────────┤  │
   │  │                        [Custom Button] [Close] │  │
   │  └────────────────────────────────────────────────┘  │
   │                                                      │
   └──────────────────────────────────────────────────────┘
```

## Configuration

Configuration is declared on the host element through data attributes. The header and footer are provided via dedicated CSS classes. The body is fully managed by this component and will be rebuilt into a split layout.

| Attribute                   | Description
|-----------------------------|--------------------------------------------------------------------------------------------------------
| `data-key`                  | Registry key used to autoload pages from DialogPanels.
| `data-side-width`           | Initial sidebar width in pixels (default: 280).
| `data-min-side-width`       | Minimum sidebar width in pixels (default: 180).
| `data-submit-id`            | The ID of the submit button managed by the base class in the modal footer. ModalSidebarPanel only wires this button.
| `data-validate-active-only` | When set to `"true"`, only the currently active page is validated and hidden pages are ignored (default: `"false"` = validate all pages).

Content markers inside the host element:

- `.wx-modal-header`: Its content becomes the modal title.
- `.wx-modal-footer`: Its content is placed into the modal footer before the auto-generated “Close” button.
- Note: The body (`.wx-modal-content`) is not used; the component constructs the split layout itself.

## Functionality

ModalSidebarPanel wraps the Bootstrap modal behavior from ModalCtrl and adds a navigable, two-pane layout.

- Dynamic body construction: The modal body is cleared and rebuilt into a split layout with a sidebar and a main area. SplitCtrl provides resizing; TreeCtrl renders the navigation tree.
- Page model and navigation: Pages are managed as a flat list and projected as a hierarchy in the tree via optional `parentId`. A node index is maintained for quick lookups; ancestors are expanded automatically to reveal selected nodes, and the active node is tracked and highlighted.
- Page API: Pages can expose `render(pane, ctrl)`, `onShow(ctrl)`, `validate(ctrl)`, and `onSubmit(ctrl)`. Each page receives its own pane element that is shown/hidden as the active page changes.
- Autoload from registry: Using `data-panels-key`/`data-key`, panels registered in `webexpress.webui.DialogPanels` are loaded. If a registered panel specifies `modalId`, it is loaded only when it matches the current modal’s ID. Missing or conflicting IDs are resolved by generating a unique, safe ID.
- Validation and submit: The submit button is created and managed by the base class; ModalSidebarPanel wires it via `data-submit-id`. On click, validation is performed. If validation fails, a Bootstrap alert (`alert alert-danger`) is shown above the split control and remains visible as long as errors persist. If validation passes, optional `onSubmit` hooks are invoked and the modal closes.
- Robust tree click handling: The global click listener for TreeCtrl is managed idempotently and reattached when the modal is shown. Sender checks are tolerant to ensure page switching remains reliable.

## Page Object API

Pages supplied to ModalSidebarPanel (either autoloaded or added programmatically) follow this shape:

- `id: string` – unique page ID. If omitted or duplicated, a safe ID is generated.
- `title?: string` – label shown in the navigation tree (defaults to `id`).
- `iconClass?: string` – optional icon CSS class for the node.
- `image?: string` – optional image URL/class used by the tree control.
- `parentId?: string|null` – optional parent page ID to form a hierarchy.
- `render?: (pane: HTMLElement, ctrl: ModalSidebarPanel) => void` – render hook to populate the page pane.
- `onShow?: (ctrl: ModalSidebarPanel) => void` – called when the page becomes visible.
- `validate?: (ctrl: ModalSidebarPanel) => boolean | string | { valid: boolean, message?: string }` – validation hook. Returning:
  - `true` means valid,
  - `false` or a non-empty `string` means invalid (string is used as message),
  - an object can specify `{ valid: false, message: '...' }` for details.
- `onSubmit?: (ctrl: ModalSidebarPanel) => void` – optional hook executed after successful validation and before the modal closes.

## Public Methods

- `addPage(page)`: Adds a page to the navigation and creates its pane. If it is the first page, it becomes active.
- `getActivePage()`: Returns the active page definition or `null`.
- `selectPage(id)`: Programmatically activates a page by ID.
- `submit()`: Triggers the submit workflow (validation, error alert handling, submit hooks, and modal close on success).
- `fitSidePaneToContent()`: Asks the split controller to fit the sidebar to its content.

## Programmatic Control

### Accessing an automatically created instance

```javascript
// locate the host element
const el = document.getElementById('my-modal-sidebar');

// get the controller instance
const sidebarCtrl = webexpress.webui.Controller.getInstanceByElement(el);

if (sidebarCtrl) {
    // show the modal
    sidebarCtrl.show();
}
```

### Adding pages and validating

```javascript
// add a page with render, validate and onSubmit hooks
sidebarCtrl.addPage({
    id: 'profile',
    title: 'Profile',
    parentId: null,
    render: (pane, ctrl) => {
        // render content
        pane.innerHTML = `
            <div class="p-2">
                <label for="profile-name" class="form-label">Name</label>
                <input id="profile-name" class="form-control" />
            </div>`;
    },
    onShow: (ctrl) => {
        // run after the pane becomes visible
    },
    validate: (ctrl) => {
        // validate inputs on this page
        const input = document.getElementById('profile-name');
        if (!input || input.value.trim() === '') {
            return { valid: false, message: 'Name is required.' };
        }
        return { valid: true };
    },
    onSubmit: (ctrl) => {
        // persist data for this page
        const input = document.getElementById('profile-name');
        console.log('profile name:', input ? input.value : '');
    }
});

// switch to the page
sidebarCtrl.selectPage('profile');

// optionally trigger submit programmatically
sidebarCtrl.submit();
```

### Validating only the active page

```html
<!-- only the currently visible page is validated; hidden pages are ignored -->
<div id="settings-modal"
     class="wx-webui-modal-sidebar-panel"
     data-size="modal-lg"
     data-close-label="Close"
     data-panels-key="settings"
     data-submit-id="settings-submit"
     data-validate-active-only="true">

    <div class="wx-modal-header">
        Settings
    </div>

    <div class="wx-modal-footer">
        <!-- base class manages this button; id must match data-submit-id -->
        <button id="settings-submit" type="button" class="btn btn-primary">Save</button>
    </div>
</div>
```

## Registering pages via DialogPanels

Pages can be registered centrally and autoloaded into any `ModalSidebarPanel` that specifies a matching `data-panels-key`. The following example registers a page under the key `"key"`. Any modal with `data-panels-key="key"` will automatically load this page.

```javascript
// register a page under a registry key; will be autoloaded by modals with data-panels-key="key"
webexpress.webui.DialogPanels.register("key", {
    id: "info-pane",
    parentId: null,
    title: "Example Page",
    iconClass: "fas fa-info-circle",
    render: function(pane, ctrl) {
        // render content for this page
        pane.innerHTML = '<div class="p-2"><p>This is an example page loaded via DialogPanels.register().</p></div>';
    },
    onShow: function(ctrl) {
        // run when this page becomes visible
        // e.g., initialize controls or focus first input
    },
    onSubmit: function(ctrl) {
        // handle submission for this page
        // e.g., collect and send data to a server
    }
});
```

## Events

ModalSidebarPanel integrates with Bootstrap’s modal events and the base component’s events.

- `shown.bs.modal`: After the modal is shown; renders the tree, ensures an active page, wires the submit button, and fits the sidebar.
- `hidden.bs.modal`: After the modal is hidden; cleans up event handlers and hides any validation alert.
- `webexpress.webui.Event.MODAL_SHOW_EVENT`: Emitted by the base class when opening.
- `webexpress.webui.Event.MODAL_HIDE_EVENT`: Emitted by the base class when closing.
- `webexpress.webui.Event.CLICK_EVENT`: Global tree click events; managed idempotently and reattached as needed.

## Example

A declarative setup with autoloaded pages, a base-managed submit button bound via `data-submit-id`, and active-only validation:

```html
<div id="account-modal"
     class="wx-webui-modal-sidebar-panel"
     data-size="modal-lg"
     data-close-label="Cancel"
     data-panels-key="account"
     data-submit-id="account-submit"
     data-validate-active-only="true">

    <div class="wx-modal-header">
        Account Settings
    </div>

    <div class="wx-modal-footer">
        <button id="account-submit" type="button" class="btn btn-success">
            Save Changes
        </button>
    </div>
</div>
```

At runtime, the body is composed into a split layout with a navigation tree and a content area. The first page is activated by default. Navigating in the tree switches the visible pane and expands ancestor nodes. On submit, validation runs either on all pages or only the active one, depending on the configuration; an error alert remains visible above the split control while errors persist. On success, any `onSubmit` hooks are executed and the modal closes.