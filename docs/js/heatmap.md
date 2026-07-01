![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# HeatMapCtrl

The `HeatMapCtrl` component renders a **read-only** grid of numeric values, colouring each cell on a gradient between a low and a high colour. It is purely a display control for spotting patterns and outliers at a glance (activity over time, correlation matrices, density grids) and does not allow user interaction.

```
        c1   c2   c3
   r1  ░░   ▒▒   ██
   r2  ▒▒   ██   ░░
```

## Configuration

Initialization is handled declaratively through `data-` attributes on the host element.

| Attribute          | Description
|--------------------|--------------------------------------------------------------------------------------------------
| `data-values`      | The grid, serialized as rows separated by `;` and cells by `,`, e.g. `1,2,3;4,5,6`. Numbers are culture independent (decimal point).
| `data-min`         | (Optional) The value mapped to the low colour. Defaults to the smallest value in the grid.
| `data-max`         | (Optional) The value mapped to the high colour. Defaults to the largest value in the grid.
| `data-row-labels`  | (Optional) Comma separated row (vertical axis) labels, one per row.
| `data-col-labels`  | (Optional) Comma separated column (horizontal axis) labels, one per column.
| `data-low-color`   | (Optional) The colour a minimum value is shown in, as a hex colour (`#rgb` or `#rrggbb`). Defaults to a light tint.
| `data-high-color`  | (Optional) The colour a maximum value is shown in. Defaults to a saturated blue.

- **CSS Classes**: The component adds the class `.wx-heatmap` to the host element and lays the cells out in a CSS grid (`.wx-heatmap-cell`, `.wx-heatmap-row-label`, `.wx-heatmap-col-label`).
- **Cell size**: Driven by the `--wx-heatmap-cell` custom property (default `1.5rem`); override it inline or per theme.
- **Accessibility**: The component sets `role="img"` and `aria-readonly="true"` and generates an `aria-label` in the format "Heat map: [rows]x[cols]".

## Functionality

- **Static Rendering**: The component renders a CSS grid with an optional column-label header and an optional row label per row.
- **Gradient Interpolation**: Each cell's background is interpolated linearly between `data-low-color` and `data-high-color` by the normalized value `(value - min) / (max - min)`. A zero-width range maps every cell to the high colour.
- **Missing Cells**: A non-numeric or absent cell renders as a dashed placeholder (`.wx-heatmap-cell-empty`) rather than a low value, so a gap in the data reads as a gap.
- **Read-Only Display**: The component is strictly for visualization; there are no click or hover events that change the data.

## Programmatic Control

The grid can be updated dynamically via the JavaScript instance.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('activity');

// retrieve the controller instance associated with the element
const heatmap = webexpress.webui.Controller.getInstanceByElement(element);

if (heatmap) {
    // read the current grid
    const grid = heatmap.values; // [[1, 2, 3], [4, 5, 6]]

    // set a new grid (a 2D array or the serialized "1,2;3,4" token); the cells re-colour
    heatmap.values = [[6, 5, 4], [3, 2, 1]];
}
```

### Manual Instantiation

```javascript
// find the container element
const container = document.getElementById('dynamic-heatmap');

// configure the grid before instantiation
container.dataset.values = "1,2,3;4,5,6";
container.dataset.lowColor = "#deebf7";
container.dataset.highColor = "#08306b";

// create a new instance manually
const heatmap = new webexpress.webui.HeatMapCtrl(container);
```

## Use Case Example

The following example declares a 2x3 heat map with labelled axes and a blue gradient.

```html
<!--
    The host element defines the heat map control.
    It renders two labelled rows of three coloured cells each.
-->
<div id="activity"
     class="wx-webui-heatmap"
     data-values="1,2,3;4,5,6"
     data-row-labels="Mon,Tue"
     data-col-labels="A,B,C"
     data-low-color="#deebf7"
     data-high-color="#08306b">
</div>
```
