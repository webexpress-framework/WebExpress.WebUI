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

|Attribute                 |Description
|--------------------------|-----------
|`wx-webui-quickfilter`    |The controller class required on the host element to instantiate the Quickfilter control.
|`wx-quickfilter-button`   |Class used on child elements to define static filter buttons. These will be parsed and re-rendered dynamically.
|`wx-quickfilter-avatar`   |Class used on a child element to define an avatar filter toggle (filter by a person). Carries `data-name`, an optional `data-image`, `data-initials` and `data-color`.
|`wx-quickfilter-dropdown` |Class used on a child container holding `wx-quickfilter-dropdown-option` children, re-rendered as a single-choice option dropdown.
|`wx-quickfilter-add`      |Class used on a child element that creates a new filter rather than applying one. It carries no filter target, is never shown active, and is re-rendered at the trailing edge of the bar after every filter chip.
|`wx-quickfilter-edit-action`|Class of a hidden prototype element carrying the authored `EditAction`. The client copies its action attributes onto the edit entry of every user-defined chip.
|`data-wx-primary-action`  |Should be set to the corresponding registry action (e.g., `activate_quickfilter`).
|`data-wx-primary-target`  |The unique ID of the filter this button controls.
|`data-wx-primary-group`   |Optional. Assigns the filter to a specific group. Groups can be configured in the registry to be exclusive.
|`data-wx-primary-reset`   |Optional boolean (`true`). If set, the button acts as a reset trigger for its assigned group and will appear active when no other filters in that group are active.
|`data-icon`               |Optional. The icon rendered ahead of the label of a button or dropdown option, as a CSS class (e.g., `star`). Authored in C# through the `Icon` property (`IIcon`); an image icon is emitted as `data-image` instead.
|`data-image`              |Optional. An image uri rendered in place of a CSS icon.
|`data-color`              |Optional. The chip color as a button css class (e.g., `btn-danger`), derived from the C# `BackgroundColor` property for a system color. The chip keeps its outline-to-filled behavior in that hue.
|`data-color-value`        |Optional. A raw css color (e.g., `#7c3aed`), derived from the C# `BackgroundColor` property for a user-defined color; the client feeds it into the chip accent.
|`data-badge`              |Optional. The badge text rendered at the trailing edge of a button or dropdown option, typically a result count. Authored in C# through the `Badge` property.
|`data-badge-color`        |Optional. The badge color css class (e.g., `text-bg-danger`), derived from the C# `BadgeColor` property for a system color.
|`data-badge-style`        |Optional. An inline badge style (e.g., `background:#7c3aed;`), derived from the C# `BadgeColor` property for a user-defined color.

### Data Binding

Other components on the page that need to react to filter changes use an extensible binding schema. You specify `data-wx-bind="filter"` to indicate that the component consumes filter data. If a binding type requires a specific source, an additional attribute in the format `data-wx-source-{Bindname}` is used. Since `filter` is a global state provided by the registry, no specific source attribute is strictly necessary, but the pattern ensures clean separation of data sources across the framework.

## Functionality

When a user interacts with a Quickfilter button, the action delegates the request to the central filter registry. The registry updates its internal state, applying group exclusivity rules if necessary, and immediately writes the new state to the browser cookie. 

Once the state is updated, the registry dispatches a global `webexpress.webui.Event.CHANGE_FILTER_EVENT`. The `QuickFilterCtrl` listens to this event and completely re-renders its content. During the render cycle, it first recreates all predefined static buttons, automatically highlighting them as active if their corresponding filter is enabled (or if they serve as a reset button for a currently empty group). Afterwards, it generates removable chips for any active filters that are not already represented by a static button. These chips feature a close icon that directly triggers the deactivation of the respective filter.

Because the component relies entirely on the central registry and events, you can place the Quickfilter UI anywhere on the page, and it will always remain perfectly synchronized with other filter controls and data views.

## Filter item types

Authored in C# through `ControlQuickfilter` and its items, a single bar can mix several item kinds, all backed by the same registry and the same `ActionFilter`:

