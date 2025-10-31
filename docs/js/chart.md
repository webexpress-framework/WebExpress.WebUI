![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# ChartCtrl

The ChartCtrl component provides a modern and flexible solution for embedding and managing charts based on Chart.js in WebExpress WebUI applications. Both declarative and programmatic usage are supported. ChartCtrl is designed for easy integration, supporting a wide range of chart types and offering a fluent API for chaining configuration and data updates.

```
   ┌────────────────────────────────────┐
   │           Revenue in €             │  // Title (optional)
   │                                    │
   │        ░                   ░       │  // Bars/Lines depending on type
   │   ░    ░              ░    ░       │
   │   ░    ░    ░    ░    ░    ░       │
   │                                    │
   │  Jan  Feb  Mar  Apr  May  Jun      │  // Labels
   └────────────────────────────────────┘
```

## Declarative Configuration

Declarative configuration allows developers to define charts directly within HTML using `data-` attributes. This approach makes the integration of charts simple and maintainable, as all key Chart.js options can be set via attributes on the host element. The component automatically reads and maps these attributes into the required Chart.js configuration structure.

**Host Element Attributes:**

| Attribute                       | Description
|---------------------------------|------------------------------------------------------------------------------------------------------
| `data-type`                     | Chart type (e.g. `line`, `bar`, `pie`, `doughnut`, `radar`, `polarArea`, `bubble`, `scatter`)
| `data-labels`                   | JSON array of labels for the X-axis, e.g. `["January","February","March"]`
| `data-datasets`                 | JSON array of Chart.js dataset objects, e.g. `[{"label":"Revenue","data":[...]}]`
| `data-options`                  | JSON object with Chart.js options, e.g. `{"responsive":true,"maintainAspectRatio":false}`
| `data-config`                   | Full Chart.js config as JSON object; overrides defaults and is merged with other sources
| `data-dataset-label`            | Convenience field for a single dataset: display label
| `data-dataset-data`             | Convenience field (JSON array) for a single dataset
| `data-dataset-background-color` | Convenience field: background color (string or array)
| `data-dataset-border-color`     | Convenience field: border color (string or array)
| `data-dataset-border-width`     | Convenience field: border width (number)
| `data-autoload`                 | If `true` (default), the chart is created immediately after parsing the attributes
| `data-height`                   | Height of the canvas (e.g. `300px` or `40%`). If omitted, a reasonable default is used.

Additional options can be split into their own attributes, such as:
- `data-responsive`
- `data-maintain-aspect-ratio`
- `data-index-axis`
- `data-scale-y-begin-at-zero`
- `data-scale-y-title`
- `data-scale-x-begin-at-zero`
- `data-scale-x-title`
- `data-legend-display`
- `data-title-display`
- `data-title-text`

Attributes from `data-config` and `data-options` are deeply merged, while arrays are replaced. Convenience fields for a single dataset are only used if `data-datasets` is not set.

## Architecture and Functionality

ChartCtrl is designed as a lightweight, reactive controller that makes integrating Chart.js charts straightforward. It automatically creates a `<canvas>` in the host element, supports responsive options, allows dynamic switching of chart type and data at runtime, and signals errors via events for robust error handling.

- Multiple chart types supported; type can be changed dynamically
- Declarative configuration via HTML attributes for data, datasets, and options
- Automatic canvas creation if not present
- Responsive behavior through Chart.js options
- Fluent API: All set/update methods return the instance for chaining
- Error handling: Events signal issues during creation or updating
- Manual and automatic loading: Controlled via `data-autoload` or the `load()` API

## Programmatic Control

After initialization, ChartCtrl can be controlled programmatically using a fluent API, allowing dynamic updates and reloading. The instance can be accessed automatically from the DOM or explicitly created via JavaScript.

**Accessing an automatically created instance:**

```javascript
// get an existing controller instance from a host element
const element = document.getElementById("my-chart");
const chartCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (chartCtrl) {
    chartCtrl
        .type("bar")
        .labels(["January", "February", "March", "April"])
        .datasets([
            { label: "Revenue in €", data: [1200, 1900, 3000, 2500] }
        ])
        .options({ responsive: true, maintainAspectRatio: false })
        .load();
}
```

**Manual instantiation using the fluent API:**

```javascript
const host = document.getElementById("chart-container");
const ctrl = new webexpress.webui.ChartCtrl(host)
    .type("line")
    .labels(["Jan", "Feb", "Mar", "Apr", "May", "Jun"])
    .datasets([
        {
            label: "Throughput",
            data: [10, 20, 12, 30, 28, 35],
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderWidth: 2
        }
    ])
    .options({
        responsive: true,
        maintainAspectRatio: false
    })
    .load();
```

Available fluent methods include:

- `type(string)` – Sets the chart type and reloads
- `labels(string[])` – Sets axis labels
- `datasets(object[])` – Replaces datasets
- `addDataset(object)` / `removeDataset(index)` – Adds or removes a dataset
- `options(object)` – Deep merges options and updates
- `data(object)` / `updateData(object)` – Replaces the full Chart.js data structure
- `config(object)` – Replaces the entire configuration and reloads
- `load()` – Creates or updates the chart
- `resize()` – Triggers a resize
- `destroy()` – Destroys the instance and releases resources

Getters:

- `chart` – Returns the current Chart.js instance (`Chart|null`)
- `currentConfig` – Returns the current configuration

## Event Handling

ChartCtrl communicates status changes and errors via events, enabling robust integration and error handling in more complex UI logic.

- `webexpress.webui.Event.DATA_REQUESTED_EVENT`  
  Fired before creating/updating the chart. `event.detail.config` contains the configuration.
- `webexpress.webui.Event.DATA_ARRIVED_EVENT`  
  Fired after successful creation/update. `event.detail.chart` contains the Chart.js instance.

```javascript
document.addEventListener(webexpress.webui.Event.DATA_ARRIVED_EVENT, function(event) {
    console.log("Chart created:", !!event.detail.chart);
});
```

## Usage Example

To directly embed a chart, use the following example. All configuration is provided via HTML attributes, and the chart is created automatically.

```html
<div id="my-chart"
     class="wx-webui-chart"
     data-type="bar"
     data-labels='["January","February","March","April","May","June"]'
     data-dataset-label="Revenue in €"
     data-dataset-data='[1200,1900,3000,500,2500,3200]'
     data-dataset-background-color="rgba(54, 162, 235, 0.2)"
     data-dataset-border-color="rgba(54, 162, 235, 1)"
     data-dataset-border-width="1"
     data-responsive="true"
     data-maintain-aspect-ratio="false"
     data-scale-y-begin-at-zero="true"
     data-scale-y-title="Month"
     data-title-display="true"
     data-title-text="Revenue Overview">
</div>
```

Optionally, the height of the canvas can be set using the `data-height` attribute:

```html
<div class="wx-webui-chart"
     data-type="line"
     data-height="280px"
     data-labels='["Q1","Q2","Q3","Q4"]'
     data-dataset-label="Gross Margin"
     data-dataset-data='[42,58,61,73]'>
</div>
```