![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# SpreadsheetCtrl

The `SpreadsheetCtrl` component provides an editable workbook with multiple sheets, formulas, cell formatting, clipboard operations and undo history. The host element declares the initial workbook and display options through HTML attributes. The controller exposes the same operations programmatically and supports forms, JSON endpoints and collaborative editing.

```text
+--------------------------------------------------------------+
| Undo  Redo | Clipboard | Font | Format | Structure | Find      |
+---------+----------------------------------------------------+
| Name B4 | fx [ =SUM(B2:B3)                                  ] |
+---------+-------------+-------------+-------------+-----------+
|         | A           | B           | C           | D         |
+---------+-------------+-------------+-------------+-----------+
| 1       | Item        | Amount      |             |           |
| 2       | Rent        | 1200        |             |           |
| 3       | Supplies    | 150         |             |           |
| 4       | Total       | 1350        |             |           |
+---------+-------------+-------------+-------------+-----------+
| Budget | Forecast | +                                  100 %  |
+--------------------------------------------------------------+
| Ready                              Sum: 1350 | Count: 2       |
+--------------------------------------------------------------+
```

The control implements the field and saving interfaces described in the [control contract](contract.md). Its toolbar, formula bar, sheet tabs and status bar can be configured independently.

## Declarative Configuration

The host element uses the `wx-webui-spreadsheet` class for automatic initialization. HTML attributes configure the initial workbook, available controls, form integration and persistence endpoints.

| Attribute | Description | Default | Example
|-----------|-------------|---------|--------
| `class` | Registers the host for automatic initialization. | | `class="wx-webui-spreadsheet"`
| `value`, `data-wx-state` or JSON text content | Supplies the initial workbook, in that precedence order. | One empty sheet | `value='{"sheets":[{"name":"Budget"}]}'`
| `name`, `data-name` | Defines the hidden form input that submits the workbook as JSON. | No form input | `name="budget"`
| `data-locale` | Selects input and display conventions. | Page language, then `en` | `data-locale="de"`
| `data-readonly`, `readonly` | Prevents editing while keeping the workbook visible. | `false` | `data-readonly="true"`
| `disabled`, `data-disabled` | Disables the control. An enclosing disabled fieldset also applies. | `false` | `data-disabled="true"`
| `data-toolbar` | Shows or hides the toolbar. | `true` | `data-toolbar="false"`
| `data-formula-bar` | Shows or hides the name box and formula bar. | `true` | `data-formula-bar="false"`
| `data-sheet-tabs` | Shows or hides the sheet tabs. | `true` | `data-sheet-tabs="false"`
| `data-status-bar` | Shows or hides the status bar. | `true` | `data-status-bar="false"`
| `data-rows`, `data-cols` | Supplies default sheet dimensions when workbook dimensions are omitted. | `1000`, `26` | `data-rows="100" data-cols="12"`
| `data-active-sheet` | Selects the initial sheet by ID or name. | Workbook selection or first sheet | `data-active-sheet="Budget"`
| `data-zoom` | Sets the initial zoom percentage, clamped to 25 through 400. | `100` | `data-zoom="125"`
| `data-history-limit` | Sets the maximum number of undo steps. | `500` | `data-history-limit="200"`
| `data-history-merge` | Sets the time window in milliseconds for merging related history entries. | `1000` | `data-history-merge="500"`
| `data-load-uri` | Loads JSON when no initial workbook is supplied. | Unset | `data-load-uri="/api/budget"`
| `data-save-uri` | Sets the endpoint used by `save()`. | Unset | `data-save-uri="/api/budget"`
| `data-save-method` | Sets the HTTP method used by `save()`. | `PUT` | `data-save-method="POST"`
| `data-autosave` | Debounces saving after changes, in milliseconds. Requires a save endpoint. | Off | `data-autosave="1500"`
| `data-fill` | Fills the available page or dialog height using `--wx-spreadsheet-fill-offset`. | `false` | `data-fill="true"`
| `data-user-name` | Supplies the default comment author and collaborator name. | Empty | `data-user-name="Anna"`
| `style` | Sets the grid height through `--wx-spreadsheet-height`. | `28rem` | `style="--wx-spreadsheet-height: 30rem"`

Configuration attributes are read during construction. Use the controller properties and methods to update an initialized spreadsheet.

### Workbook Data

A workbook is JSON. The control reads it from the `value` attribute, from `data-wx-state`, from JSON text content or from a load address, and exposes it through the `value` property.

```json
{
  "version": 1,
  "sheets": [
    {
      "id": "s1",
      "name": "Budget",
      "rowCount": 1000,
      "colCount": 26,
      "cells": {
        "A1": { "v": "Item", "s": { "bold": true, "fill": "#eeeeee" } },
        "B2": { "v": 1200, "s": { "nf": "#,##0.00 €" } },
        "B3": { "f": "=SUM(B2:B2)", "r": 1200 },
        "C2": { "v": 46315, "s": { "nf": "dd.mm.yyyy" }, "c": { "text": "Due date", "author": "Ann" } },
        "D2": { "v": true, "t": "checkbox" }
      },
      "rows": { "0": { "size": 32 } },
      "cols": { "0": { "size": 160, "s": { "bold": true } }, "4": { "hidden": true } },
      "merges": ["A10:C10"],
      "frozen": { "rows": 1, "cols": 0 },
      "props": { "tabColor": "#4472c4", "gridlines": true }
    }
  ],
  "names": { "Rent": "Budget!$B$2" },
  "styles": { "good": { "fill": "#c6efce", "color": "#006100" } },
  "meta": { "title": "Budget 2026" }
}
```

#### Cells

Cell objects separate values, formulas, presentation and metadata. The supported fields are listed below.

| Field | Meaning
|-------|---------
| `v`   | The value: number, text or truth value. Typed cells may hold JSON data (a link `{ href, text }`).
| `f`   | The formula, starting with `=`. A formula replaces the value.
| `r`   | The last result of a formula, written when the value is produced (errors as `{ "error": "#DIV/0!" }`). It is ignored when reading; the engine recalculates.
| `t`   | The custom type, such as `checkbox`, `link` or `list` (see [Custom cell types](#custom-cell-types)).
| `s`   | The own style of the cell.
| `st`  | The name of a format template from `styles`.
| `c`   | The comment, as text or `{ text, author, time }`.
| `m`   | Free metadata, such as `{ "options": ["Open", "Done"] }` for a list cell.

Dates are serial numbers counting days since 1899-12-30. Their fractional part represents the time of day, and a date format controls their display. This is how the common spreadsheets store them, and it keeps date arithmetic plain arithmetic (`=B2-A2` is the number of days between two dates).

Instead of `cells`, a sheet may carry `data`, a grid of values starting at A1, the shortest way to hand data over. A string starting with `=` is a formula there:

```json
{ "name": "Import", "data": [["Name", "Qty"], ["Pen", 3], ["Total", "=SUM(B2:B2)"]] }
```

#### Styles

Style objects configure cell presentation. Row styles, column styles and named templates use the same properties.

| Property        | Values
|-----------------|-------
| `font`          | A font family, letters, digits, spaces, commas and quotes only.
| `size`          | The font size in points, 4 to 200.
| `bold`, `italic`, `underline`, `strike`, `wrap` | `true`
| `color`, `fill` | Text and background color: `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()` or a color name.
| `align`         | `left`, `center`, `right`, `justify`; without it numbers align right, truth values center and text left.
| `valign`        | `top`, `middle`, `bottom` (default).
| `nf`            | A [number format](#number-and-date-formats).
| `indent`        | 1 to 15 levels.
| `border`        | `{ top, right, bottom, left }`, each `"thin"`, `"medium"`, `"thick"`, `"dashed"`, `"dotted"` or `"double"`, optionally followed by a color.

Styles end up as inline css, so the model validates every value against a strict pattern and drops unsupported values, including styles pasted from the clipboard or received from other users.

The effective style of a cell combines, in this order, the column style, the row style, the format template and the cell's own style. Formatting whole columns or rows stores the style on the column or row, so formatting column A never creates a million cells.

A fill is an absolute color, while the default text color follows the theme. A cell with a fill but without a text color therefore shows dark or light text, whichever contrasts with the fill, so a light fill stays legible in dark mode. A text color without a fill is shown as given. Set both colors when a fixed background is required.

#### Limits

Workbook dimensions and text values are bounded by the following limits. Operations that exceed the grid boundaries are refused before cells or dimensions are changed.

| Item                             | Limit
|----------------------------------|------
| Rows per sheet                   | 1,048,576
| Columns per sheet                | 16,384 (XFD)
| Text of a cell, formula, comment | 32,767 characters (formulas 8,192)
| Sheet names                      | 1 to 100 characters, without `[ ] : * ? / \`, unique regardless of case

### C# Configuration

`ControlSpreadsheet` maps render-context delegates to host attributes. `ControlFormItemInputSpreadsheet` provides the form-field variant with its own value and validation lifecycle.

| Property | Attribute
|----------|----------
| `Workbook` (delegate returning `SpreadsheetWorkbook`) | `value`
| `ReadOnly`, `Toolbar`, `FormulaBar`, `SheetTabs`, `StatusBar` | `data-readonly`, `data-toolbar`, `data-formula-bar`, `data-sheet-tabs`, `data-status-bar`
| `Rows`, `Columns`, `GridHeight`, `Fill`, `Zoom` | `data-rows`, `data-cols`, `--wx-spreadsheet-height`, `data-fill`, `data-zoom`
| `Locale` | `data-locale` (the request culture when unset)
| `HistoryLimit`, `HistoryMerge` | `data-history-limit`, `data-history-merge`
| `LoadUri`, `SaveUri`, `SaveMethod`, `Autosave` | `data-load-uri`, `data-save-uri`, `data-save-method`, `data-autosave`
| `UserName` | `data-user-name`

## Programmatic Control

An initialized controller exposes workbook data, selection, formatting, history and collaboration. Use these operations to keep calculation, rendering, notifications and undo history synchronized.

### Accessing an Automatically Created Instance

For a declarative host, retrieve its existing controller through `webexpress.webui.Controller.getInstanceByElement(element)` after initialization. The returned instance provides workbook operations and view settings.

```javascript
const spreadsheetElement = document.getElementById("budget");
const spreadsheetCtrl = webexpress.webui.Controller.getInstanceByElement(spreadsheetElement);

if (spreadsheetCtrl) {
    spreadsheetCtrl.setValue("B2", 1250);
    spreadsheetCtrl.setNumberFormat("B:B", "#,##0.00");
    spreadsheetCtrl.zoom = 1.25;
}
```

### Manual Instantiation

For a dynamically created host, construct `SpreadsheetCtrl` after attaching the element to its container. This host omits the automatic registration class because the application creates and owns the controller instance.

```javascript
const container = document.getElementById("spreadsheet-container");
const spreadsheetHost = document.createElement("div");
spreadsheetHost.setAttribute("data-locale", "en");
container.appendChild(spreadsheetHost);

const dynamicSpreadsheetCtrl = new webexpress.webui.SpreadsheetCtrl(spreadsheetHost);
dynamicSpreadsheetCtrl.setWorkbook({
    sheets: [{ name: "Budget", data: [["Item", "Amount"], ["Rent", 1200]] }]
});
dynamicSpreadsheetCtrl.markPristine();
```

Lifecycle cleanup for manually owned instances uses `dynamicSpreadsheetCtrl.destroy()` before removing the host. Call `markPristine()` after loading application data when that workbook should become the reset baseline.

### Properties and Methods

References are accepted in every form: `"B2"`, `"A1:C3"`, `"A:A"`, `"2:4"`, `"Sheet2!B2"`, a named range, `{ row, col }` or `{ r1, c1, r2, c2 }`, each optionally with a `sheet` (id or name). Rows and columns are zero-based in objects and one-based in A1 text.

#### Workbook

Workbook members manage serialization, persistence and the field baseline.

| Member | Description
|--------|------------
| `value` | The workbook as JSON text (get/set). Writing back the current value changes nothing.
| `getWorkbook(options)` | The workbook as JSON data; `results: false` leaves out formula results, `activeSheet: true` records the active sheet.
| `setWorkbook(json, { emit })` | Replaces the workbook and resets local history and selections. During collaboration, the replacement is shared as a change.
| `empty` | Whether no cell holds content.
| `dirty`, `markPristine()`, `reset()` | Changes since the last load or save; take the current state as baseline; restore the baseline.
| `load(uri?)` | Loads from the load address through the transport.
| `save()` | Saves to the save address (see [Saving](#saving)).
| `importCsv(text, { sheet, delimiter, start })` | Imports delimited text; the delimiter is guessed when omitted.
| `exportCsv({ sheet, delimiter, values })` | The used range as delimited text.
| `exportHtml(ref?)` | A range as an HTML table with inline styles.

#### Sheets

Sheet members manage identity, tab order and the active sheet.

| Member | Description
|--------|------------
| `sheets` | `[{ id, name, index, rowCount, colCount }]` in tab order.
| `activeSheet` | The name of the active sheet (get/set).
| `activateSheet(key)` | Activates a sheet by id or name.
| `getSheet(key)` | `{ id, name, index, rowCount, colCount, frozenRows, frozenCols }`.
| `addSheet(name?, { index, rows, cols, data, activate })` | Adds a sheet; returns its id.
| `renameSheet(key, name)` | Renames a sheet; references written with its name follow.
| `copySheet(key, name?)` | Duplicates a sheet behind it.
| `moveSheet(key, index)` | Moves a sheet in the tab order.
| `removeSheet(key)` | Removes a sheet; references to it become `#REF!`. The last sheet stays.
| `setSheetColor(key, color)` | Sets or removes the tab color.

#### Cells and Ranges

Cell and range members read or update workbook content through model operations.

| Member | Description
|--------|------------
| `getCell(ref)` | `{ ref, sheet, value, formula, display, type, style, cellStyle, comment, meta, raw }`.
| `getValue(ref)`, `getDisplay(ref)`, `getFormula(ref)` | The value (the result of a formula; errors as their code), the shown text, the formula.
| `setValue(ref, value, { raw })` | Sets a value, keeping format, type and comment. Strings are read like typed input (`"=A1*2"`, `"15%"`, `"20.10.2026"`) unless `raw` is set. A `Date` becomes a date.
| `setFormula(ref, formula)` | Sets a formula, with or without `=`.
| `setCell(ref, cell)` | Replaces a cell with a cell object.
| `getRange(ref, { display, formulas })` | The values as rows; whole columns and rows end at the data.
| `setRange(ref, rows)` | Writes rows of values from a start cell, as one undo step; the sheet grows when needed.
| `clear(ref?, what)` | Clears `"contents"` (default), `"formats"`, `"comments"` or `"all"`; the selection when `ref` is omitted.
| `setComment(ref, text, { author })`, `getComment(ref)` | Comments.
| `setType(ref, type, meta)` | Gives cells a custom type, or `null` for plain values.

#### Formatting

Formatting members update styles and merged cells without replacing the stored values.

| Member | Description
|--------|------------
| `getStyle(ref)` | The effective style.
| `setStyle(ref, patch)` | Merges style properties into a range; `null` removes a property. `ref` `null` means the selection.
| `toggleStyle(flag)` | Toggles `bold`, `italic`, `underline`, `strike` or `wrap` on the selection.
| `setNumberFormat(ref, code)` | Sets a number format; `null` restores General.
| `setBorder(ref, kind, edge)` | `kind`: `all`, `outer`, `inner`, `top`, `bottom`, `left`, `right`, `none`; `edge`: `"thin"`, `"thick #ff0000"`, ...
| `applyCellStyle(ref, name)` | Applies a format template; the template is stored in the workbook.
| `defineStyle(name, style)` | Defines a workbook template.
| `merge(ref?, { center })`, `unmerge(ref?)` | Merges a range (the top-left value stays) and dissolves merges.

#### Names

Named ranges associate workbook-wide identifiers with sheet-qualified references.

| Member | Description
|--------|------------
| `names` | The named ranges.
| `defineName(name, ref)` | Defines a named range; without a sheet it refers to the active sheet.
| `removeName(name)` | Removes a named range.

#### Structure

Structural operations update sheet dimensions, visibility and positions. Moving cells also updates formulas and named ranges.

| Member | Description
|--------|------------
| `insertRows(index, count, sheet?)`, `deleteRows(...)` | Inserts or deletes rows; references move along or become `#REF!`.
| `insertColumns(index, count, sheet?)`, `deleteColumns(...)` | The same for columns.
| `setRowHeight(index, px, count)`, `setColumnWidth(index, px, count)` | Sizes at 100 %; `null` restores the default.
| `hideRows(index, count, hidden)`, `hideColumns(...)` | Hides or shows; false when nothing changed or nothing would stay visible.
| `showHiddenNextTo(axis, index, direction)` | Shows the block of hidden rows (`"row"`) or columns (`"col"`) before (-1) or after (1) a visible one and selects it, as the header mark does.
| `freeze(rows, cols)` | Freezes panes; `freeze(0, 0)` unfreezes.
| `sort(ref?, { column, descending, header })` | Sorts the rows of a range; formulas move with their rows.
| `autoFill(source, target, { copy })` | Continues the content of a range into a larger one.
| `moveRange(source, target)` | Moves a range to another position or sheet; formulas and named ranges follow the moved cells.

#### Selection, Finding, Clipboard

Selection and search members operate on references, while clipboard members exchange typed data and presentation.

| Member | Description
|--------|------------
| `selection` | `{ sheet, ranges: ["A1:B2", ...], active: "A1" }`.
| `select(ref or [refs], { active, scroll })`, `selectAll()`, `goTo(ref)` | Selects and scrolls.
| `find(text, { matchCase, wholeCell, formulas, allSheets, regex })` | All matches.
| `findNext(text, { ..., backwards })` | Selects the next match.
| `replace(text, replacement, { ..., all })` | Replaces in the active cell or everywhere; returns the count.
| `copy()`, `cut()`, `paste({ mode })` | Through the asynchronous clipboard api; `mode`: `all`, `values`, `formats`, `formulas`.
| `pasteData({ text, html, json }, { mode, target })` | Pastes given clipboard formats.

#### History, Formulas, Commands

History and command members group changes, recalculate formulas and expose toolbar operations to application code.

| Member | Description
|--------|------------
| `undo()`, `redo()`, `canUndo()`, `canRedo()` | The history.
| `batch(fn, label, mergeKey)` | Runs changes as one transaction: one undo step, one change event.
| `history` | The `SpreadsheetHistory`; `limit` and `mergeWindow` can be changed at runtime, `labels()` lists the steps.
| `clearHistory()` | Discards the history.
| `getChangeLog()` | The change history of the session: time, source (`user`, `undo`, `redo`, `remote`), user, changed cells and structure.
| `evaluate(formula, ref?)` | Evaluates a formula without storing it.
| `recalculate()` | Recalculates every formula, including volatile ones.
| `execCommand(command, value)` | Runs a toolbar command, such as `bold`, `fill`, `numberformat`, `insertrowabove`, `freeze`, `autosum`, `zoomin`.
| `queryCommandState(command)`, `queryCommandValue(command)` | The state at the active cell, for custom toolbars.
| `applyOperation(op, { label, mergeKey })` | Applies a model operation as a transaction, for plugins.
| `zoom` | Zoom factor (get/set), from `0.25` to `4`; `1` means 100 %.
| `readOnly`, `disabled` | Editing and disabled state (get/set).

### Formulas

The formula engine evaluates stored expressions, tracks dependencies and updates results after workbook changes.

#### Syntax

Formulas start with `=` and use canonical English function names and the point as decimal separator, as the common spreadsheets store them internally; arguments are separated by `,` or `;`.

| Element | Example
|---------|--------
| Numbers, text, truth values | `12.5`, `"text"` (`""` for a quote), `TRUE`, `FALSE`
| Cell references | `A1`, `$A$1` (absolute), `A$1`, `$A1` (mixed)
| Ranges | `A1:C3`, `A:C` (whole columns), `2:4` (whole rows)
| Other sheets | `Sheet2!A1`, `'Sheet with spaces'!A1:B2`
| Named ranges | `Revenue`
| Operators | `+ - * / ^` (power), `&` (text), `= <> < > <= >=`, `%` (percent), unary `-`
| Errors | `#DIV/0!`, `#VALUE!`, `#REF!`, `#NAME?`, `#NUM!`, `#N/A`, `#NULL!`, `#CIRC!` (circular reference), `#ERROR!` (formula cannot be read)

The precedence follows the common spreadsheets: comparison, then `&`, then `+ -`, then `* /`, then `^`, then `%`, then unary minus (`=-2^2` is 4). Text is compared case-insensitively; numbers sort before text, text before truth values. An empty cell counts as 0 or empty text.

#### Functions

Built-in functions use canonical English identifiers, organized into the following categories.

| Category | Functions
|----------|----------
| Math | `SUM`, `PRODUCT`, `ROUND`, `ROUNDUP`, `ROUNDDOWN`, `ABS`, `INT`, `SQRT`, `POWER`, `MOD`, `PI`, `RAND`, `RANDBETWEEN`, `SUMIF`
| Statistics | `AVG`, `AVERAGE`, `MIN`, `MAX`, `MEDIAN`, `COUNT`, `COUNTA`, `COUNTBLANK`, `COUNTIF`, `AVERAGEIF`
| Logic | `IF`, `IFERROR`, `AND`, `OR`, `XOR`, `NOT`, `TRUE`, `FALSE`, `CHOOSE`
| Text | `CONCAT`, `CONCATENATE`, `TEXTJOIN`, `LEFT`, `RIGHT`, `MID`, `LEN`, `UPPER`, `LOWER`, `TRIM`, `TEXT`, `VALUE`, `FIND`, `SUBSTITUTE`
| Date and time | `TODAY`, `NOW`, `DATE`, `YEAR`, `MONTH`, `DAY`, `WEEKDAY`, `HOUR`, `MINUTE`, `DAYS`, `NETWORKDAYS`, `EDATE`
| Lookup and information | `VLOOKUP`, `HLOOKUP`, `INDEX`, `MATCH`, `ROW`, `COLUMN`, `ROWS`, `COLUMNS`, `ISBLANK`, `ISNUMBER`, `ISTEXT`, `ISERROR`, `NA`

Like in the common spreadsheets, `SUM` and its relatives skip text and truth values in ranges and convert them in direct arguments; criteria of `COUNTIF`, `SUMIF` and `AVERAGEIF` accept comparisons (`">5"`, `"<>done"`) and wildcards (`"a*"`, `"?b"`). `IF`, `IFERROR` and `CHOOSE` evaluate only the branch they take.

#### Custom Functions

Functions are registered once for every spreadsheet on the page, the way editor add-ons are. A spreadsheet created earlier recalculates the formulas using a function registered later.

```javascript
webexpress.webui.SpreadsheetFunctions.register("VAT", {
    /**
     * Preserves spreadsheet error values when calculating tax from numeric arguments.
     * @param {Array<*>} args - The amount and optional tax rate.
     * @param {object} api - The formula evaluation context and conversion helpers.
     * @returns {number|webexpress.webui.SpreadsheetError} The tax or a conversion error.
     */
    fn(args, api) {
        const [amount, rate] = args;
        const value = api.values.toNumber(amount);
        if (api.values.isError(value)) return value;
        const percent = rate === undefined ? 0.19 : api.values.toNumber(rate);
        if (api.values.isError(percent)) return percent;
        return Math.round(value * percent * 100) / 100;
    },
    minArgs: 1,
    maxArgs: 2,
    category: "finance",
    syntax: "VAT(amount, [rate])",
    description: "Returns the value added tax of an amount."
});
```

| Definition member | Meaning
|-------------------|--------
| `fn(args, api)` | The implementation. `args` are numbers, texts, booleans, `null` for empty, `SpreadsheetError` values, or `SpreadsheetRange` objects for ranges and single-cell references.
| `minArgs`, `maxArgs` | The argument count; a call outside it is `#N/A`.
| `lazy` | `args` are functions evaluating each argument on demand (as for `IF`).
| `volatile` | The function recalculates on every change (as `NOW`).
| `acceptErrors` | The function receives errors among its arguments instead of returning the first one.
| `category`, `syntax`, `description` | Shown in the function suggestions and the fx list.

The function context `api` offers `engine`, `sheet`, `row`, `col` (the calling cell), `now()` and `values`, which provides the shared helpers `toNumber`, `toText`, `toBool`, `scalar`, `numbers(args)` (numbers as `SUM` collects them), `each(args, fn)`, `compare(a, b)`, `criterion(text)`, `isError(value)` and `error(code, message)`. A `SpreadsheetRange` offers `rows`, `cols`, `at(row, col)`, `forEachValue(fn)` (filled cells only) and `toArray()`. A function that throws evaluates to `#VALUE!`. `unregister(name)` removes a function, `get`, `has` and `getAll()` inspect the registry.

#### Calculation

The engine parses every formula once and records which cells and ranges it reads. A change recalculates exactly the formulas it reaches, transitively, in dependency order; the order comes from an iterative depth-first search, so even a chain of hundreds of thousands of formulas, such as a running total down a long column, avoids recursive stack growth. A formula that reaches itself evaluates to `#CIRC!` together with every formula on the cycle, and recovers when the cycle is broken. Structural changes such as inserting rows or renaming sheets rebuild the dependencies once.

When rows or columns are inserted or deleted, references across the whole workbook move along as in the common spreadsheets: an insertion inside a range widens it, a deletion narrows it, and a reference to a deleted cell becomes `#REF!`. Undo restores every rewritten formula exactly. Copying and filling formulas moves their relative references; moving cells (cut and paste, dragging) re-aims every reference to them.

### Number and Date Formats

Format codes follow the syntax of the common spreadsheets, so formats survive the clipboard and the file formats.

| Code | 1234.567 (en) | 1234.567 (de)
|------|---------------|---------------
| `General` | 1234.567 | 1234,567
| `0`, `0.00` | 1235, 1234.57 | 1235, 1234,57
| `#,##0.00` | 1,234.57 | 1.234,57
| `#,##0,` | 1 | 1
| `0.0%` (0.256) | 25.6% | 25,6%
| `0.00E+00` | 1.23E+03 | 1,23E+03
| `#,##0.00 €`, `[$$-409]#,##0.00` | 1,234.57 €, $1,234.57 |
| `0.00;[Red]-0.00` (-5) | -5.00 in red |
| `000-0000` (5551234) | 555-1234 |
| `dd.mm.yyyy`, `yyyy-mm-dd hh:mm` | dates |
| `dddd, d. mmmm yyyy` | Tuesday, 20. October 2026 | Dienstag, 20. Oktober 2026
| `h:mm AM/PM`, `[h]:mm` | times, durations beyond 24 hours |
| `@`, `"text "0`, `0\x`, `0_)` | text sections and literals |

Up to four sections separated by `;` format positive numbers, negative numbers, zero and text. `[Red]`, `[Blue]`, `[Green]` and the other basic colors color a section.

#### Input Recognition

What is typed into a cell is read in the conventions of `data-locale`, and a recognized format is applied to a cell that has no format. For example, typing "15%" shows a percentage and typing "20.10.2026" shows a date:

| Input (de) | Input (en) | Value | Format
|------------|------------|-------|-------
| `1.234,5` | `1,234.5` | 1234.5 | `#,##0.0`
| `15%` | `15%` | 0.15 | `0%`
| `1.234,50 €` | `$1,234.50` | 1234.5 | currency
| `20.10.2026` | `10/20/2026` | 46315 | the date format of the language
| `2026-10-20 13:45` | `2026-10-20 13:45` | 46315.57… | `yyyy-mm-dd hh:mm`
| `12:30` | `12:30 pm` | 0.52… | `hh:mm`
| `WAHR` | `TRUE` | true |
| `'0123` | `'0123` | the text 0123 |
| `=A1*2` | `=A1*2` | a formula |

### Clipboard

A copy is written in three formats at once:

- **Tab-separated text** (`text/plain`): read by every spreadsheet and text editor.
- **An HTML table** (`text/html`) with inline styles, colspans and rowspans: read with formatting by Excel, Google Sheets, LibreOffice and word processors.
- **The own format**: JSON with formulas, types, comments, templates and merges, offered as `application/x-webexpress-spreadsheet` (`web application/x-webexpress-spreadsheet` through the asynchronous api) and embedded in the HTML table, so it survives browsers without custom formats.

Pasting takes the richest format available. From the own format, formulas are pasted with their relative references moved to the target. From HTML, the spreadsheet reads Excel's numbers and formulas (`x:num`, `x:fmla`), the styles of Excel's style block (`mso-number-format`, class rules), Google Sheets' typed values and relative formulas (`data-sheets-value`, `data-sheets-formula` in R1C1 notation), inline css and merged cells. Plain text is split by tabs and lines and read like typed input. Clipboard HTML is never inserted into the page: a small tokenizer reads it, so no foreign markup or script runs, and every style passes the model's validation.

A block smaller than the selection is repeated across it when the selection is a multiple of the block. A cut is pasted once and moves the cells together with references to them. `paste({ mode })` and the context menu paste values only, formats only or formulas only. Keyboard shortcuts use the clipboard events; the toolbar buttons use the asynchronous clipboard api, falling back to the last copy of the page when the browser refuses to read the clipboard.

Clipboard values are captured when cells are copied. Pasting values uses that snapshot, including formula results, even after the source changes or when the destination is another workbook. Moving cells updates both formula references and named ranges in one undo step. Formulas moved to another sheet retain references to source cells outside the moved range. A paste or move that would exceed the row or column limit is refused before changing cells or dimensions.

### Undo and Redo

Every change is undoable: values, formulas, formats, comments, types, merges, rows and columns, sheets, names, templates and metadata. The history keeps operations and their inverses, never snapshots, so the history of a sheet with hundreds of thousands of rows costs only what changed.

- **One intention, one step.** A paste, a fill, a sort or a formatting of a large range is one step. `batch(fn, label)` groups API calls the same way.
- **Merging.** Consecutive changes with the same merge key within the merge window merge into one step, including the stages of resizing one column, repeated clicks on "more decimal places". Moving the selection ends merging.
- **Configuration.** `data-history-limit` and `data-history-merge`, or `ctrl.history.limit` and `ctrl.history.mergeWindow` at runtime.
- **Selection.** Undo and redo restore the selection of the step.
- **While shared**, undo takes back only the own changes, transformed against everything others did since (see below).

### Real-time Collaboration

Several users edit one workbook at the same time. Local changes show at once (optimistic updates) and are sent in the background; changes of others arrive as they are made and are merged by operational transformation, so all users converge on the same workbook.

#### Shared Workbook Representation

The workbook becomes a flat sequence of leaves for the transformation core ([Operational Transformation](ot.md)): a workbook leaf, and per sheet a sheet leaf, one leaf per column and one per row. A cell is an attribute of its row leaf, keyed by the id of its column. Rows and columns are addressed by stable ids that never shift, so:

- two users editing different cells never touch the same attribute;
- inserting a row is the insertion of one leaf, and two concurrent insertions keep each other;
- formulas are shared with their references written as row and column ids. A formula another user typed against the old row positions still means the same cells after a row was inserted elsewhere; every client turns the ids back into A1 text. A reference to a deleted row becomes `#REF!` on every client.

Concurrent changes of the same cell are decided by the order the changes were sequenced in; the change sequenced first wins the tie on every client. A cell someone else changed while it is being edited is reported (`SPREADSHEET_CONFLICT_EVENT` with `reason: "edited"`); the edit continues and wins when it is committed. A change the server refuses resets the client to the shared state and reports the lost change (`reason: "rejected"`).

#### Provider Interface

The synchronization mechanism is pluggable. A provider only transports: it sequences submitted changes, acknowledges them to the submitter, forwards them to everyone else and relays presence through one ordered message channel per client. The transformation happens in the client session, so a provider over WebSockets, a message queue, WebRTC or a test double needs no spreadsheet knowledge.

Provider implementations must follow the ordered transport contract below. The [collaboration examples](#sharing-a-workbook) demonstrate the built-in memory provider and the WebApp host.

| Method | Contract
|--------|---------
| `connect(join, deliver)` | Joins the document. `join` is `{ client, user, tokens }`; `tokens` seed a document that does not exist yet. Resolves with `{ version, tokens }`. `deliver(message)` receives the messages for this client, in order.
| `submit({ client, version, steps })` | Submits local steps based on a version.
| `presence({ client, user, selection })` | Announces the selection (encoded by row and column ids).
| `disconnect(client)` | Leaves.

Messages to the client: `{ type: "ack", version }`, `{ type: "op", version, steps, client, user }`, `{ type: "presence", client, user, selection }`, `{ type: "leave", client }` and `{ type: "reset", version, tokens }`.

The sequencing a server performs is implemented in `SpreadsheetMemoryHub`: it rebases a submitted change over everything sequenced since its version (`Ot.transform(steps, sequenced, false)`), checks the result against the workbook schema, applies it, acknowledges it to the submitter and forwards it to the others, or answers with `reset` when the change does not apply.

`SpreadsheetMemoryProvider` connects controls within one page through a shared `SpreadsheetMemoryHub`. This provider supports embedded views, demonstrations and tests.

`ctrl.collaborators` lists the other users with their selections; `ctrl.disconnect()` leaves the document.

#### Presence

The selections of the others are drawn in their color, with the name at their active cell; their initials appear in the toolbar. Cells another user changed flash briefly in that user's color. Selections are encoded by row and column ids, so they stay on their cells while rows and columns move.

#### WebApp

Inside a `ControlCollaborative` of WebExpress.WebApp, a spreadsheet is shared without any code: the host finds it by its `collaborationKind` (`"spreadsheet"`), sequences its steps through the server and draws the carets of the others at the column header of their active cell and the cell itself. The server validates every change against `SpreadsheetSchema`, the C# twin of `SpreadsheetCollab.check`.

The WebApp collaboration members expose the workbook schema, token state and selection geometry to the host.

| Member | Purpose
|--------|--------
| `collaborationKind` | `"spreadsheet"`
| `beginCollaboration({ tag })`, `endCollaboration()` | Starts and stops sharing; new ids carry the client tag.
| `getCollaborationTokens()`, `loadCollaborationTokens(tokens)` | The workbook as packed tokens.
| `checkCollaborationTokens(tokens)`, `repairCollaborationTokens(tokens)` | The schema check and its repair.
| `applyRemoteSteps(steps, meta)` | Applies the steps of another user.
| `getModelSelection()`, `getModelPositionRect(pos)`, `getModelRangeRects(from, to)` | The active cell as token positions (row leaf, column leaf) and where the host draws it.

#### Change History

`getChangeLog()` lists the changes of the session, including local, undone, redone and remote changes, with time, user, the changed cells and the structural changes.

### Extending the Spreadsheet

Registries extend toolbar groups, cell types and reusable formats without changing the controller.

#### Plugins

Plugins register with `webexpress.webui.SpreadsheetPlugins`, like editor plugins; the position orders the toolbar groups (formatting 0, structure 1000, find 2000):

```javascript
webexpress.webui.SpreadsheetPlugins.register("export", 3000, {
    /**
     * Exposes CSV export through the spreadsheet's standard toolbar controls.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The controller owning the toolbar.
     * @returns {HTMLElement} The export button.
     */
    createToolbar(ctrl) {
        return ctrl.createButton({
            icon: "file-csv",
            label: "Download CSV",
            onClick: () => {
                const blob = new Blob([ctrl.exportCsv({ delimiter: ";" })], { type: "text/csv" });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = ctrl.activeSheet + ".csv";
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
        });
    },
    /**
     * Adds highlighting while keeping the change in the controller's undo history.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The controller owning the selection.
     * @returns {Array<object>} The additional context menu entries.
     */
    getContextMenuItems(ctrl) {
        return [{ label: "Highlight", icon: "palette", onClick: () => ctrl.setStyle(null, { fill: "#ffff00" }) }];
    }
});
```

Plugin lifecycle hooks include `init(ctrl)`, which may return a cleanup function, `onSelectionChange(ctrl)` and `onChange(ctrl, changes)`. The controller invokes these hooks for each plugin instance.

Toolbar helpers include `ctrl.createButton({ command, value, icon, text, label, onClick })`, `ctrl.createMenu({ icon, text, label, items })` and `ctrl.createSeparator()`. These helpers use the built-in appearance and interaction behavior. The `ctrl.prompt(label, value)` method opens a text-entry dialog.

#### Custom Cell Types

A registered cell type provides display, parsing, editing and formula-value conversion. The parser returns `undefined` to refuse input.

```javascript
webexpress.webui.SpreadsheetTypes.register("rating", {
    align: "center",
    /**
     * Presents a stored rating without replacing its numeric value.
     * @param {number|null} value - The rating from zero through five.
     * @returns {string} The star representation.
     */
    format(value) {
        return "★".repeat(value ?? 0) + "☆".repeat(5 - (value ?? 0));
    },
    /**
     * Refuses entries outside the rating scale before they reach the workbook.
     * @param {string} text - The entered rating.
     * @returns {number|undefined} The rating, or undefined for invalid input.
     */
    parse(text) {
        const n = Number(text);
        return Number.isInteger(n) && n >= 0 && n <= 5 ? n : undefined;
    },
    /**
     * Keeps numeric input available while the display uses stars.
     * @param {number|null} value - The stored rating.
     * @returns {string} The editor text.
     */
    edit(value) {
        return String(value ?? "");
    },
    /**
     * Allows formulas to aggregate ratings as numbers.
     * @param {number|null} value - The stored rating.
     * @returns {number} The numeric rating, or zero for an empty cell.
     */
    toValue(value) {
        return value ?? 0;
    }
});

const ratingCtrl = webexpress.webui.Controller.getInstanceByElement(document.getElementById("budget"));
ratingCtrl.setType("D2:D20", "rating");
```

Built-in types: `checkbox` (Space or a click toggles it, formulas see `TRUE`/`FALSE`), `link` (`[text](address)`; only `http(s)`, `mailto`, relative and anchor addresses become links) and `list` (`setType(ref, "list", { options: [...] })`; other values are refused).

#### Format Templates

Registered templates expose reusable style definitions to the toolbar and the `applyCellStyle` API.

```javascript
webexpress.webui.SpreadsheetCellStyles.register("warning", {
    label: "Warning",
    style: { fill: "#fff3cd", color: "#664d03", bold: true }
});
```

Applying a template stores its style in the workbook, so a saved workbook carries its own templates.

### Server-Side Workbook API

The `WebExpress.WebUI.WebSpreadsheet` namespace represents workbook data for server rendering and form processing. Parsing validates workbook structure, styles, names and dimensions; formula results supplied by a client remain client-provided values.

| Type | Purpose
|------|--------
| `SpreadsheetWorkbook` | `Sheets`, `Names`, `Styles`, `Meta`, `ActiveSheet`; `AddSheet`, `GetSheet`, `DefineName`, `IsEmpty`, `ToJson`, `Parse`, `TryParse`.
| `SpreadsheetSheet` | `Cells`, `this[A1]`, `GetCell`, `SetCell`, `SetValue`, `SetFormula`, `GetValue`, `SetData`, `Format`, `Merge`, `Freeze`, `RowHeights`, `ColumnWidths`, `RowStyles`, `ColumnStyles`, `TabColor`, `Gridlines`.
| `SpreadsheetCell` | `Value`, `Formula`, `Result`, `Error`, `EffectiveValue`, `Type`, `Style`, `StyleName`, `Comment`, `CommentAuthor`, `Meta`.
| `SpreadsheetStyle` | The style properties; reading drops invalid values.
| `SpreadsheetAddress`, `SpreadsheetDate` | A1 notation, serial dates.

A required `ControlFormItemInputSpreadsheet` refuses a workbook without any value or formula; a value that is no workbook fails validation with `spreadsheet.state.invalid`.

### User Interaction

Keyboard, pointer and toolbar actions invoke the same controller operations as application code.

#### Keyboard

Grid navigation and editing use the following shortcuts.

| Keys | Action
|------|-------
| Arrow keys | Move the active cell; with Shift, extend the selection.
| Ctrl+Arrow | Jump to the edge of the data; with Shift, extend.
| Tab, Shift+Tab | Move right or left; inside a selected block, walk through it.
| Enter, Shift+Enter | Move down or up; after Tab, return to the column the row was started in.
| Home, End | First column, last filled column of the row.
| Ctrl+Home, Ctrl+End | A1, the last filled cell of the sheet.
| Page Up, Page Down | One page up or down; with Alt, one page left or right.
| Ctrl+Page Up, Ctrl+Page Down | Previous or next sheet.
| Ctrl+A | The data region around the active cell, pressed again the whole sheet.
| Ctrl+Space, Shift+Space | Select the column, the row.
| Typing | Replaces the cell content and starts editing (enter mode).
| F2, Ctrl+Enter, Alt+Enter, double click | Edits the cell content (edit mode).
| Backspace | Clears the cell and starts editing.
| Delete | Clears the contents of the selection.
| Ctrl+C, Ctrl+X, Ctrl+V | Copy, cut, paste.
| Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z | Undo, redo.
| Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+5 | Bold, italic, underline, strikethrough.
| Ctrl+D, Ctrl+R | Fill down, fill right.
| Ctrl+F, Ctrl+H | Find, find and replace.
| Ctrl+; | Insert today's date.
| Ctrl+9, Ctrl+0 | Hide the selected rows, columns. Ctrl+0 resets the browser zoom elsewhere; inside the grid it hides.
| Ctrl+Shift+9, Ctrl+Shift+0 | Show the hidden rows, columns inside the selection.
| Shift+F2 | Edit the comment.
| F9 | Recalculate.
| Shift+F10, context menu key | Open the context menu.
| Escape | Cancel editing, clear the copy marquee, disarm the format painter.
| Space | Toggle a checkbox cell.

While editing:

| Keys | Action
|------|-------
| Enter, Tab, Shift+Enter, Shift+Tab | Commit and move.
| Arrow keys | In enter mode, commit and move, or insert a reference where a formula expects an operand (point mode); with Shift, extend it to a range. In edit mode, move the caret.
| F2 | Switch between enter and edit mode.
| F4 | Cycle the reference at the caret through `$A$1`, `A$1`, `$A1`, `A1`.
| Alt+Enter | New line inside the cell.
| Ctrl+Enter | Write the entry into every selected cell (formulas with relative references are adjusted).
| Escape | Cancel.

A formula left with open parentheses gets them closed on commit. While a formula is typed, the names of matching functions are suggested (Arrow keys choose, Tab or Enter accepts), and the syntax of the function the caret is in is shown. Every reference of the formula is outlined in the grid in its own color. Clicking cells while a formula expects an operand inserts their reference; dragging inserts a range.

#### Mouse

Pointer actions select cells and expose resizing, filling and structural commands.

- Click selects a cell, Shift+click extends the selection, Ctrl+click adds a range, dragging selects a range.
- Clicking a column or row header selects it; dragging across headers selects several; the corner selects the whole sheet.
- Dragging a header border resizes the column or row; a double click fits the column to its content or resets the row height.
- The context menu of a row header hides or shows rows, that of a column header columns, that of a cell both. Hidden rows and columns take no space; the header next to them carries a mark on that edge, and a click on the mark shows them again and selects them. Hiding never takes the last visible row or column, and an active cell that becomes hidden moves to the nearest visible one.
- The fill handle (the square at the bottom-right of the selection) continues number and date series, texts ending in a number ("Item 1"), day and month names, and adjusts formulas; with Ctrl it copies instead. A double click on it fills down as far as the column beside holds data.
- Dragging the border of the selection moves it; with Ctrl it copies it.
- The format painter in the toolbar carries the format of the active cell to the next selection.

#### Toolbar

The built-in toolbar groups expose the following commands.

| Group | Actions
|-------|--------
| History | Undo, redo, recalculate.
| Clipboard | Cut, copy, paste, format painter.
| Font | Font family, font size.
| Emphasis and color | Bold, italic, underline, strikethrough, text color, fill color.
| Borders and merging | Borders (all, outside, inside, each side, thick, double, none), merge and center.
| Alignment | Left, center, right, vertical alignment, wrap text.
| Numbers | Number format (general, number, currency, accounting, percent, scientific, date, long date, time, date and time, duration, text, custom), currency, percent, thousands separator, more and fewer decimal places.
| Templates | Format templates (good, bad, neutral, title, headings, input, output, total, note, currency, percent), clear formatting.
| Structure | Insert and delete rows and columns, hide and show, freeze panes, gridlines, sort ascending and descending, AutoSum, comment.
| Find | Find and replace.

Below the toolbar, the name box shows the active cell or the name of the selected range. Typing a reference (`C7`, `B2:D9`, `Sheet2!A1`) or a name and pressing Enter selects it; typing a new name defines it for the selection. The formula bar shows and edits the content of the active cell; while editing, its ✓ and ✗ buttons commit and cancel. The fx button lists the functions.

Below the grid, the sheet tabs switch sheets (Arrow keys move between them, F2 or a double click renames, Delete removes, drag and drop reorders, the context menu duplicates, moves and deletes), the + button adds a sheet, and the zoom control scales the grid. The status bar shows the mode (Ready, Enter, Edit, Point) and, for a selection of several cells, its sum, average and count.

#### Accessibility

The spreadsheet provides the following accessibility features:

- The grid is an ARIA `grid` with `aria-rowcount` and `aria-colcount` of the whole sheet; rows carry `aria-rowindex`, cells `aria-colindex`, headers are `columnheader` and `rowheader`. The grid keeps the focus and names the active cell through `aria-activedescendant`, which is always rendered, also outside the visible area. Selected cells carry `aria-selected`; a read-only spreadsheet is `aria-readonly`.
- Everything is reachable by keyboard: navigation, selection, editing, formulas (point mode), the toolbar (buttons and menus with arrow keys), the context menu (Shift+F10), the sheet tabs (a `tablist` with arrow keys, F2 and Delete), the name box, comments and find. The grid is no keyboard trap: Tab leaves it at the edge of the sheet, Escape leaves editors and menus.
- The cell editor is labelled with the cell it edits; an invalid value is announced and marked `aria-invalid`. Function suggestions are a `listbox` referenced through `aria-activedescendant`.
- A polite live region announces copying, cutting, undoing, saving and conflicts.
- Comments and formula errors are exposed as the accessible description of their cell.
- Focus indicators, sufficient contrast in light and dark mode, 24 px targets (44 px on coarse pointers), reduced motion (no marquee and flash animation) and forced colors are supported.

#### Touch and Small Screens

Touch interactions combine native scrolling with cell selection, editing and zoom gestures.

- Panning is the browser's native scrolling; a tap selects, a double tap edits in the formula bar, and a long press opens the context menu.
- After a touch selection, round handles at the corners of the range extend it.
- Two fingers pinch to zoom between 50 % and 200 %.
- On narrow screens the toolbar scrolls horizontally instead of wrapping, the name box shrinks and the fx button hides. Coarse pointers get 44 px targets and 16 px input text, so phones do not zoom when an input takes the focus. The formula bar shows ✓ and ✗ to commit and cancel without a keyboard.
- `data-fill="true"` and the fullscreen button give the grid the whole screen.

### Implementation and Performance

The component separates workbook operations, calculation, rendering and transport. The following source files implement these responsibilities.

| Layer | File | Responsibility
|-------|------|----------------
| Model | `webexpress.webui.spreadsheet.model.js` | `SpreadsheetModel` (workbook), `SpreadsheetSheet`, `SpreadsheetAddress` (A1 notation). The only place content changes: `apply(op)` returns the inverse operation and a change log.
| Formulas | `webexpress.webui.spreadsheet.formula.js` | `SpreadsheetFormula` (tokenizer, parser, reference rewriting), `SpreadsheetFunctions` (registry), `SpreadsheetEngine` (dependency tracking and recalculation).
| Formats | `webexpress.webui.spreadsheet.format.js` | `SpreadsheetFormat` (number and date formats, input recognition), `SpreadsheetTypes` (custom cell types), `SpreadsheetCellStyles` (format templates).
| Clipboard | `webexpress.webui.spreadsheet.clipboard.js` | `SpreadsheetClipboard`: TSV, CSV, HTML tables of Excel and Google Sheets, the own format, the asynchronous clipboard api.
| Collaboration | `webexpress.webui.spreadsheet.collab.js` | `SpreadsheetCollab` (shared token form), `SpreadsheetCollaborationProvider` (interface), `SpreadsheetMemoryHub`, `SpreadsheetMemoryProvider`, `SpreadsheetCollaboration` (client session).
| View | `webexpress.webui.spreadsheet.view.js` | `SpreadsheetView` (virtualized grid), `SpreadsheetAxis` (row heights, column widths).
| Controller | `webexpress.webui.spreadsheet.js` | `SpreadsheetCtrl`, `SpreadsheetPlugins`, `SpreadsheetHistory`.
| Plugins | `spreadsheet/formatting.js`, `spreadsheet/structure.js`, `spreadsheet/find.js` | The toolbar: formatting, rows and columns, freezing, sorting, AutoSum, comments, find and replace.

Every change runs the same path:

1. An API call, a key, a menu or a plugin creates an **operation** (`{ type: "set", sheet, cells }`, `{ type: "insertRows", ... }`, ...).
2. `SpreadsheetModel.apply(op)` changes the workbook and returns the **inverse operation** and a **change log** (cells, structure, axes, sheets, merges, panes, names, styles, metadata).
3. The **engine** recalculates the formulas the change log reaches.
4. The **history** records the operation and its inverse. During collaboration, shared history records the transformed steps.
5. The **view** re-renders; only cells whose content changed are written to the DOM.
6. The **events** are dispatched and the form value is updated.

Normal editing operations use the change log to update dependent components. Workbook content remains in the model rather than being reconstructed from the rendered DOM.

#### Performance

The spreadsheet is built for workbooks with hundreds of thousands of rows:

- **Virtualization.** Only the visible rows and columns, including frozen cells and the active cell, exist in the DOM. A pane stays fixed over a natively scrolled spacer, so scrolling is the browser's and costs a few position updates per frame. Sheets taller than the browser's element limit are scrolled proportionally.
- **Dirty rendering.** Every rendered cell keeps a signature of what it shows; the DOM is written only where it changed. Renders are coalesced into animation frames.
- **Sparse storage.** A sheet stores filled cells only, as rows of sparse arrays; row and column sizes store only what differs from the default, with prefix sums, so the position of any of a million rows is a binary search away.
- **Incremental calculation.** A change recalculates only the formulas it reaches; dependency lookups use per-cell and per-column indices.
- **Operations, not snapshots.** The history and the collaboration store what changed, never copies of the workbook.
- **Lazy serialization.** For large workbooks the form value is serialized after the change, debounced, and again before the form is sent; the change event computes its value only when a listener reads it.
- **Lazy loading.** With `data-load-uri`, the page renders without the data and the workbook is loaded afterwards.

The performance regression in `spreadsheet.view.test.mjs` exercises loading, calculation and editing with 300,000 rows and formulas. Execution time depends on the browser or Node runtime, hardware and test environment.

#### Testing

The JavaScript tests live in `WebExpress.WebUI.Test/JsTest` and run the shipped sources headlessly with `node --test` (no npm packages):

| File | Covers
|------|-------
| `control.spreadsheet.test.mjs` | Registration, lifecycle and the field contract.
| `spreadsheet.model.test.mjs` | Addressing, JSON, validation, every operation and its inverse.
| `spreadsheet.formula.test.mjs` | Tokenizer, parser, operators, every built-in function, custom functions, dependencies, cycles, rewriting.
| `spreadsheet.format.test.mjs` | Number and date formats, input recognition, types, templates.
| `spreadsheet.clipboard.test.mjs` | TSV, CSV, HTML of Excel and Google Sheets, the own format, paste modes, cut and move, clipboard events.
| `spreadsheet.history.test.mjs` | Undo and redo of every change, merging, limits, batches.
| `spreadsheet.navigation.test.mjs` | Keyboard, editing, point mode, suggestions, mouse, touch, name box, tabs, menus, comments.
| `spreadsheet.collab.test.mjs` | Tokens, schema, repair, convergence of concurrent edits, undo while shared, presence, conflicts, the host interface.
| `spreadsheet.api.test.mjs` | The public api, events, loading and saving.
| `spreadsheet.view.test.mjs` | Axes, virtualization, ARIA, rendering, frozen panes, merges, scaling, a 300,000-row workbook.

Line coverage can be measured with `node --test --experimental-test-coverage`; the result depends on the tested revision and runtime. The C# side is covered by `UnitTestSpreadsheetWorkbook`, `UnitTestControlSpreadsheet` and `UnitTestControlFormItemInputRequired` in WebUI and `UnitTestSpreadsheetSchema` in WebApp.

## Events

The component dispatches standardized events from its host element. Event names are constants of `webexpress.webui.Event`; events bubble and include `sender` and `id` in their detail.

| Event | When | Detail
|-------|------|-------
| `CHANGE_VALUE_EVENT` | After every change of the workbook | `value` (the JSON text, computed when read)
| `SPREADSHEET_SELECTION_CHANGED_EVENT` (selectionChanged) | The selection or the active cell changed | `sheet`, `sheetId`, `ranges`, `active`
| `SPREADSHEET_CELL_CHANGED_EVENT` (cellChanged) | Cells changed | `cells: [{ sheet, sheetId, ref, row, col, before, after, value }]`, `source`
| `SPREADSHEET_FORMULA_CHANGED_EVENT` (formulaChanged) | Formulas were entered, changed (also by moving references) or removed | as cellChanged, `before` and `after` are formulas
| `SPREADSHEET_CALCULATED_EVENT` | A recalculation changed results | `cells: [{ sheet, sheetId, ref, row, col, value }]`
| `SPREADSHEET_SHEET_CREATED_EVENT` (sheetCreated) | A sheet was added | `sheet`, `sheetId`, `index`, `source`
| `SPREADSHEET_SHEET_DELETED_EVENT` (sheetDeleted) | A sheet was removed | `sheetId`, `index`, `source`
| `SPREADSHEET_SHEET_RENAMED_EVENT`, `SPREADSHEET_SHEET_MOVED_EVENT` | A sheet was renamed or moved | `before`, `after` or `from`, `index`
| `SPREADSHEET_SHEET_ACTIVATED_EVENT` | Another sheet became active | `sheet`, `sheetId`
| `SPREADSHEET_ROW_ADDED_EVENT` (rowAdded), `SPREADSHEET_ROW_REMOVED_EVENT` (rowRemoved) | Rows were inserted or deleted | `sheet`, `sheetId`, `index`, `count`, `source`
| `SPREADSHEET_COLUMN_ADDED_EVENT` (columnAdded), `SPREADSHEET_COLUMN_REMOVED_EVENT` (columnRemoved) | Columns were inserted or deleted | as for rows
| `SPREADSHEET_UNDO_EVENT` (undo), `SPREADSHEET_REDO_EVENT` (redo) | A step was undone or redone | `label`
| `SPREADSHEET_EDIT_STARTED_EVENT`, `SPREADSHEET_EDIT_ENDED_EVENT` | Editing a cell started or ended | `ref`, `sheet`
| `SPREADSHEET_PRESENCE_EVENT` | Another user moved their selection | `client`, `user`, `selection`
| `SPREADSHEET_CONFLICT_EVENT` | A change collided with someone else's | `reason` (`edited`, `rejected`, `resync`), `ref`, `user`
| `COLLABORATION_STEPS_EVENT` | A shared change (for the collaboration host) | `steps`; empty steps report a moved selection
| `BEFORE_SAVE_EVENT`, `SAVED_EVENT`, `DATA_ERROR_EVENT`, `TASK_START_EVENT`, `TASK_FINISH_EVENT`, `DATA_REQUESTED_EVENT`, `DATA_ARRIVED_EVENT` | Loading and saving, see the control contract |

The `source` field tells where a change came from: `user`, `api`, `undo`, `redo`, `remote` or `calculation`.

```javascript
const host = document.getElementById("budget");

host.addEventListener(webexpress.webui.Event.SPREADSHEET_CELL_CHANGED_EVENT, (e) => {
    for (const cell of e.detail.cells) {
        console.log(cell.sheet + "!" + cell.ref, cell.before, "->", cell.after, "=", cell.value);
    }
});
```

### Saving

The `save()` method implements the saving side of the [control contract](contract.md). It commits a running edit and dispatches the cancelable `BEFORE_SAVE_EVENT` with the workbook as `payload`, which a listener may replace. While the request is pending, the spreadsheet is read-only and reports `TASK_START_EVENT` and `TASK_FINISH_EVENT`. The JSON request uses `webexpress.webui.Transport`.

Successful saves establish a new baseline and dispatch `SAVED_EVENT`. Failed requests dispatch `DATA_ERROR_EVENT { action: "save", error }` and leave the spreadsheet dirty. Transport outcomes resolve with `{ ok, status, data, error }`. Calling `save()` without a configured save endpoint rejects with an error.

## Use Case Examples

The following examples combine declarative configuration and controller operations for common integration scenarios.

### Editable Workbook in a Form

A named host inside an HTML form submits its workbook as JSON through a generated hidden input. The initial data grid includes an English formula and uses the configured display conventions.

```html
<form method="post">
    <div id="budget" class="wx-webui-spreadsheet" name="budget" data-locale="en"
         style="--wx-spreadsheet-height: 30rem"
         value='{"sheets":[{"name":"Budget","data":[["Item","Amount"],["Rent",1200],["Supplies",150],["Total","=SUM(B2:B3)"]]}]}'>
    </div>
    <button type="submit">Submit workbook</button>
</form>
```

### Read-Only Workbook

A read-only host keeps the workbook visible while hiding editing controls that are unnecessary for a preview. Sheet navigation and cell selection remain available.

```html
<div id="budget-preview" class="wx-webui-spreadsheet"
     data-readonly="true" data-toolbar="false" data-formula-bar="false"
     value='{"sheets":[{"name":"Budget","data":[["Item","Amount"],["Rent",1200]]}]}'>
</div>
```

### Loading and Saving through JSON Endpoints

A remote workbook loads when the host has no initial value. The configured save endpoint receives the workbook as JSON after the autosave delay. The endpoint paths below are application-defined examples.

```html
<div id="remote-budget" class="wx-webui-spreadsheet"
     data-load-uri="/api/budget" data-save-uri="/api/budget"
     data-save-method="PUT" data-autosave="1500">
</div>
```

### Updating Several Cells as One Undo Step

A batch groups related value and formatting changes into one undo entry and one change notification. This example updates the workbook declared above.

```javascript
const budgetCtrl = webexpress.webui.Controller.getInstanceByElement(document.getElementById("budget"));

budgetCtrl.batch(() => {
    budgetCtrl.setRange("A2", [["Rent", 1250], ["Supplies", 175]]);
    budgetCtrl.setFormula("B4", "=SUM(B2:B3)");
    budgetCtrl.setStyle("A1:B1", { bold: true, fill: "#eeeeee" });
    budgetCtrl.setNumberFormat("B:B", "#,##0.00");
}, "updateBudget");
```

### Creating a Workbook in C#

Server code can build a typed workbook before rendering `ControlSpreadsheet`. This example stores a date as a serial value and defines a named reference for subsequent formulas.

```csharp
var workbook = new SpreadsheetWorkbook();
var sheet = workbook.AddSheet("Budget");

sheet.SetData(
[
    ["Item", "Amount"],
    ["Rent", 1200],
    ["Total", "=SUM(B2:B2)"]
]);
sheet.Format("A1:B1", style => { style.Bold = true; style.Fill = "#eeeeee"; });
sheet.SetValue("C2", new DateTime(2026, 10, 20));   // stored as a serial date with a date format
sheet.Freeze(1);
workbook.DefineName("Rent", "Budget!$B$2");

var control = new ControlSpreadsheet { Workbook = _ => workbook };
```

### Processing a Spreadsheet Form Field

A `ControlFormItemInputSpreadsheet` reads and validates posted JSON through `GetWorkbook`. The example assumes that the input belongs to the form and that the form has completed validation before processing its values.

```csharp
var input = new ControlFormItemInputSpreadsheet("budget") { Required = _ => true };

form.ProcessForm += (sender, e) =>
{
    var workbook = input.GetWorkbook(e.Context);
    var total = workbook["Budget"].GetValue("B3");    // the result the client computed
};
```

The returned formula result was computed by the client. Apply application validation before using that value for server-side decisions.

### Sharing a Workbook

Two initialized hosts named `budget-left` and `budget-right` can share a workbook within one page. The first connection seeds the memory hub; the second connection joins the same document.

```javascript
const left = webexpress.webui.Controller.getInstanceByElement(document.getElementById("budget-left"));
const right = webexpress.webui.Controller.getInstanceByElement(document.getElementById("budget-right"));
const hub = new webexpress.webui.SpreadsheetMemoryHub();

await left.connect(new webexpress.webui.SpreadsheetMemoryProvider(hub), {
    user: { id: "anna", name: "Anna", color: "#e8710a" }
});
await right.connect(new webexpress.webui.SpreadsheetMemoryProvider(hub), {
    user: { id: "ben", name: "Ben", color: "#4472c4" }
});
```

A WebApp page can instead wrap the spreadsheet in `ControlCollaborative`. The host binds the control to the document identifier and uses the server collaboration schema.

```csharp
new ControlCollaborative("plan", new ControlSpreadsheet("budget") { Workbook = _ => workbook })
{
    Document = _ => "budget-2026"
};
```

### Integration Guidance

Application integrations should preserve typed values, group related operations and validate submitted data.

- **Hand data over as `data` grids** for imports and as `SpreadsheetWorkbook` from C#; use `cells` when formats and comments matter.
- **Store values, show formats.** Keep numbers and dates as numbers and give them a number format, instead of storing formatted text, because formulas, sorting and the clipboard depend on the value type.
- **Group programmatic changes** with `batch()`, so the user undoes them in one step and listeners see one change.
- **Format whole columns** (`setStyle("C:C", ...)`) rather than long ranges; the style is kept on the column.
- **Name ranges** that formulas share (`defineName`), so formulas read like `=SUM(Revenue)` and survive restructuring.
- **Validate on the server** with `GetWorkbook` and your own rules; the client spares a round trip, the server stays the authority.
- **Keep custom functions pure** and fast; a volatile function recalculates on every change.
- **Large data:** prefer values over formulas where results do not change, avoid ranges over whole columns in many formulas, and let `data-load-uri` load big workbooks after the page.
- **Collaboration:** give every user a stable `id` and a `color`; set `data-user-name` so comments carry their author.

### Existing Data and Applications

Existing tables, files, forms and shared pages can use the following integration paths.

- **From HTML tables or `ControlTable`:** paste the table into the spreadsheet or hand the rows over as a `data` grid. Unlike a table, the spreadsheet stores formulas and formats per cell.
- **From Excel or Google Sheets:** copy and paste ranges with values, formulas and formats; CSV files are imported with `importCsv`.
- **Into forms:** `ControlFormItemInputSpreadsheet` posts the workbook as JSON; the `CHANGE_VALUE_EVENT` and `webexpress.webui.Field` work as for every field (`Field.isDirty`, `Field.reset`, binds).
- **Into REST pages:** `data-load-uri` and `data-save-uri` load and save the workbook through `webexpress.webui.Transport`; WebApp's service layer can be plugged in through `Transport.use(adapter)`.
- **Into shared pages:** wrap the control in `ControlCollaborative` (WebApp) or connect a provider.
- **Reading results on the server:** formula results travel with the posted value as `r`; no formula engine is needed on the server.
