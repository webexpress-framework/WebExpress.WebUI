![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# SectionCtrl

The `SectionCtrl` component turns a host element into a flat, collapsible section: a quiet label row over a body of content, without the frame, background or shadow of a card. It is meant for a page that shows one subject from many angles — a reading view, a settings page, a detail pane — where a stack of framed boxes would make the borders compete with the content for the reader's attention.

A section separates by typography and whitespace instead: a small upper-case label, a generous gap to the section above, and an optional vertical guide line down the left of the body that ties the content back to its label without enclosing it.

```
   ▼ [Icon] LABEL                         [Note]   // Interactive header row
   │
   │   [Collapsible body]                          // Guide line + body
   │
```

Initialization is declarative: the content is placed directly inside the host element and the behavior is driven by `data-` attributes. The C# counterpart is `WebExpress.WebUI.WebControl.ControlSection`, which emits exactly this host element.

### Configuration

| Attribute                | Description
|--------------------------|-----------------------------------------------------------------------------------------------------
| `data-header`            | The section label. It is rendered upper-case and doubles as the accessible name of the toggle.
| `data-header-icon-css`   | CSS classes of a glyph icon placed before the label.
| `data-header-icon-image` | URL of an image icon placed before the label. Takes precedence over `data-header-icon-css`.
| `data-note`              | A short trailing note set apart from the label — a count, a state, a date. It stays visible while the section is folded, so a closed section can still report what is inside it.
| `data-badge`             | A filled pill directly after the label. Unlike the note it carries a color, so it is read before the label it follows.
| `data-badge-bg-class`    | The CSS class of a system badge color (`text-bg-danger`, …).
| `data-badge-bg-style`    | The inline style of a user-defined badge color (`background:gold;`).
| `data-color-class`       | The CSS class of a system accent color (`text-primary`, …).
| `data-color-style`       | The inline style of a user-defined accent color (`color:gold;`).
| `data-label-css`         | Extra CSS classes for the label element. The escape hatch for a label that needs a class the control does not model; prefer the accent.
| `data-collapsible`       | `"false"` renders a section that cannot be folded: no chevron, an inert label row, and a body that is always shown. Defaults to `"true"`.
| `data-expanded`          | The initial state. Applies on first render only; a remembered state takes precedence. Defaults to `"true"`.
| `data-guide`             | `"false"` drops the vertical guide line. Switch it off for a body that draws its own structure (a table, a board) and would read as doubly framed. Defaults to `"true"`.
| `data-persist`           | `"false"` forgets the folded state on reload. A section without an `id` is never remembered regardless of this setting. Defaults to `"true"`.

### Building a section from JavaScript

A control that composes its own UI can construct a section directly and hang its affordances off three public accessors, instead of reaching into the private structure:

| Accessor        | What it is
|-----------------|--------------------------------------------------------------------------
| `headerElement` | The header row. Append a menu button, a badge of your own kind, anything that belongs beside the label.
| `titleElement`  | The label element, for restyling or renaming it in place.
| `bodyElement`   | The body, where the adopted content lives.

This is the path `KanbanCtrl` takes for its swimlanes and `FrameCtrl` for its error box. Two attributes exist mainly for it: `data-label-css`, for a label that has to carry a host component's class, and the `wx-section-verbatim` class described below.

```javascript
const lane = document.createElement("section");
lane.className = "wx-kanban-swimlane wx-section-verbatim";
lane.dataset.header = "Team A";
lane.dataset.labelCss = "wx-kanban-swimlane-header";
lane.dataset.guide = "false";
lane.dataset.persist = "false";

const ctrl = new webexpress.webui.SectionCtrl(lane);
ctrl.headerElement.appendChild(buildLaneMenu());
```

A section is flat by construction, so a host that wants a surface paints its own element — the swimlane brings `.wx-kanban-swimlane`, the error box a bootstrap `alert`.

### Layout

The layout is a class on the host element rather than a `data-` attribute, because it changes nothing the client has to drive — it is set in C# through `Layout` and emitted as the class named below.

| Layout    | Class               | Reads as
|-----------|---------------------|--------------------------------------------------------------------------
| `Stacked` | *(none)*            | Label row above the body, which hangs off the vertical guide line. The default: it reads top to bottom and survives any column width.
| `Aside`   | `wx-section-aside`  | The label moves into a column of its own beside the body, and the guide line becomes the divider between the two — a definition list at section scale. It needs the width, so below `48rem` it falls back to the stacked layout.
| `Rule`    | `wx-section-rule`   | The label is followed by a hairline running across the remaining width, and the body sits indented below it without a guide. The strongest horizontal break of the three, for a long page whose sections a reader scrolls past rather than compares. The guide line is not drawn here — the rule already separates — but the body keeps the step the guide would have given it, so it still reads as belonging to its label.

### Label

The label is set in upper case, which is what makes it read as structure rather than as content — right for the word that names a part of a page (`DETAILS`, `STATUS`). It is wrong for a label that is a name or a sentence: upper case turns a name into a shout and a sentence into a headline. Set `Uppercase` to `false` (class `wx-section-verbatim`) there, and the label keeps the spelling and the size it was given.

### Features

- **Declarative body**: Any HTML placed within the host element becomes the collapsible body. The component takes ownership of these child elements upon initialization.
- **Flat by construction**: The stylesheet gives the section no border, no background, no radius and no shadow. The only line it draws is the guide down the left of the body.
- **Accent, not fill**: The accent color is applied to the host, so the label, its icon and the guide line inherit it while the body is reset to the body color — an accented paragraph would say something the author did not mean to say. A filled background is deliberately not offered: it would put back the box the section exists to avoid.
- **Badge over note**: A badge is a filled pill with a color of its own, read before the label it follows; a note is a quiet trailing line. Use the badge for something that demands attention (`3 overdue`) and the note for something that merely informs (`last updated yesterday`). Both survive folding.
- **Remembered state**: A reader who folds a section away keeps that view on the next visit. The state is stored under `wx-section:<id>` in `localStorage`; a host that denies storage still gets a working section, just a forgetful one.
- **Accessible toggle**: A collapsible section renders its label row as a `<button>` carrying `aria-expanded` and `aria-controls`; the chevron is marked `aria-hidden` because it repeats what the button already says.
- **Overflow-safe folding**: The fold animates a `1fr`/`0fr` grid, which gives it a height to animate that no fixed value could know in advance. The body is clipped only while it moves, so a dropdown or popover inside an open section is free to overflow it. The clip is lifted on `transitionend` and, for hosts where the transition never runs, on a timer.

### Programmatic Control

#### 1. Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('object-comments-section');

// retrieve the controller instance associated with the element
const section = webexpress.webui.Controller.getInstanceByElement(element);

if (section) {
    // fold the section away, or bring it back
    section.toggle();

    // report the number of comments beside the label
    section.note = '12';

    // and flag the ones that need an answer
    section.badge = '2 unanswered';
}
```

#### 2. Manual Instantiation

```javascript
// find the container element for the dynamic section
const container = document.getElementById('dynamic-section');

// create a new instance manually
const section = new webexpress.webui.SectionCtrl(container);

// the label and the trailing note can be set after construction
section.header = 'Attachments';
section.note = '3 files';
section.expanded = false;
```

### Events

- **`webexpress.webui.Event.CHANGE_VISIBILITY_EVENT`**: Fired after the section was folded or unfolded. The `detail` object carries the new state (`true` for shown, `false` for folded).

### Styling

All colours come from the bootstrap CSS variables shipped with `WebExpress.WebUI`, so a section follows the light / dark switch without extra rules. The rhythm is exposed as custom properties on `.wx-section` and can be re-declared per zone:

| Property                      | Purpose
|-------------------------------|-----------------------------------------------------------------------------
| `--wx-section-gap`            | The gap below a section — the separator that replaces the card border.
| `--wx-section-label-size`     | The type size of the label and the note.
| `--wx-section-label-spacing`  | The letter spacing of the upper-case label.
| `--wx-section-guide-offset`   | The distance between the label column and the guide line.
| `--wx-section-guide-gap`      | The distance between the guide line and the body.
| `--wx-section-rule-indent`    | The indent of the body in the `Rule` layout, which draws no guide. Defaults to the step the guide would have made.
| `--wx-section-duration`       | The length of the fold.
| `--wx-section-aside-column`   | The width of the label column in the `Aside` layout.

```css
/* a narrow column of short sections breathes in smaller steps than a content column */
#wx-content-property .wx-section {
    --wx-section-gap: 1.25rem;
    --wx-section-guide-gap: 0.75rem;
}
```

### Use Case Example

```html
<!--
    A section that is folded away by default and reports its content while closed.
    The body is any markup placed inside the host element.
-->
<section id="object-comments-section"
         class="wx-webui-section"
         data-header="Comments"
         data-header-icon-css="wx-icon-light wx-icon-light-comments"
         data-note="12"
         data-expanded="false">

    <!-- This content becomes the collapsible body. -->
    <div class="wx-comment-list">
        <p>The conversation about this object.</p>
    </div>
</section>
```

### Choosing Between a Section and a Card

Use a [Card](card.md) when the page shows several unrelated things and each needs to be told apart from its neighbours at a glance. Use a section when the page shows **one** subject and the parts are facets of it: the card's frame would then draw a boundary where the content has none, and every frame costs the padding it needs to look intentional.
