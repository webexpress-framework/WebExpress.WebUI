![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# Quickfilter

The Quickfilter component provides a highly responsive, client-side filtering system designed to manage and synchronize filter states across multiple UI elements without triggering immediate REST API calls. By centralizing the filter state within a dedicated browser registry (`webexpress.webui.FilterRegistry`), the system ensures that complex group rules—such as exclusive radio-button-like selections or multi-select combinations—are strictly enforced. 

Display components bind to this registry and react autonomously to state changes. Whether a component re-renders local data or decides to fetch new data from the server is entirely up to the consuming element. To ensure a persistent user experience, the registry automatically serializes the active filters and stores them safely in a debounced cookie. Upon initialization, the registry reads this cookie, validates the entries against a known list of allowed filters, and broadcasts the initial state so all UI components start consistently.

```
   ┌────────────────────────────────────────────────────────┐
   │ [Group Reset] [Quickfilter 1] [Quickfilter 2 x]    [+] │
   └────────────────────────────────────────────────────────┘
```

## Initialization

Initialization is handled declaratively by adding the `wx-webui-quickfilter` class to a host element. The control automatically connects to the global filter registry and listens for state changes. 

Within the host element, you can define static filter buttons. These are elements with the class `wx-quickfilter-button` that carry standard WebExpress action attributes. When the control initializes, it parses these static configurations, removes the initial static DOM nodes, and dynamically re-renders them as fully functional `wx-webui-button` instances alongside any currently active filter chips.

| Attribute               | Description
|-------------------------|------------
| `wx-webui-quickfilter`  | The controller class required on the host element to instantiate the Quickfilter control.
| `wx-quickfilter-button` | Class used on child elements to define static filter buttons. These will be parsed and re-rendered dynamically.
| `data-wx-primary-action`| Should be set to the corresponding registry action (e.g., `activate_quickfilter`).
| `data-wx-primary-target`| The unique ID of the filter this button controls.
| `data-wx-primary-group` | Optional. Assigns the filter to a specific group. Groups can be configured in the registry to be exclusive.
| `data-wx-primary-reset` | Optional boolean (`true`). If set, the button acts as a reset trigger for its assigned group and will appear active when no other filters in that group are active.

### Data Binding

Other components on the page that need to react to filter changes use an extensible binding schema. You specify `data-wx-bind="filter"` to indicate that the component consumes filter data. If a binding type requires a specific source, an additional attribute in the format `data-wx-source-{Bindname}` is used. Since `filter` is a global state provided by the registry, no specific source attribute is strictly necessary, but the pattern ensures clean separation of data sources across the framework.

## Functionality

When a user interacts with a Quickfilter button, the action delegates the request to the central filter registry. The registry updates its internal state, applying group exclusivity rules if necessary, and immediately writes the new state to the browser cookie. 

Once the state is updated, the registry dispatches a global `webexpress.webui.Event.CHANGE_FILTER_EVENT`. The `QuickFilterCtrl` listens to this event and completely re-renders its content. During the render cycle, it first recreates all predefined static buttons, automatically highlighting them as active if their corresponding filter is enabled (or if they serve as a reset button for a currently empty group). Afterwards, it generates removable chips for any active filters that are not already represented by a static button. These chips feature a close icon that directly triggers the deactivation of the respective filter.

Because the component relies entirely on the central registry and events, you can place the Quickfilter UI anywhere on the page, and it will always remain perfectly synchronized with other filter controls and data views.

## Programmatic Control

The component's visual state is driven entirely by the registry, but the UI controller instance itself can still be accessed programmatically if you need to manually trigger updates or interact with the DOM element.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-quickfilter');

// retrieve the controller instance associated with the element
const quickfilterCtrl = webexpress.webui.Controller.getInstanceByElement(element);
```

### Manual Instantiation

```javascript
// find the container element
const container = document.getElementById('dynamic-quickfilter');

// create a new instance of QuickFilterCtrl manually
const dynamicQuickfilterCtrl = new webexpress.webui.QuickFilterCtrl(container);
```

## Use Case Example

The following example demonstrates how to set up a Quickfilter container with a set of predefined static buttons. It includes a reset button for a specific group, and an individual filter button.

```html
<!-- 
  The host element initializes the QuickFilterCtrl. 
  It listens to registry events and manages the display of buttons and chips.
-->
<div id="main-filter" class="wx-webui-quickfilter">
    
    <!-- A static button acting as a default/reset for the "status" group -->
    <button class="wx-quickfilter-button"
            data-wx-primary-action="activate_quickfilter"
            data-wx-primary-target="status_all"
            data-wx-primary-group="status"
            data-wx-primary-reset="true">
        All Statuses
    </button>

    <!-- A static button activating a specific filter in the "status" group -->
    <button class="wx-quickfilter-button"
            data-wx-primary-action="activate_quickfilter"
            data-wx-primary-target="status_active"
            data-wx-primary-group="status">
        Active Only
    </button>
    
</div>

<!-- 
  A data list component binding to the filter state.
  It will listen to the registry and append the active filter IDs to its own data requests.
-->
<div class="wx-webui-datalist" 
     data-wx-bind="filter" 
     data-wx-source-data="/api/items">
    <!-- List content -->
</div>
```