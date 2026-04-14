![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# AvatarDropdownCtrl

The `AvatarDropdownCtrl` component combines an avatar display with a dropdown menu. Instead of a traditional button, the avatar thumbnail acts as the trigger element for the dropdown. Clicking the avatar opens the associated menu with all standard dropdown features including dynamic item lists, headers, dividers, icons, and actions.

```
   ┌──────────┐
   │ [avatar] │
   └──┬───────┘
   ┌──┴────────────────┐
   │ [header]          │
   │   [icon] [label]  │
   │   [icon] [label]  │
   ├───────────────────┤
   │ [icon] [label]    │
   └───────────────────┘
```

## Configuration

The component is configured through `data-*` attributes on the main container. The avatar appearance and dropdown menu items are defined declaratively.

### Avatar Settings

| Attribute      | Description                                                       | Example
|----------------|-------------------------------------------------------------------|-----------------------------------------
| `data-name`    | Display name for the avatar. Used for ARIA label and initials.    | `data-name="Max Mustermann"`
| `data-src`     | Image URL for the avatar. Falls back to initials on error.        | `data-src="/img/users/max.png"`
| `data-initials`| Initials fallback. If not set, derived from `data-name`.          | `data-initials="MM"`
| `data-shape`   | Thumbnail shape: `circle` (default) or `rect`.                   | `data-shape="rect"`
| `data-size`    | Edge length of the thumbnail in pixels; range 24…512, default 36. | `data-size="48"`

### Dropdown Settings

| Attribute      | Description                                                       | Example
|----------------|-------------------------------------------------------------------|-----------------------------------------
| `data-color`   | A color class for styling the trigger element.                    | `data-color="btn-primary"`
| `data-menucss` | Additional CSS classes for the dropdown menu container (`<ul>`).  | `data-menucss="shadow-lg"`

### Menu Item Types

The items within the dropdown menu are defined by child elements inside the main container. The type of each item is determined by its CSS class:

- **`.wx-dropdown-item`**: A standard clickable menu item. It can contain text, an icon, and an image.
- **`.wx-dropdown-header`**: A non-interactive header to group related menu items.
- **`.wx-dropdown-divider`**: A visual separator between menu items.

Individual items can be configured with their own `data-*` attributes, such as `data-icon`, `data-image`, or the `disabled` attribute.

## Programmatic Control

After initialization, the properties of the component can be accessed programmatically.

### Accessing an Automatically Created Instance

For avatar dropdowns defined declaratively in HTML, the instance is retrieved via the `getInstanceByElement(element)` method of the central `webexpress.webui.Controller`.

```javascript
// find the host element in the DOM
const element = document.getElementById('userMenu');

// retrieve the controller instance associated with the element
const avatarDropdownCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (avatarDropdownCtrl) {
    // update the avatar name
    avatarDropdownCtrl.name = 'Alex Example';

    // update the avatar image
    avatarDropdownCtrl.src = '/img/users/alex.png';
}
```

### Manual Instantiation

An avatar dropdown can also be created entirely programmatically.

```javascript
// find the container element
const container = document.getElementById('dynamic-avatar-dropdown');

// create a new instance
const avatarDropdownCtrl = new webexpress.webui.AvatarDropdownCtrl(container);
```

### Properties

| Property   | Type          | Description
|------------|---------------|-----------------------------------------------------
| `name`     | `string`      | Gets or sets the display name. Re-renders on set.
| `src`      | `string`      | Gets or sets the image source. Re-renders on set.
| `items`    | `Array`       | Gets or sets the menu items array. Re-renders on set.
| `menuCSS`  | `string|null` | Gets or sets additional CSS classes for the menu.

## Events

The component dispatches global events to allow other parts of the application to react to user interactions.

- **`webexpress.webui.Event.CLICK_EVENT`**: This event is fired when a clickable menu item is selected. The `event.detail` object contains a reference to the sender and the specific item that was clicked.
- **`webexpress.webui.Event.CHANGE_VISIBILITY_EVENT`**: This event is fired when the dropdown menu is shown or hidden. The `event.detail` object indicates whether the menu is now visible (`true`) or not (`false`).

## Use Case Examples

### Simple avatar dropdown with initials

```html
<div id="userMenu"
     class="wx-webui-avatar-dropdown"
     data-name="Max Mustermann"
     data-size="36">

    <a class="wx-dropdown-item" data-icon="fas fa-user">
        Profile
    </a>
    <a class="wx-dropdown-item" data-icon="fas fa-cog">
        Settings
    </a>
    <div class="wx-dropdown-divider"></div>
    <a class="wx-dropdown-item" data-icon="fas fa-sign-out-alt">
        Logout
    </a>
</div>
```

### Avatar dropdown with image and grouped items

```html
<div id="adminMenu"
     class="wx-webui-avatar-dropdown"
     data-name="Sara Sommer"
     data-src="/img/users/sara.png"
     data-size="48"
     data-shape="circle"
     data-menucss="shadow-lg">

    <div class="wx-dropdown-header" data-icon="fas fa-user">
        Account
    </div>
    <a class="wx-dropdown-item" data-icon="fas fa-id-card">
        Profile
    </a>
    <a class="wx-dropdown-item" data-icon="fas fa-cog">
        Settings
    </a>
    <div class="wx-dropdown-divider"></div>
    <div class="wx-dropdown-header" data-icon="fas fa-shield-alt">
        Administration
    </div>
    <a class="wx-dropdown-item" data-icon="fas fa-users">
        User Management
    </a>
    <div class="wx-dropdown-divider"></div>
    <a class="wx-dropdown-item" data-icon="fas fa-sign-out-alt" data-color="text-danger">
        Logout
    </a>
</div>
```

### Rectangular avatar with disabled item

```html
<div id="teamMenu"
     class="wx-webui-avatar-dropdown"
     data-name="Chris Winter"
     data-initials="CW"
     data-shape="rect"
     data-size="40">

    <a class="wx-dropdown-item" data-icon="fas fa-home">
        Dashboard
    </a>
    <a class="wx-dropdown-item" data-icon="fas fa-bell" disabled>
        Notifications
    </a>
</div>
```

In each example, the component is initialized from the HTML. The avatar thumbnail acts as the dropdown trigger, displaying either the loaded image or initials. The dropdown menu items, headers, and dividers are all derived from the child elements.