- **`ControlQuickfilterItemButton`** — a one-click chip that toggles a single filter. Carries an optional `Icon` (an `IIcon`, rendered as a css icon or an image) ahead of the label, an optional `Badge` (for example a result count) with an optional `BadgeColor` at the trailing edge, and an optional `BackgroundColor` that colors the chip while keeping its outline-to-filled behavior.
- **`ControlQuickfilterItemAvatar`** — an avatar chip used to filter by a person; the client renders the image when supplied, otherwise the `Icon`, otherwise the initials on the person's color. The avatar shows active while its filter is set.
- **`ControlQuickfilterItemDropdown`** — a single-choice dropdown of related options (each a `ControlQuickfilterItemDropdownItem`, with an optional `Icon`, `Badge` and `BadgeColor` per option). Group the options exclusively, and the toggle shows the active option's label and closes on select.
- **`ControlQuickfilterItemMultiSelect`** — a multi-select dropdown (also built from `ControlQuickfilterItemDropdownItem`). Several options may be active at once, the menu stays open while values are picked, and the toggle shows the count of active options as a badge next to the label.
- **`ControlQuickfilterItemAdd`** — a chip that creates a new filter instead of applying one. It carries no filter id, never shows active and always trails the bar, so the affordance keeps its position while filters come and go. Give it a `PrimaryAction` — typically an `ActionModal` — to open the application's filter dialog. Without an `Icon` a plus is drawn, and without a `Text` the chip stays icon-only, announcing itself through its `Tooltip` (or the translated default).
- **`ControlDataQuickfilterItemDropdown`** *(WebExpress.WebApp)* — a dropdown (or multi-select, via `Multiple`) whose options are loaded from a REST endpoint (`RestEndpoint`) through the service layer rather than authored statically. Use it inside a `ControlDataQuickfilter`. Its menu carries a search box that re-queries the endpoint (`GET {uri}?q=…`), so huge option sets are filtered on the server instead of loaded in full.

All items render as chips matching the one-click button, so a mixed bar looks consistent.

## User-defined filters

Besides the filters an application defines, a bar may carry filters its users define themselves. A filter the endpoint marks with `custom` renders an options menu on its chip, offering to change and to delete it; a filter of the application carries no menu, because only the user's own filters are hers to manage.

### The editor belongs to the application

What a filter selects is the application's business, so **WebExpress ships no editor for it**. Both creating and editing run through an ordinary action, so the dialog behind them is the application's own modal:

- **Creating** — the add chip carries the authored `PrimaryAction`, typically an `ActionModal` pointing at the application's dialog.
- **Editing** — the quickfilter carries an `EditAction`. The client copies it onto the *Edit* entry in the options menu of every user-defined chip, appending `?id=<filter>` to the action uri and repeating the id in `data-wx-filter`, so the dialog knows which filter it opens on. Without an `EditAction` the menu offers the removal alone.

Point the `EditAction` uri at the quickfilter endpoint and the dialog can load the filter straight from it: a `GET` carrying an `id` is answered with **that single filter** in the record shape a form binds to — `{ "data": { "id", "name", "icon", "color", "criteria" } }` — instead of the whole bar. It is the same shape a write takes back, so the dialog reads exactly what it will send. An unknown id is answered with `404`, and a read without an id returns the bar as before. The default picks the filter out of `RetrieveItems`, so an endpoint needs no extra code; one that keeps more about a filter overrides `RetrieveItem`.

```csharp
var quickfilter = new ControlDataQuickfilter("myQuickfilter")
{
    EditAction = _ => new ActionModal("filtereditor", pageContext.Route.ToUri())
}
    .DataService<MyFilterEndpoint>();

quickfilter.Add(new ControlQuickfilterItemAdd("newfilter")
{
    Tooltip = _ => "Create a new filter",
    PrimaryAction = _ => new ActionModal("filtereditor")
});
```

The dialog hands its values back by calling `saveFilter(values)` on the quickfilter, which persists them through the service and refreshes every bound control at once. The values are the display of the filter - `name`, `icon`, `color` - and its **criteria**. The criteria are opaque to the framework: the text travels unchanged between the application's dialog and its endpoint, so it is free to store a query, an expression or a serialized object of its own in it.

```javascript
// inside the application's modal
const bar = document.querySelector(".wx-webapp-quickfilter");
webexpress.webui.Controller.getInstanceByElement(bar).saveFilter({
    id: filterId,            // null creates a filter
    name: "My filter",
    color: "#7c3aed",
    criteria: "author:me"    // whatever the application makes of it
});
```

