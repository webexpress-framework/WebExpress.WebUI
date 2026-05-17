![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# ScrumBacklogCtrl

The `ScrumBacklogCtrl` class is a specialized UI component for managing agile backlogs within modern web applications. It focuses on the structured presentation of active sprints, planned sprints, and the unassigned backlog. Data provisioning is handled seamlessly via a REST API or through embedded static configurations. Integrated features include drag-and-drop mechanics for moving tasks between different sections and a native dialog for creating new sprints, which utilizes existing date input components.

```
   ┌───────────────────────────────────────────────────────────┐
   │ Backlog                                     [+ Erstellen] │ // Toolbar
   ├───────────────────────────────────────────────────────────┤
   │ [ACTIVE] Sprint 24               4 items  21 pts  [...]   │ // Section Header
   ├───────────────────────────────────────────────────────────┤
   │ [S] MVP-1   Login-Seite implementieren      [P1]  (8) [→] │ // Draggable Row
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

Das folgende Beispiel illustriert ein minimales Setup, bei dem die Komponente ihre Daten selbstständig über die angegebene REST-URI bezieht.


```html
<div class="wx-webui-scrum-backlog" 
     data-rest-uri="/api/scrum/backlog" 
     data-title="Project Alpha Backlog">
</div>

## Programmatic Control

Die programmatische Steuerung erlaubt es, direkt über JavaScript-APIs mit dem Backlog zu interagieren. Dies ist besonders nützlich, um Daten dynamisch zu aktualisieren oder Aufgaben systemgesteuert zu verschieben.

Accessing an Automatically Created Instance
Wenn die Komponente bereits durch das Markup initialisiert wurde, kann der Controller abgerufen und modifiziert werden:

```js
const backlogCtrl = webexpress.webui.Controller.getInstanceByElement(document.getElementById('my-backlog'));
backlogCtrl.moveItemToSprint('item_123', 'sp_2');
```

## Manual Instantiation

Neue Controller-Instanzen können dynamisch erzeugt werden, um die volle Kontrolle über den Initialisierungszeitpunkt zu behalten.

```js
const div = document.createElement('div');
const ctrl = new webexpress.webui.ScrumBacklogCtrl(div);
ctrl.data = {
    sprints: [{ id: 'sp_1', name: 'Sprint 1', status: 'active' }],
    items: [{ id: 'i_1', title: 'Task 1', points: 5, sprintId: 'sp_1' }]
};
document.body.appendChild(div);

```

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

Zusätzlich zur reinen Datendarstellung bietet das Sprint-Dashboard erweiterte visuelle Hilfsmittel zur Überwachung der Team-Performance.

Automatisches Burndown-Chart: Generiert ein responsives SVG-Liniendiagramm aus den übermittelten Ist- und Soll-Werten.
Trend-Analyse: Berechnet automatisiert textuelle Trend-Indikatoren ("on track", "behind", "ahead") basierend auf der Abweichung zur Ideallinie.
Kapazitäts-Warnungen: Färbt Fortschrittsbalken automatisch ein, wenn die zugesagten Story-Points die Teamkapazität überschreiten.

## Additional Configuration

Die Konfiguration der Sprint-Übersicht erfolgt analog zum Backlog primär über die Definition der Datenquelle.

|Attribute     |Description
|--------------|-----------------------------
|data-rest-uri |Definiert den REST-API-Endpunkt für den Abruf der Metriken des aktiven Sprints

## Events

Die Sprint-Komponente emittiert Ereignisse bezüglich ihres Lebenszyklus und der Datenaktualisierung.

webexpress.webui.Event.DATA_REQUESTED_EVENT (wird vor dem Laden der Sprint-Daten ausgelöst)
webexpress.webui.Event.DATA_ARRIVED_EVENT (wird nach dem erfolgreichen Laden ausgelöst)
webexpress.webui.Event.UPDATED_EVENT (wird nach jedem Render-Durchlauf ausgelöst)

## Example Markup

Das folgende Beispiel zeigt die Einbindung des Sprint-Dashboards über deklaratives Markup. Ein statisches Fallback kann optional über einen Skript-Block bereitgestellt werden.

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
Die direkte Interaktion via JavaScript ermöglicht es, das Dashboard in Echtzeit mit neuen Metriken zu versorgen, ohne auf zyklische REST-Abfragen angewiesen zu sein.

## Accessing Instance
Bestehende Instanzen können abgerufen und mit aktualisierten Objekten überschrieben werden, was ein sofortiges Re-Rendering auslöst.

```js
const sprintCtrl = webexpress.webui.Controller.getInstanceByElement(document.getElementById('active-sprint'));
sprintCtrl.sprint = updatedSprintObjectFromWebsocket;
```

## Manual Instantiation

Die manuelle Erzeugung eignet sich für Single-Page-Applications, in denen Ansichten dynamisch aufgebaut und verworfen werden.

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

Es wird empfohlen, `ScrumBacklogCtrl` als primäres Werkzeug für das Planning zu nutzen, während `ScrumSprintCtrl` auf dedizierten Dashboard- oder Daily-Scrum-Ansichten platziert werden sollte.
Für Offline-Szenarien oder automatisierte Tests sollte die statische Dateninjektion via `<script type="application/json">` genutzt werden, um Netzwerkabhängigkeiten zu eliminieren.
Eine Kombination beider Komponenten auf einer Übersichtsseite erfordert idealerweise eine synchronisierte Datenhaltung im Hintergrund, um Änderungen im Backlog sofort im Sprint-Dashboard zu reflektieren.