![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# Disjunctive Normal Form

A disjunctive normal form (DNF) is a filter written as a disjunction of
conjunctions: `[[A,B],[C],[D,E]]` reads as `(A AND B) OR (C) OR (D AND E)`. It
is the shape almost every "show me the rows that match any of these
combinations" filter really has, and this control family lets a user build one
without learning a query language.

Three pieces make up the family:

| Component        | Marker class            | Purpose
|------------------|-------------------------|--------------------------------------------------
| `InputDnfCtrl`   | `wx-webui-input-dnf`    | Builds and edits an expression.
| `DnfCtrl`        | `wx-webui-dnf`          | Displays an expression; also the read view of the smart edit.
| `DnfValue`       | —                       | Parses, serializes and evaluates the notation.

The REST backed twins live in `WebExpress.WebApp`; see
[Dnf](../../../WebExpress.WebApp/docs/js/dnf.md).

## The notation

Both dimensions travel in one string, so the expression fits a single hidden
form field and a single table cell:

```
a;b|c        ->  [["a","b"],["c"]]   ->  (a AND b) OR (c)
a;b          ->  [["a","b"]]         ->  (a AND b)
a            ->  [["a"]]             ->  a
```

- `;` separates the terms of one conjunction (AND).
- `|` separates the conjunctions (OR).

A one-group expression is byte for byte the semicolon list every other selection
control already speaks, which is what lets a plain selection value be adopted by
a DNF control — and a DNF value be read by anything that only understands
selections — without conversion.

> **Term ids must not contain `;` or `|`.** They are the separators, and the
> notation carries no escaping. Ids are entity keys in practice, so this is a
> constraint rather than a restriction.

## `DnfValue`

A static helper with no DOM or network dependency, so the notation can be
exercised on its own.

| Method                              | Description
|-------------------------------------|-------------------------------------------------------------
| `parse(value)`                       | Reads any accepted shape into `[[id, …], …]`.
| `format(groups)`                     | Serializes back into the transport string.
| `equals(left, right)`                | Compares by meaning, not by notation.
| `terms(value)`                       | Every term id used anywhere, once, in first-use order.
| `toText(value, label, and, or)`      | Renders the expression as readable text.

`parse` accepts the serialized string, a flat id list (which *is* a single
conjunction), a list of groups, and the object lists a REST payload produces:

```javascript
webexpress.webui.DnfValue.parse("a;b|c");                  // [["a","b"],["c"]]
webexpress.webui.DnfValue.parse(["a", "b"]);               // [["a","b"]]
webexpress.webui.DnfValue.parse([[{id:"a"}], [{id:"b"}]]); // [["a"],["b"]]
```

Parsing normalizes: a blank term, a term repeated inside one conjunction
(`A AND A` is `A`) and a conjunction that ended up empty all describe nothing
and are dropped.

```javascript
webexpress.webui.DnfValue.parse("a; ;a|;|b");  // [["a"],["b"]]
```

`toText` brackets a conjunction only where the precedence is in question, so a
lone conjunction reads without noise:

```javascript
webexpress.webui.DnfValue.toText("a;b",   null, "and", "or");  // "a and b"
webexpress.webui.DnfValue.toText("a;b|c", null, "and", "or");  // "(a and b) or c"
```

# InputDnfCtrl

Builds the expression as a stack of selection fields. What a user picks inside
one field is combined with AND; the fields are combined with OR. The picker is
not reinvented for this: every conjunction is an ordinary multi-select
[`InputSelectionCtrl`](selection.md), so filtering, icons, colors and the chip
rendering behave exactly as they do in a plain selection field.

```
   ┌ AND ───────────────────────────────────────┬───┐
   │ [Amsterdam ×] [Berlin ×]               [v] │ × │   // conjunction
   └────────────────────────────────────────────┴───┘
   ─────────────────── OR ───────────────────────────   // disjunction
   ┌────────────────────────────────────────────┬───┐
   │ [Cairo ×]                              [v] │ × │
   └────────────────────────────────────────────┴───┘
              [+ Add expression]
```

The **AND marker** appears only while a conjunction actually holds more than one
term, so it states a fact about the current expression instead of decorating
every group with an operator it does not use.

**The first group is permanent.** It is the expression itself, so its close icon
empties it rather than deleting it — an expression without a single conjunction
would have nothing left to edit. Every further group's close icon removes the
whole conjunction.

## Configuration

| Attribute          | Description                                                        | Example
|--------------------|--------------------------------------------------------------------|-----------------------------
| `name`             | The name of the hidden input the expression is submitted in.       | `name="filter"`
| `data-value`       | The initial expression.                                            | `data-value="a;b|c"`
| `data-max-groups`  | The maximum number of conjunctions. Absent means unlimited.        | `data-max-groups="3"`
| `placeholder`      | Shown in a conjunction that holds no term yet.                     | `placeholder="Pick a term…"`

The selectable terms are declared as child elements with the class
`.wx-selection-item`, exactly as for the selection control:

- `id` — the term id, which is what the expression stores.
- `data-label` — the display text.
- `data-icon` / `data-image` — an icon reference or image URL.
- `data-color` — a `wx-selection-…` class applied to the chip.
- `disabled` — marks the term as non-selectable.

## Programmatic control

```javascript
const element = document.getElementById("filter");
const dnf = webexpress.webui.Controller.getInstanceByElement(element);

dnf.value;                       // [["a","b"],["c"]]
dnf.value = "a;b|c";             // string, or [["a","b"],["c"]], or null to clear
dnf.options = [ { id: "a", label: "Amsterdam" } ];
dnf.maxGroups = 3;               // -1 for unlimited
dnf.groupCount;                  // number of conjunctions currently shown

dnf.addGroup(["a"]);             // false when the limit is reached
dnf.removeGroup(1);              // false for index 0 - the first group is permanent
dnf.clearGroup(0);               // empties a conjunction without removing it
```

Assigning an expression of the same size writes into the groups that already
exist rather than into freshly built ones, so a re-assignment of the same shape
leaves open dropdowns and scroll positions alone.

## Events

- `webexpress.webui.Event.CHANGE_VALUE_EVENT` — the expression changed. Fired
  **once** per change, carrying the whole expression: a change inside one group
  is absorbed and answered as a change of the expression, so a host is never
  handed half of the value. Building the control is not a change and fires
  nothing.
- `webexpress.webui.Event.ADD_EVENT` — a conjunction was added.
- `webexpress.webui.Event.REMOVE_EVENT` — a conjunction was removed.

```javascript
element.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, (e) => {
    console.log(e.detail.value);   // [["a","b"],["c"]]
});
```

## Extending: the group seam

`_createGroupControl(editor)` is the one method a variant replaces. The
structure of the expression, the operators and the group handling stay the same
whether the terms are declared in the markup or queried from an endpoint — only
the picker differs.

```javascript
_createGroupControl(editor) {
    return new webexpress.webui.InputSelectionCtrl(editor);
}
```

It is called from the constructor, so an override may **not** rely on its own
class fields (they are initialized after `super()` returns). State it needs has
to be reachable through the host element. The REST variant stashes its service
descriptor there for exactly this reason.

## Use case example

```html
<div id="filter"
     class="wx-webui-input-dnf"
     name="filter"
     data-value="role-admin;role-editor|role-owner"
     data-max-groups="4"
     placeholder="Pick a role…">

    <div id="role-admin"  class="wx-selection-item" data-icon="user-shield">Administrator</div>
    <div id="role-editor" class="wx-selection-item" data-icon="user-pen">Editor</div>
    <div id="role-owner"  class="wx-selection-item" data-icon="crown">Owner</div>
    <div id="role-viewer" class="wx-selection-item" data-icon="user">Viewer</div>
</div>
```

This reads as *"(Administrator AND Editor) OR Owner"* and submits
`filter=role-admin;role-editor|role-owner`.

# DnfCtrl

Displays an expression without offering to change it. The terms of a conjunction
are rendered as chips joined by the AND word, and the conjunctions are separated
by the OR word, so both levels stay distinguishable without the reader knowing
the notation.

```
   (Amsterdam and Berlin)  or  Cairo
```

The operators are **real nodes**, not pseudo-elements: they are part of the
accessible text and survive a copy of the rendered expression.

## Configuration

| Attribute          | Description
|--------------------|--------------------------------------------------------------------
| `data-value`       | The expression to display.
| `data-compact`     | `"true"` clips the expression to a single line (see below).
| `data-placeholder` | Text shown in place of an empty expression.

The terms are declared as `.wx-selection-item` children, as for the input.

**A term without a registered option still shows — as itself.** A value that
arrived before its options did would otherwise read as an empty expression,
which is the one thing a filter must never claim falsely. Assigning `options`
later relabels the expression already on screen.

## Compact mode

A table cell is far narrower than the expression it may hold, so the compact
form renders one line that clips instead of a cell that grows the row. The full
expression stays reachable in the element's `title`.

```javascript
ctrl.compact = true;
element.getAttribute("title");   // "(Amsterdam and Berlin) or Cairo"
```

## Programmatic control

```javascript
const dnf = webexpress.webui.Controller.getInstanceByElement(element);

dnf.value = "a;b|c";
dnf.options = [{ id: "a", label: "Amsterdam" }];
dnf.compact = true;
dnf.text;      // "(Amsterdam and Berlin) or Cairo"
```

## Use case example

```html
<div id="filter-display"
     class="wx-webui-dnf"
     data-value="role-admin;role-editor|role-owner"
     data-placeholder="No filter">

    <div id="role-admin"  class="wx-selection-item" data-label="Administrator"></div>
    <div id="role-editor" class="wx-selection-item" data-label="Editor"></div>
    <div id="role-owner"  class="wx-selection-item" data-label="Owner"></div>
</div>
```

# Smart edit

`DnfCtrl` is the read view [`SmartEditCtrl`](smartedit.md) shows for an
`InputDnfCtrl`, so an expression is edited in place instead of in a separate
view. The raw value is the serialized expression — separators and term ids —
which is the one thing a reader of a filter should not be shown; the read view
resolves it into terms joined by the operator words.

```html
<div class="wx-webui-smart-edit" data-object-name="filter" data-form-action="/api/1/filters/42">
    <div class="wx-webui-input-dnf" name="filter" data-value="a;b|c">
        <div id="a" class="wx-selection-item" data-label="Amsterdam"></div>
        <div id="b" class="wx-selection-item" data-label="Berlin"></div>
        <div id="c" class="wx-selection-item" data-label="Cairo"></div>
    </div>
</div>
```

The control's hidden field carries the whole expression under the configured
name, so the smart edit drops the field it would otherwise reserve for the
value and the expression travels exactly once in the form data.

# Table template

The `dnf` column template renders an expression in a table. In the read state it
uses `DnfCtrl` in compact mode; in the editable state it mounts an
`InputDnfCtrl` inside a `SmartEditCtrl`.

| Option        | Description
|---------------|-----------------------------------------------------------------
| `editable`    | `true` mounts the smart edit.
| `placeholder` | Shown in a conjunction that holds no term yet.
| `maxGroups`   | The maximum number of conjunctions.
| `compact`     | `"false"` lets the expression wrap instead of clipping.
| `options`     | The terms, as an embedded JSON array (REST rendered tables).

The terms arrive either as the template's child elements (a server rendered
table) or as embedded JSON (a REST rendered table); `TableTemplates.dnfOptions`
reads both. A malformed option list costs the labels, not the expression — the
controls fall back to rendering the term ids themselves.

The `rest_dnf` template queries its terms from an endpoint instead; see
[Dnf](../../../WebExpress.WebApp/docs/js/dnf.md).

# Internationalization

| Key                          | English           | German
|------------------------------|-------------------|--------------------------
| `webexpress.webui:dnf.and`   | and               | und
| `webexpress.webui:dnf.or`    | or                | oder
| `webexpress.webui:dnf.add`   | Add expression    | Ausdruck hinzufügen
| `webexpress.webui:dnf.remove`| Remove expression | Ausdruck entfernen
| `webexpress.webui:dnf.clear` | Clear expression  | Ausdruck leeren
