![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# ChartCtrl

The `ChartCtrl` component draws charts - line, bar, pie, doughnut, radar, polar area, bubble and scatter - directly as SVG. It is part of WebExpress WebUI and needs no third-party charting library: the drawing, the scales, the legend, the tooltip and the accessible reading of the values are all built in. Charts can be declared in HTML through `data-` attributes (this is what the server-side `ControlChart` renders) or driven from JavaScript through a fluent API.

```
   ┌────────────────────────────────────┐
   │           Revenue in €             │  // title (optional)
   │        ■ 2024   ■ 2025             │  // legend: toggles a series
   │  3000 ┤        ▐▌                  │
   │  2000 ┤   ▐▌   ▐▌        ▐▌        │  // bars, lines, slices ... depending on the type
   │  1000 ┤▐▌ ▐▌▐▌ ▐▌▐▌ ▐▌   ▐▌▐▌      │
   │     0 ┼──────────────────────────  │
   │        Jan  Feb  Mar  Apr  May     │  // category labels
   └────────────────────────────────────┘
```

## Declarative Configuration

The chart reads its configuration from `data-` attributes on the host element and removes them once they are read, so the markup stays clean.

**General attributes:**

| Attribute                         | Description
|-----------------------------------|------------------------------------------------------------------------------------------------------
| `data-type`                       | Chart type: `line`, `bar`, `pie`, `doughnut`, `radar`, `polarArea`, `bubble` or `scatter`. Defaults to `line`.
| `data-labels`                     | JSON array of the category labels (x axis, slices or radar spokes), e.g. `["Jan","Feb","Mar"]`.
| `data-datasets`                   | JSON array of dataset objects (see [Datasets](#datasets)). Takes precedence over the dataset attributes below.
| `data-options`                    | JSON object of options (see [Options](#options)), deep-merged into the defaults.
| `data-config`                     | A complete configuration `{ type, data, options }` as JSON; the lowest priority of all sources.
| `data-autoload`                   | `true` (default) draws the chart right away; `false` waits for `load()`.
| `data-height`                     | Height of the drawing in pixels (`300`, `300px`) or as a percentage of the container (`40%`). Defaults to 300 pixels.
| `data-width`                      | A fixed maximum width in pixels. Without it the chart takes the width of its container.
| `data-responsive`                 | `true` (default) redraws the chart when its container changes size; `false` keeps the first size.
| `data-maintain-aspect-ratio`      | `true` derives the height from the width (2:1, radial charts 1:1) when no `data-height` is set.
| `data-index-axis`                 | `y` turns a bar chart into horizontal bars.
| `data-legend-display`             | `true` / `false` shows or hides the legend. Without it the legend appears for two or more datasets, and always for pie, doughnut and polar area charts.
| `data-title-display`              | `true` shows the title.
| `data-title-text`                 | The title text; it also names the chart for assistive technology.
| `data-scale-x-title`, `data-scale-y-title` | Axis titles.
| `data-scale-x-begin-at-zero`, `data-scale-y-begin-at-zero` | `true` makes the scale include zero.
| `data-scale-x-min`, `data-scale-x-max`, `data-scale-y-min`, `data-scale-y-max` | Fixed scale bounds.
| `data-scale-y1-title`, `data-scale-y1-min`, `data-scale-y1-max`, `data-scale-y1-begin-at-zero` | Title, bounds and zero baseline of the second value axis (`ControlChart.TitleY1`, `MinimumY1`, `MaximumY1`, `Y1BeginAtZero`).

**Dataset attributes.** The datasets are numbered from zero (`data-dataset0-*`, `data-dataset1-*`, ...); `data-dataset-count` tells how many there are. A chart with a single dataset may leave out the number (`data-dataset-label`, `data-dataset-data`, ...).

| Attribute                           | Description
|-------------------------------------|----------------------------------------------------------------------------------------------------
| `data-datasetN-label`               | The name of the dataset, shown in the legend, the tooltip and the data table.
| `data-datasetN-data`                | JSON array of the values: numbers, `[x, y]` / `{ "x": .., "y": .. }` points (scatter) or `[x, y, r]` / `{ "x": .., "y": .., "r": .. }` points (bubble). `null` leaves a gap.
| `data-datasetN-background-color`    | Fill color of bars, slices, areas and bubbles. Any CSS color, including `var(--wx-...)`.
| `data-datasetN-border-color`        | Line and outline color.
| `data-datasetN-border-width`        | Line and outline width in pixels.
| `data-datasetN-fill`                | `origin`, `start` or `end` fills the area of a line dataset.
| `data-datasetN-point-style`         | Marker shape of the points: `circle`, `triangle`, `rect`, `rectRounded`, `rectRot`, `cross`, `crossRot`, `star` or `false`.
| `data-datasetN-curve`               | `bezier` or `monotone` lets a line dataset run as a curve (see [Curves](#curves)).
| `data-datasetN-tension`             | How far a Bezier curve swings out, from `0` to `1`; defaults to `0.4`.
| `data-datasetN-trendline`           | `linear` or `moving-average` draws a trendline through the dataset (see [Trendlines](#trendlines)).
| `data-datasetN-trendline-period`    | The number of points a moving average averages over; defaults to 3.
| `data-datasetN-type`                | `bar` or `line` draws the dataset in that form within a line or bar chart (`ControlChartDataset.Type`).
| `data-datasetN-y-axis-id`           | The value axis of the dataset, e.g. `y1` for the second axis at the right edge (`ControlChartDataset.YAxisId`).

Attributes override `data-options`, which overrides a constructor configuration, which overrides `data-config`. Objects are deep-merged, arrays are replaced.

### Datasets

A dataset object (in `data-datasets`, `datasets()` or `addDataset()`) knows the following keys:

| Key               | Description
|-------------------|-----------------------------------------------------------------------------------------------------------
| `label`           | The name of the dataset.
| `data`            | The values (see above).
| `backgroundColor` | A color, or an array of colors with one color per value (per bar, per slice).
| `borderColor`     | A color, or an array of colors.
| `borderWidth`     | A width in pixels, or an array of widths.
| `type`            | `bar` or `line` mixes both forms on one category axis, e.g. a line for the target over bars for the actual values. In C# it is `ControlChartDataset.Type` (`TypeDatasetChart`).
| `fill`            | `true` / `origin`, `start`, `end` or `false` for line datasets.
| `tension`         | Lets a line run as a Bezier curve: how far it swings out, between `0` (straight segments, default) and `1` (see [Curves](#curves)).
| `cubicInterpolationMode` | `"monotone"` lets a line run as a monotone curve (see [Curves](#curves)).
| `pointStyle`      | The marker shape (see above); `false` draws no markers.
| `pointRadius`     | The marker radius in pixels.
| `showLine`        | `false` draws only the markers of a line dataset.
| `spanGaps`        | `true` bridges `null` values instead of breaking the line.
| `hidden`          | `true` starts the dataset hidden; the legend can show it.
| `maxBarThickness` | The maximum bar thickness in pixels (default 24).
| `yAxisID`         | `"y1"` (any id other than `"y"`) measures the dataset on a second value axis at the right edge, configured under `scales.y1` - e.g. a revenue line over unit bars. Vertical line and bar charts only. In C# it is `ControlChartDataset.YAxisId`.
| `trendline`       | `true` / `"linear"`, `"movingAverage"`, or an object `{ type, period, color }` (see [Trendlines](#trendlines)).

### Curves

A line dataset runs straight from point to point by default. Two curves are available, both drawn as cubic Bezier segments through the data points:

| Curve      | Description
|------------|-----------------------------------------------------------------------------------------------------------------
| Bezier     | The tangent at a point follows its neighbours; `tension` (0 to 1, attribute default 0.4) sets how far the curve swings out. Between two points it may swing past their values; its control points are held inside the plot, so it never leaves the drawing.
| Monotone   | The tangent is flat where the data turns and limited where it would carry the curve past a neighbour (Fritsch-Carlson). The curve never swings past its points, so every peak in the drawing is a peak in the data - the right choice for measured values.

A filled line follows its curve, and a stacked area rests on the curve of the series beneath it.

```javascript
ctrl.datasets([
    { label: "Load", data: [32, 45, 41, 58, 52, 30, 24], tension: 0.5, fill: true },
    { label: "Temperature", data: [4, 5, 16, 6, 7, 18, 8], cubicInterpolationMode: "monotone" }
]);
```

In C#, `Curve = TypeCurveChart.Bezier` (with an optional `Tension`) or `Curve = TypeCurveChart.Monotone` is set on the dataset.

### Trendlines

A dataset of a line, bar (vertical or horizontal), scatter or bubble chart can carry a trendline, which shows the direction of the data besides its single values. Pie, doughnut, polar area and radar charts ignore the option, as their data has no course along an axis.

| Type            | Description
|-----------------|-----------------------------------------------------------------------------------------------------------
| `linear`        | A straight line fitted by least squares over the plotted points (in a stacked chart over the stacked heights). It runs from the first to the last point, and the scale makes room for it.
| `movingAverage` | The average over a sliding window of `period` points (default 3), starting at the first point where the window is full. It smooths the noise and keeps the course.

The trendline is drawn dashed in a shade of its series (`color` sets its own), enters after its series, is hidden together with it through the legend and appears in the tooltip (as "Series · Trend") and as a column of its own in the data table. Over bars it is lifted off with a ring of the surface color.

```javascript
ctrl.datasets([
    { label: "Revenue", data: [12, 15, 13, 18, 17, 21, 24], trendline: "linear" },
    { label: "Tickets", data: [14, 9, 17, 12, 20, 15, 23], trendline: { type: "movingAverage", period: 3 } }
]);
```

In C# the trendline is set on the dataset:

```csharp
new ControlChartDataset
{
    Title = "Tickets",
    Data = new ControlChartDatasetPointCollection(14f, 9f, 17f, 12f, 20f, 15f, 23f),
    Trendline = TypeTrendlineChart.MovingAverage,
    TrendlinePeriod = 3
}
```

The computations are available as static helpers: `ChartCtrl.linearRegression(points)` returns `{ slope, intercept }` and `ChartCtrl.movingAverage(values, period)` the averages.

### Options

The options follow a nested structure; the most important keys are:

| Key                                  | Description
|--------------------------------------|----------------------------------------------------------------------------------------
| `plugins.title.display`, `.text`     | The title.
| `plugins.legend.display`, `.position`| The legend; `position: "bottom"` puts it below the chart.
| `scales.x` / `scales.y`              | Per axis: `min`, `max`, `suggestedMin`, `suggestedMax`, `beginAtZero`, `stacked`, `title: { display, text }`, `grid: { display }`.
| `scales.y1`                          | The second value axis of the datasets with `yAxisID: "y1"`, drawn at the right (`position: "right"`): `min`, `max`, `suggestedMin`, `suggestedMax`, `beginAtZero`, `title`. It has its own ticks and stacks but no grid lines, which would cross those of `scales.y`.
| `scales.r`                           | The radial scale of radar and polar area charts: `min`, `max`, `beginAtZero`.
| `indexAxis`                          | `"y"` for horizontal bars.
| `cutout`                             | The hole of a doughnut, e.g. `"50%"` (default) or a pixel value.
| `rotation`, `circumference`          | Start angle and covered angle of a pie or doughnut, in degrees.
| `responsive`, `maintainAspectRatio`, `aspectRatio` | Size behaviour (see the attributes above).
| `maxBarThickness`                    | The maximum bar thickness of every bar dataset.

## Architecture and Functionality

`ChartCtrl` builds the chart from plain SVG elements inside the host and draws it again whenever the data, the options or the size change.

- **Self-contained drawing**: the scales use round steps (1, 2 or 5 times a power of ten); bars grow from zero with a rounded data end, lines may be curved and filled, pie and doughnut slices are separated by a gap in the surface color.
- **Theme-aware colors**: the series take their color from an eight-color palette defined as CSS custom properties (`--wx-chart-1` ... `--wx-chart-8`), with own steps for the dark theme. The order of the palette keeps neighbouring series apart for the common color vision deficiencies. A dataset's own colors (`backgroundColor`, `borderColor`) take precedence. A color follows its dataset: hiding a series does not repaint the others.
- **Motion**: on `load()` every mark enters from where its value starts - bars grow staggered out of their baseline, lines draw themselves while their points pop up, areas fade in, slices turn into the circle, radar and polar marks grow out of the center. A legend toggle or a data update lets the chart ease into its new state, and a series shown again grows back in; a resize redraws without movement. All movement is CSS and is switched off when the reader asks for reduced motion (`prefers-reduced-motion`). A chart drawn while its host still has no size (a hidden tab, a dashboard card not yet placed) plays its entry once it is laid out.
- **Legend**: every entry is a toggle button that hides or shows its dataset (its slice for pie, doughnut and polar area charts).
- **Tooltip**: the pointer shows the values of the category, slice or point beneath it. The tooltip fades in, glides from mark to mark and points at the mark with a caret; line charts get a crosshair, bar charts a highlighted band, both gliding along. The other marks step back, a hovered pie or doughnut slice steps out of the circle.
- **Doughnut center**: a doughnut with a single ring shows its total in the hole, and the share of the hovered slice while one is hovered.
- **Areas**: a filled line without its own `backgroundColor` fades out towards its baseline with a gradient of the series color.
- **Keyboard**: the chart is focusable; the arrow keys, `Home` and `End` walk the categories and announce their values through a polite live region, `Escape` closes the tooltip.
- **Accessibility**: the drawing carries `role="img"` and the title as its name; a visually hidden table holds all values, so nothing depends on color or on seeing the chart. Animations respect `prefers-reduced-motion`.
- **Responsive**: a `ResizeObserver` redraws the chart for the width of its container.

**CSS classes** (for theming): `.wx-chart` (host), `.wx-chart-title`, `.wx-chart-legend`, `.wx-chart-legend-item`, `.wx-chart-plot`, `.wx-chart-tooltip`, and inside the SVG `.wx-chart-grid`, `.wx-chart-tick`, `.wx-chart-axis-title`, `.wx-chart-bar`, `.wx-chart-line`, `.wx-chart-area`, `.wx-chart-point`, `.wx-chart-arc`, `.wx-chart-polar`, `.wx-chart-radar`, `.wx-chart-bubble`. The entries use the classes `.wx-chart-enter-*` with the delay `--wx-chart-delay` and the easing `--wx-chart-ease`. The palette can be replaced per theme or per chart by overriding `--wx-chart-1` ... `--wx-chart-8`:

```css
/* a chart in brand colors */
#revenue {
    --wx-chart-1: var(--wx-primary);
    --wx-chart-2: var(--wx-highlight);
}
```

## Programmatic Control

After initialization, `ChartCtrl` can be controlled through a fluent API. Every change to a chart that is already drawn redraws it at once; before the first draw (with `data-autoload="false"`) the changes wait for `load()`.

**Accessing an automatically created instance:**

```javascript
// get the controller of a chart rendered by the server
const element = document.getElementById("my-chart");
const chartCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (chartCtrl) {
    chartCtrl
        .labels(["January", "February", "March", "April"])
        .datasets([
            { label: "Revenue in €", data: [1200, 1900, 3000, 2500] }
        ])
        .type("bar");
}
```

**Manual instantiation:**

```javascript
const host = document.getElementById("chart-container");
host.setAttribute("data-autoload", "false");

const ctrl = new webexpress.webui.ChartCtrl(host)
    .labels(["Jan", "Feb", "Mar", "Apr", "May", "Jun"])
    .datasets([
        { label: "Throughput", data: [10, 20, 12, 30, 28, 35], fill: true, tension: 0.3 },
        { label: "Target", data: [15, 15, 20, 20, 25, 25], pointStyle: false }
    ])
    .options({ scales: { y: { beginAtZero: true, title: { display: true, text: "Jobs" } } } })
    .load();
```

**A configuration object** can also be passed to the constructor:

```javascript
new webexpress.webui.ChartCtrl(host, {
    type: "doughnut",
    data: {
        labels: ["Chrome", "Firefox", "Edge"],
        datasets: [{ label: "Users", data: [55, 20, 25] }]
    },
    options: { plugins: { legend: { position: "bottom" } } }
});
```

Available methods (all return the instance for chaining):

- `type(string)` – Switches the chart type and redraws the chart
- `labels(string[])` – Replaces the labels
- `datasets(object[])` – Replaces the datasets
- `addDataset(object)` / `removeDataset(index)` – Adds or removes a dataset
- `options(object)` – Deep-merges options
- `data(object)` / `updateData(object)` – Replaces the whole data object `{ labels, datasets }`
- `config(object)` – Replaces the whole configuration `{ type, data, options }` and redraws the chart
- `load()` – Draws the chart (again)
- `resize()` – Redraws the chart for the current size of its container
- `destroy()` – Removes the drawing, the listeners and the resize observer

Getters:

- `chart` – The `<svg>` element the chart is drawn in (`null` before the first draw)
- `currentConfig` – The current configuration `{ type, data, options }`

Static helpers:

- `ChartCtrl.isSupportedType(type)` – Tells whether a chart type can be drawn
- `ChartCtrl.niceScale(min, max, maxTicks, fixedMin?, fixedMax?)` – Computes a scale with round ticks
- `ChartCtrl.linearRegression(points)` – Fits `{ slope, intercept }` through `{ x, y }` points by least squares
- `ChartCtrl.movingAverage(values, period)` – Averages over a sliding window

## Event Handling

- `webexpress.webui.Event.DATA_REQUESTED_EVENT`  
  Fired before the chart is drawn by `load()`. `event.detail.config` holds the configuration.
- `webexpress.webui.Event.DATA_ARRIVED_EVENT`  
  Fired after the chart was drawn. `event.detail.chart` holds the `<svg>` element.
- `webexpress.webui.Event.DATA_ERROR_EVENT`  
  Fired when the chart cannot be drawn, e.g. for an unsupported type. `event.detail.error` describes the problem; the chart keeps its previous state.

```javascript
document.addEventListener(webexpress.webui.Event.DATA_ERROR_EVENT, (event) => {
    console.warn("chart failed:", event.detail.error);
});
```

## Usage Example

A bar chart with two datasets, declared as `ControlChart` renders it:

```html
<div id="my-chart"
     class="wx-webui-chart"
     data-type="bar"
     data-labels='["January","February","March","April","May","June"]'
     data-title-display="true"
     data-title-text="Revenue Overview"
     data-scale-y-begin-at-zero="true"
     data-scale-y-title="Revenue in €"
     data-height="280"
     data-dataset-count="2"
     data-dataset0-label="2024"
     data-dataset0-data='[1200,1900,3000,500,2500,3200]'
     data-dataset1-label="2025"
     data-dataset1-data='[1500,2100,2800,900,2700,3600]'>
</div>
```

A filled line with square markers and a single dataset (no legend is needed, the title names it):

```html
<div class="wx-webui-chart"
     data-type="line"
     data-labels='["Q1","Q2","Q3","Q4"]'
     data-title-display="true"
     data-title-text="Gross Margin"
     data-dataset-label="Gross Margin"
     data-dataset-data='[42,58,61,73]'
     data-dataset-fill="origin"
     data-dataset-point-style="rect">
</div>
```

Horizontal, stacked bars through `data-options`:

```html
<div class="wx-webui-chart"
     data-type="bar"
     data-index-axis="y"
     data-labels='["Team A","Team B","Team C"]'
     data-options='{"scales":{"x":{"stacked":true},"y":{"stacked":true}}}'
     data-datasets='[{"label":"Done","data":[12,9,14]},{"label":"Open","data":[3,6,2]}]'>
</div>
```
