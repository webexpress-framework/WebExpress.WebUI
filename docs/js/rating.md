![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# RatingCtrl

The `RatingCtrl` component is designed to display a read-only star rating. It visualizes a numeric value by rendering a corresponding number of filled or empty stars. This control is purely for display purposes (e.g., showing product reviews or user scores) and does not allow user interaction to change the value.

The component automatically handles value normalization (clamping between 0 and the total number of stars) and provides accessibility support via ARIA attributes.

```
   ┌─────────────────────────┐
   │  ★ ★ ★ ☆ ☆           │
   └─────────────────────────┘
```

## Configuration

Initialization is handled declaratively through `data-` attributes on the host element.

| Attribute    | Description
|--------------|--------------------------------------------------------------------------------------
| `data-stars` | (Optional) The total number of stars to display. Defaults to `5` if not specified or invalid.
| `data-value` | The initial numeric value of the rating.

- **CSS Classes**: The component automatically adds the class `.wx-rating-view` to the host element.
- **Icons**: It utilizes FontAwesome classes (`fas fa-star` for filled, `far fa-star` for empty) to render the stars.
- **Accessibility**: The component automatically sets `aria-readonly="true"`. If no `aria-label` is provided, it generates one in the format "Rating: [value] / [total]".

## Functionality

- **Static Rendering**: The component renders a container with a defined number of star icons.
- **Value Normalization**: Input values are parsed as integers. If a value is less than 0, it becomes 0. If it exceeds the total number of stars, it is capped at the total.
- **Read-Only Display**: The component is strictly for visualization. There are no click or hover events bound to the stars that would allow the user to modify the rating.
- **Reactive Updates**: Changing the `value` programmatically triggers a re-render of the stars and updates the `aria-label` immediately.

## Programmatic Control

The component's value can be updated dynamically via its JavaScript instance.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('product-rating');

// retrieve the controller instance associated with the element
const ratingCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (ratingCtrl) {
    // get the current rating value
    const currentRating = ratingCtrl.value;

    // set a new rating programmatically
    // this will re-render the stars to show 4 out of 5 (or whatever total is set)
    ratingCtrl.value = 4;
}
```

### Manual Instantiation

```javascript
// find the container element
const container = document.getElementById('dynamic-rating-container');

// ensure configuration attributes are set before instantiation if needed
container.dataset.stars = "10";
container.dataset.value = "7";

// create a new instance of RatingCtrl manually
const dynamicRatingCtrl = new webexpress.webui.RatingCtrl(container);

// update the value later
dynamicRatingCtrl.value = 9;
```

## Use Case Example

The following example shows how to declare a 5-star rating control with an initial value of 3.

```html
<!--
    The host element defines the rating control.
    It will display 5 stars in total, with 3 filled.
-->
<div id="user-score"
     class="wx-webui-rating"
     data-stars="5"
     data-value="3">
</div>
```