![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# Steps

The step indicator shows the progress through a sequence of steps as a numbered, connected
row. Unlike most entries in this section it has no controller of its own: it is a pure
markup and stylesheet contract (`webexpress.webui.steps.css`). It is emitted by the
server-side `ControlSteps` and, at runtime, by the REST wizard, which builds the same
markup for its header — so a wizard header and a stepper placed on a page look alike.

```
   ┌────────────────────────────────────────────────────────────┐
   │  (✓) Account ─────── (2) Profile ─────── (3) Confirm       │
   │      Done                In progress         Pending       │
   └────────────────────────────────────────────────────────────┘
```

## Markup

| Class                       | Description
|-----------------------------|--------------------------------------------------------------
| `wx-steps`                  | The container of the indicator.
| `wx-steps-item`             | One step. It holds a marker and a text block.
| `wx-steps-marker`           | The circle in front of the text: the position of the step, or a check once it is completed.
| `wx-steps-text`             | The text block of a step.
| `wx-steps-label`            | The title of the step.
| `wx-steps-description`      | (Optional) The secondary line below the title.

### States

Every step carries exactly one state class. The connector in front of a step is drawn in
the completed colour whenever the step has been reached, because the step it comes from is
finished by then.

| Class                       | Meaning
|-----------------------------|--------------------------------------------------------------
| `wx-steps-item-pending`     | Not reached yet. Muted marker and label.
| `wx-steps-item-active`      | The step the user is on. Marker in the primary colour.
| `wx-steps-item-completed`   | Finished. Marker in the success colour, showing a check.

### Layout variants

| Class                       | Description
|-----------------------------|--------------------------------------------------------------
| *(none)*                    | Horizontal, marker above the text, steps of equal width.
| `wx-steps-inline`           | Horizontal, marker beside the text, the connectors stretching between the steps. This is the shape a dialog header needs; long labels are truncated rather than wrapped.
| `wx-steps-vertical`         | Stacked top to bottom, marker beside the text.

## Use Case Example

```html
<div class="wx-steps wx-steps-inline">

    <div class="wx-steps-item wx-steps-item-completed">
        <span class="wx-steps-marker">✓</span>
        <div class="wx-steps-text">
            <span class="wx-steps-label">Account</span>
            <span class="wx-steps-description">john@example.com</span>
        </div>
    </div>

    <div class="wx-steps-item wx-steps-item-active">
        <span class="wx-steps-marker">2</span>
        <div class="wx-steps-text">
            <span class="wx-steps-label">Profile</span>
            <span class="wx-steps-description">Tell us about yourself</span>
        </div>
    </div>

    <div class="wx-steps-item wx-steps-item-pending">
        <span class="wx-steps-marker">3</span>
        <div class="wx-steps-text">
            <span class="wx-steps-label">Confirm</span>
        </div>
    </div>
</div>
```

The server-side counterpart is `ControlSteps` with its `ControlStepsItem` entries, whose
`Vertical` and `Inline` properties select the layout variants above; see the API
documentation.