An application that would rather do the persisting itself can skip that and call `removeFilter(id)`, write to `webexpress.webui.FilterRegistry` directly, or reload the bar through `update()`.

Creating, changing and deleting go through the service of the `ControlDataQuickfilter`, which extends the read endpoint by three verbs:

|Verb    |Meaning
|--------|-------
|`GET`   |Returns the whole bar, or - when the request carries an `id` - that single filter as `{data:{…}}` for the edit dialog to load.
|`POST`  |Creates a filter from the payload. The endpoint owns the id and returns the created filter, which the client adopts.
|`PUT`   |Changes the filter named by the payload's `id` and returns it in its updated shape.
|`DELETE`|Removes the filter named by the `id` query parameter, falling back to the payload.

An endpoint opts into user-defined filters by overriding `CreateItem`, `UpdateItem` and `DeleteItem` on `RestApiQuickfilter<TIndexItem>`. The defaults accept nothing and answer `501`, so every existing read-only endpoint stays as it was.

```csharp
protected override RestApiQuickfilterItem CreateItem(IQueryContext context, IRequest request, RestApiQuickfilterPayload payload)
{
    var filter = _store.Add(request.GetUser(), payload.Name, payload.Criteria);

    return new RestApiQuickfilterItem()
    {
        Id = filter.Id,
        Name = filter.Name,
        Criteria = filter.Criteria,
        Custom = true
    };
}
```

Every change takes effect at once, without a reload. The client writes the result of the call into its own configurations and into the filter registry, which announces the change through `webexpress.webui.Event.CHANGE_FILTER_DEFINITION_EVENT`. A second bar on the page - or any other surface bound to the registry - adopts the change from that event; the control that caused it recognises its own origin and does not reload. A newly created filter is also activated straight away, because defining it is what the user asked for.

The filters a `ControlDataQuickfilter` loads through its own service are described by `RestApiQuickfilterItem` objects. Besides `Id` and `Name` an item carries an optional `Icon` (an `IIcon`, serialized into a CSS class or image uri), an optional `Color` (a `PropertyColorButton`, serialized into the `color` css class or the raw `colorValue`), an optional `Badge` text and an optional `BadgeColor` (serialized into the `badgeColor` css class or the `badgeStyle` inline style), so REST-loaded chips and dropdown options show the same visuals as their statically authored counterparts.

```csharp
new ControlQuickfilter()
    .Add
    (
        new ControlQuickfilterItemButton("status")
        {
            Text = _ => "Status",
            Icon = _ => new IconHome(),
            Badge = _ => "3",
            BadgeColor = _ => new PropertyColorBackgroundBadge(TypeColorBackgroundBadge.Danger),
            BackgroundColor = _ => new PropertyColorButton(TypeColorButton.Success),
            PrimaryAction = _ => new ActionFilter()
        },
        new ControlQuickfilterItemDropdown("sprint")
        {
            Text = _ => "Sprint",
            Icon = _ => new IconCalendar()
        }
            .Add(new ControlQuickfilterItemDropdownItem("sprint-current")
            {
                Text = _ => "Current",
                Badge = _ => "14",
                PrimaryAction = _ => new ActionFilter() { Group = "sprint", Exclusive = true }
            })
            .Add(new ControlQuickfilterItemDropdownItem("sprint-next")
            {
                Text = _ => "Next",
                PrimaryAction = _ => new ActionFilter() { Group = "sprint", Exclusive = true }
            }),
        new ControlQuickfilterItemAvatar("assignee-guybrush")
        {
            Text = _ => "Guybrush Threepwood",
            Initials = _ => "GT",
            Color = _ => "#1d4ed8",
            PrimaryAction = _ => new ActionFilter() { Group = "assignee" }
        },
        new ControlQuickfilterItemAdd("newfilter")
        {
            Tooltip = _ => "Create a new filter",
            PrimaryAction = _ => new ActionModal("filtermodal")
        }
    );
```

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

    <!-- A chip opening a dialog in which a new filter is defined -->
    <button class="wx-quickfilter-add"
            title="Create a new filter"
            data-wx-primary-action="modal"
            data-wx-primary-target="#filtermodal">
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