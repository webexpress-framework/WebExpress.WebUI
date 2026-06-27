![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# ScrumBacklogCtrl

The `ScrumBacklogCtrl` class is a specialized UI component for managing agile backlogs within modern web applications. It focuses on the structured presentation of active sprints, planned sprints, and the unassigned backlog. Data provisioning is handled seamlessly via a REST API or through embedded static configurations. Integrated features include drag-and-drop mechanics for moving tasks between different sections and a native dialog for creating new sprints, which utilizes existing date input components.

```
   ┌───────────────────────────────────────────────────────────┐
   │ Backlog                                        [+ Create] │ // Toolbar
   ├───────────────────────────────────────────────────────────┤
   │ [ACTIVE] Sprint 24               4 items  21 pts  [...]   │ // Section Header
   ├───────────────────────────────────────────────────────────┤
   │ [S] MVP-1   Implement login screen      [P1] (8) (GT) [→] │ // Draggable Row (points · assignee)
   ├───────────────────────────────────────────────────────────┤
   │ [PLANNED] Sprint 25              0 items   0 pts  [...]   │
   ├───────────────────────────────────────────────────────────┤
   │ [BACKLOG] Backlog               12 items  45 pts          │
   └───────────────────────────────────────────────────────────┘
```

The following core features define the structure, behavior, and flexibility of the backlog component:

- **Declarative configuration:** Base settings and data sources are defined via `data-` attributes on the host element.
- **REST integration:** Automatic loading and saving of sprints and backlog items through a defined API endpoint (`data-rest-uri`).
- **Drag & Drop:** Tasks can be intuitively moved between backlog and planned sprints using standard `dataTransfer` mechanics.
- **Sprint management:** An integrated dialog allows creating new sprints by specifying name, goal, timeframe, and capacity.
- **Assignment & estimation:** Every item shows its story-point estimate and, when assigned, the assignee's avatar. A context-menu action opens a dialog to (re)assign a person and adjust the estimate.
- **Static fallbacks:** If no backend is available, the component can be initialized using embedded JSON via `<script type="application/json">`.

## Structure & Configuration

The backlog component is initialized through a declarative markup structure that cleanly separates configuration from visual presentation.

## Host Attributes

Host attributes define the essential connection parameters and labels directly on the component’s root element.

| Attribute       | Description |
|-----------------|-------------|
| `data-rest-uri` | Defines the REST API endpoint for loading and saving sprint and backlog data |
| `data-title`    | Overrides the default component title (default: “Backlog”) |

## Events

The following events represent the primary interaction points for reacting to loading operations and user actions:

- `webexpress.webui.Event.DATA_REQUESTED_EVENT`
- `webexpress.webui.Event.DATA_ARRIVED_EVENT`
- `webexpress.webui.Event.MOVE_EVENT`
- `webexpress.webui.Event.ADD_EVENT`
- `webexpress.webui.Event.UPDATED_EVENT`

## Example Markup

The following example illustrates a minimal setup in which the component fetches its data on its own through the given REST URI.


```html
<div class="wx-webui-scrum-backlog" 
     data-rest-uri="/api/scrum/backlog" 
     data-title="Project Alpha Backlog">
</div>

## Programmatic Control

Programmatic control lets you interact with the backlog directly through JavaScript APIs. This is particularly useful for updating data dynamically or moving tasks programmatically.

Accessing an Automatically Created Instance
When the component has already been initialized through the markup, the controller can be retrieved and modified:

```js
const backlogCtrl = webexpress.webui.Controller.getInstanceByElement(document.getElementById('my-backlog'));
backlogCtrl.moveItemToSprint('item_123', 'sp_2');
```

## Manual Instantiation

New controller instances can be created dynamically to retain full control over the initialization timing.

```js
const div = document.createElement('div');
const ctrl = new webexpress.webui.ScrumBacklogCtrl(div);
ctrl.data = {
    sprints: [{ id: 'sp_1', name: 'Sprint 1', status: 'active' }],
    items: [{ id: 'i_1', title: 'Task 1', points: 5, sprintId: 'sp_1' }]
};
document.body.appendChild(div);

```

## Assignment & estimation

Each backlog and sprint item carries a story-point estimate and an optional assignee. The estimate is rendered as a points badge; when the item is assigned, the assignee is shown as a small avatar (the initials on the person's color), otherwise an empty placeholder.

### Item fields

| Field              | Description |
|--------------------|-------------|
| `points`           | The story-point estimate, shown as the points badge. |
| `assigneeId`       | Id of the assigned person, or omitted/empty when unassigned. |
| `assigneeName`     | Display name of the assignee (used for the avatar tooltip). |
| `assigneeInitials` | Short text shown inside the avatar. |
| `assigneeColor`    | CSS color used as the avatar background. |

### Assigning and estimating

Right-clicking a single item adds an **“Assign & estimate…”** entry to the context menu. It opens a dialog with a searchable, avatar-based assignee picker and a story-point scale. The candidates are queried once from the optional **users service** — a second `wx-service` island named `users`, authored in C# with `.UsersService<TEndpoint>()` — via `GET {users}?q=…`, returning `[{ id, name, initials, color, team, image? }]`, and are then filtered client-side as you type. Each candidate is shown with an avatar (an `image` when supplied, otherwise the initials on the person's color), the name and the team.

The story-point scale is the configurable set of chips offered for the estimate. It is authored in C# through the `EstimationScale` property (emitted as the comma-separated `data-estimation-scale` attribute) and defaults to a rounded Fibonacci sequence (`0, 1, 2, 3, 5, 8, 13, 20, 40, 100`) when left unset.

Saving the dialog applies the change optimistically and persists it:

| Method | URL                 | Body                                  | Purpose
|--------|---------------------|---------------------------------------|----------------------------------
| `PUT`  | `{base}/items/{id}` | `{ "assigneeId": "u3", "points": 8 }` | Update an item's assignment and estimate.

An empty or omitted `assigneeId` unassigns the item; an omitted `points` leaves the existing estimate unchanged. On a failed request the board reloads to reconcile with the server state.

Authored in C# with the fluent data surface, the data service backs the board and the users service backs the assignee picker:

```csharp
new ControlDataScrumBacklog("backlog")
{
    EstimationScale = _ => [1, 2, 3, 5, 8, 13, 20, 40]
}
    .DataService<BacklogRestApi>()
    .UsersService<UsersRestApi>();
```

On the server, the backlog endpoint extends `RestApiScrumBacklog<TSprint, TItem>` and overrides `UpdateItem(item, payload, request)` to apply the new `assigneeId` and `points`.

# ScrumSprintCtrl

The `ScrumSprintCtrl` class extends the agile toolset with a detailed dashboard view for an active sprint. It visualizes key metrics such as goal progress, capacity utilization, and includes an automatically generated SVG-based burndown chart. This component is read-only and designed for quickly assessing the current sprint status.

```
   ┌─────────────────┬───────────┬───────────┬─────────────┐
   │ ACTIVE SPRINT   │ PROGRESS  │ CAPACITY  │ BURNDOWN    │
   │ Sprint 24       │ 18 / 47   │ 47 / 60   │ |\          │
   │   MVP Goal      │ [====   ] │ [====== ] │ |  \        │
   │ [Start] [End]   │ 38% done  │ 13 free   │ |____\____  │
   └─────────────────┴───────────┴───────────┴─────────────┘
```

## Extra Features

Beyond pure data presentation, the sprint dashboard offers advanced visual aids for monitoring team performance.

Automatic burndown chart: Generates a responsive SVG line chart from the supplied actual and target values.
Trend analysis: Automatically derives textual trend indicators ("on track", "behind", "ahead") based on the deviation from the ideal line.
Capacity warnings: Automatically colors the progress bars when the committed story points exceed the team capacity.

## Additional Configuration

The sprint overview is configured analogously to the backlog, primarily through the definition of the data source.

|Attribute     |Description
|--------------|-----------------------------
|data-rest-uri |Defines the REST API endpoint for retrieving the metrics of the active sprint

## Events

The sprint component emits events regarding its lifecycle and data updates.

webexpress.webui.Event.DATA_REQUESTED_EVENT (fired before the sprint data is loaded)
webexpress.webui.Event.DATA_ARRIVED_EVENT (fired after a successful load)
webexpress.webui.Event.UPDATED_EVENT (fired after every render pass)

## Example Markup

The following example shows how to embed the sprint dashboard through declarative markup. A static fallback can optionally be provided via a script block.

```HTML
<div class="wx-webui-scrum-sprint" data-rest-uri="/api/scrum/sprint/active">
    <script type="application/json">
        {
            "name": "Fallback Sprint",
            "capacity": 50,
            "committedPoints": 0
        }
    </script>
</div>
```

## Programmatic Control
Direct interaction via JavaScript makes it possible to feed the dashboard with new metrics in real time, without relying on cyclic REST polling.

## Accessing Instance
Existing instances can be retrieved and overwritten with updated objects, which triggers an immediate re-rendering.

```js
const sprintCtrl = webexpress.webui.Controller.getInstanceByElement(document.getElementById('active-sprint'));
sprintCtrl.sprint = updatedSprintObjectFromWebsocket;
```

## Manual Instantiation

Manual creation is suited to single-page applications where views are built up and discarded dynamically.

```js
const div = document.createElement('div');
const sprintCtrl = new webexpress.webui.ScrumSprintCtrl(div);
sprintCtrl.sprint = {
    name: "Sprint 99",
    status: "active",
    capacity: 40,
    committedPoints: 38,
    burndown: { ideal: [38, 0], actual: [38] }
};
document.body.appendChild(div);
```

## Best Practices & Advanced Integration

It is recommended to use `ScrumBacklogCtrl` as the primary planning tool, while `ScrumSprintCtrl` should be placed on dedicated dashboard or daily-scrum views.
For offline scenarios or automated tests, use the static data injection via `<script type="application/json">` to eliminate network dependencies.
Combining both components on an overview page ideally requires synchronized data handling in the background so that changes in the backlog are reflected immediately in the sprint dashboard.