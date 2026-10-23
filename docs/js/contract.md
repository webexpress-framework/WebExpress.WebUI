![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# Control Contract

Every control of WebExpress.WebUI and WebExpress.WebApp keeps one contract for its state, its changes, its validation, its saving, its failures and its lifecycle. The contract is what lets a form fill a date picker it has never heard of, a bind write into a tag editor, and an application guard against unsaved changes without knowing how a single control is built. Controls stay free in how they look; they are not free in how they behave towards the rest of the page.

The contract is binding. The shared contract tests check every control registered with the controller against it (see [Conformance](#conformance)), and a review checks the rules a test cannot see. It sits on the View, State and Service architecture (`WebExpress/docs/view-state-service.md`) and on the bases `Ctrl`, `StateCtrl` ([StateCtrl and Renderer](state.md)) and `Data`; it does not replace them, it states what every control promises on top of them.

*Must* marks a rule a control has to keep, *should* the preferred way.

## Roles

A control takes the roles its purpose needs. A role follows from the members a control has, never from its name.

| Role           | A control that ...                                                        | Keeps
|----------------|---------------------------------------------------------------------------|---------------------------------------------
| Control        | is registered with the controller                                         | [Lifecycle](#lifecycle), [State](#state), [Errors](#errors)
| Report         | exposes `value` without a setter                                          | the value can be read; it changes only through the control's own loading and saving (a comment list, the watchers, a velocity chart)
| Field          | exposes `value` with a setter, or is a native input, select or textarea   | [Changes](#changes), [Validation](#validation), [Dirty and Reset](#dirty-and-reset)
| Saving control | stores data itself                                                        | [Saving](#saving)

`webexpress.webui.Field.isField(target)` tells a field from a report. A form, a bind and an application talk to every field through `webexpress.webui.Field`, which asks the control first and answers from the markup what the control leaves out. A control therefore conforms as a field with no more than a value accessor and the change event, and adds its own members where its presentation needs them.

## Lifecycle

1. **Creation.** The controller creates a control when an element carrying its marker class enters the document (`Controller.registerClass(selector, Class)`), children before their host. It consumes the marker class, tracks the instance (`Controller.getInstanceByElement`) and records the baseline of a field.
2. **Construction.** The constructor reads the configuration from the host - the `data-*` attributes, the `wx-state` and `wx-service` islands - builds the DOM and wires its listeners. A control must not throw for markup it cannot use; it renders what it can. A control that renders from state (`StateCtrl`, `Data`) calls `mount()` as its last step, which renders the first time and runs `onMount`.
3. **Update.** `onUpdate(state)` runs after every later render. A host that shows a hidden control (a tab, the view switch) calls `update()`.
4. **Teardown.** When the host leaves the document, the controller runs the element cleanups the binds registered and calls `destroy()`. A control must release in `destroy()` everything that outlives its DOM - document and window listeners, timers, observers, requests in flight (`Data` aborts its services) - and call `super.destroy()`. An element a control detached on purpose (`_detachElement`) keeps its instance until it is attached again.

The controller catches and logs a constructor or a `destroy` that fails, so one broken control cannot take a page down. The contract tests treat such a log as a failure.

## State

- A control keeps its state in one place: the store of a `StateCtrl` or `Data` control (a `LocalState`, or a `ViewState` in WebApp), or the private fields of a control that renders imperatively. The DOM is no source of state; the configuration in `data-*` attributes is read once, in the constructor.
- State several controls share lives in a `ViewState` (view-state-service.md, section 2.1), never in one control that another one reads.
- A view preference that should survive a reload - the active tab, a column width - is stored through `webexpress.webui.LocalStorage`. Data never is.

The state of a field is five properties. Each is answered by the control when it implements the member, otherwise by `webexpress.webui.Field`:

| Property | Member a control may implement          | Answer of `webexpress.webui.Field` without it
|----------|-----------------------------------------|------------------------------------------------------------------------------------------
| value    | `value` (get and set) - required        | a native field: its text, a boolean for a checkbox, an array for a multiple select
| disabled | `disabled` (get and set)                | the host carries `disabled`, `aria-disabled="true"` or the class `disabled`, sits in a disabled fieldset, or the input it submits through is disabled
| required | `required` (get)                        | the host carries `required`, `aria-required="true"` or `data-required="true"`, or the input it submits through carries `required` or `data-wx-required="true"`
| validity | `validate()`                            | see [Validation](#validation)
| empty    | `empty` (get)                           | the value is null, blank text, an empty list or an unchecked box; a control whose empty state is a particular value says so itself (a rating of zero, a traffic light that is off)
| dirty    | `dirty`, `markPristine()`, `reset()`    | the value compared with the baseline

`Field.setDisabled(target, disabled)` uses a `disabled` setter of the control. Without one it marks the host with `aria-disabled` and switches off the inputs and buttons inside it - and switches on again only those it switched off, so what the server rendered disabled stays disabled.

## Changes

- A field must expose `value` with a getter and a setter. The setter normalizes what it is given - a list may arrive as an array or as text separated by semicolons - and the getter returns the normalized value.
- A field must announce every change of its value with `webexpress.webui.Event.CHANGE_VALUE_EVENT` on its host: a change the user made and a change made in code alike - a form filling it, a bind writing it, a reset. `detail.value` carries what the getter returns after the change.
- Writing back the value the getter returns must change nothing and announce nothing. That is what keeps a bind from looping and what lets a form fill its fields without checking them first.
- The event bubbles. A listener above several controls tells them apart by `event.target` or `detail.sender`; the announcement of a nested control is not a change of the control around it.
- A field that submits through a hidden input writes a list into it as text separated by semicolons, the form the server reads lists in.
- Events of the control's own domain (`ADD_EVENT`, `REMOVE_EVENT`, `CHANGE_FILTER_EVENT`, ...) may accompany the change event; they never replace it.

## Validation

`webexpress.webui.Field.validate(target)` validates a field without presenting anything. It answers with the list of what is wrong - empty for a valid field - in the shape of the server side `ValidationResult`:

```javascript
[{ type: "error", text: "This field is required.", source: "required" }]
```

`type` is `"error"` or `"warning"`, `source` names the rule that spoke. The rules run in this order: an error set from outside (`setError`), the required rule, then the control's own `validate()` or, for a native field, its constraint validity. A disabled field is not validated, as `ControlFormItemInput.Validate` skips it on the server. A control's `validate()` may answer with a list of results, a list of messages, a single message or a boolean; `Field` turns each into results.

- Validation on the client spares the user a round trip; the server stays the authority (`ControlForm` with its Initialize, Validate and Process steps, or a REST endpoint answering `400`).
- The server applies the same required rule. `ControlFormItemInput<TValue>.Validate` refuses a required input whose submitted value is empty and then skips the further rules and the page's `Validate` handlers. Whether a value is empty is told by `IControlFormInputValue.IsEmpty` - blank text, an empty list, no date, no file, an unchecked box - and by the input where the empty state is a particular value (`IsEmpty(value, context)`: a rating of zero, an estimate posted without points). A value that always holds something, a number or a range, is never empty. The message names the field (`form.validation.required`); an input may name its kind of field instead (`RequiredMessage`).
- A container presents the errors of its fields: the REST form marks the invalid field and lists its message above the fields. A field on its own is validated and marked through `Field.report(target)`, which sets `aria-invalid`.
- `Field.setError(target, text)` sets an error the field cannot know itself, typically the server refusing a value. It holds until the value changes; `null` clears it.
- `CHANGE_VALIDITY_EVENT` announces when a field or a form turns invalid or valid again; `detail.valid` tells which.
- A server refusing a save answers `400` with `{ "errors": { "<field name>": "<message>" } }` or a list of `{ "field": ..., "message": ... }`. The REST form marks those fields.

## Dirty and Reset

- The baseline of a field is its value when the controller created it. A container takes a new baseline after it loaded its fields and after it saved them (`markPristine()`). A control that settles its first value only after construction calls `webexpress.webui.Field.markPristine(this)` once it has.
- `Field.isDirty(target)` tells whether the value differs from the baseline; `Field.reset(target)` writes the baseline back, which is announced like any change.
- A control may implement `dirty`, `markPristine()` and `reset()` itself. Its own `markPristine` must not call `Field.markPristine(this)`, which would hand the call back to it.
- A form is dirty while what it would send differs from what it was rendered with, last loaded or last saved (`RestFormCtrl.dirty`).

## Saving

A saving control stores data itself, in these steps; one an application saves in code offers them as `save()`:

1. It validates. An invalid save sends nothing and answers with the kind `validation`.
2. It dispatches `BEFORE_SAVE_EVENT`, cancelable. A listener vetoes the save with `preventDefault()` - the save answers with the kind `abort` - or replaces `detail.payload`.
3. It locks what must not change while the request is out and reports `TASK_START_EVENT` and `TASK_FINISH_EVENT`. A lock afterwards enables only what it disabled.
4. It sends through the transport - `webexpress.webui.Transport` in WebUI, the service layer in WebApp - never through `fetch`.
5. On success it takes what it saved as its new baseline and dispatches `SAVED_EVENT`.
6. On failure it dispatches `DATA_ERROR_EVENT`, shows the failure where it happened and stays dirty. A value the server did not take must never be shown as saved. A control that applies a change at once - a card moved on a board, a column resized - loads the stored state back when the server refuses the change and says why (`ErrorChannel.present`).
7. The promise resolves with the normalized result `{ ok, status, data, error }` for every outcome of the request. It rejects only for an authoring error, such as a form without any endpoint. A save while another one is out answers with the kind `abort`.

## Errors

- A request never rejects. It answers with `{ ok, status, data, error }`, where `error` is `null` on success and `{ kind, status, message, retriable }` otherwise, with `kind` one of `network`, `http`, `parse`, `abort` and `validation`.
- An `abort` is the expected end of a request a newer one superseded or a teardown cancelled. It is neither shown nor reported.
- A failed load or save is reported with `DATA_ERROR_EVENT`: `detail.action` names what failed (`"load"`, `"save"`, or the control's own action such as `"move"`), `detail.error` carries the shape above and, for a refused validation, `detail.fields` the invalid fields as `{ field, message }`.
- Every request failure but an abort also reaches the global channel: `webexpress.webui.transport.error` on a page without WebApp, the `ErrorChannel` and its `webexpress.webapp.service.error` event with it.
- A handler must not throw into the controller or a store; a store keeps notifying its other listeners when one fails. An exception is for an authoring error only.

## Events

All events are constants of `webexpress.webui.Event`, bubble, and carry `sender` and `id` in their detail.

| Event                    | Dispatched by                       | When                                     | Detail
|--------------------------|-------------------------------------|------------------------------------------|------------------------------------------------
| `CHANGE_VALUE_EVENT`     | every field                         | the value changed                        | `value`
| `CHANGE_VALIDITY_EVENT`  | `Field.report`, the REST form       | a field or a form turned (in)valid       | `valid`, and `results` or `errors`
| `BEFORE_SAVE_EVENT`      | saving controls                     | before the request; cancelable           | `payload` (replaceable; the FormData of the dialog form) or `value` (smart edit); `action` for a change saved at once
| `SAVED_EVENT`            | saving controls                     | the saved state was taken over           | `data` and `status`, or `value`; `action` for a change saved at once
| `DATA_ERROR_EVENT`       | data and saving controls            | a load or a save failed                  | `action`, `error`, and `fields` for a refused validation
| `TASK_START_EVENT`, `TASK_FINISH_EVENT` | controls with requests | a request starts or ends              | `name`

## Steering an Application

An application reads and drives controls through the contract only, so the same code serves every control:

```javascript
const host = document.getElementById("order");
const form = webexpress.webui.Controller.getInstanceByElement(host);

// warn before leaving a form with unsaved changes
window.addEventListener("beforeunload", (e) => {
    if (form.dirty) {
        e.preventDefault();
    }
});

// offer the save only while the fields are valid
host.addEventListener(webexpress.webui.Event.CHANGE_VALIDITY_EVENT, (e) => {
    document.getElementById("save").disabled = !e.detail.valid;
});

// add what the page knows to every save
host.addEventListener(webexpress.webui.Event.BEFORE_SAVE_EVENT, (e) => {
    e.detail.payload = { ...e.detail.payload, channel: "web" };
});

// save in code and handle the outcome on one path
const result = await form.save();
if (!result.ok && result.error.kind !== "abort") {
    console.warn("not saved", result.error.message);
}

// show a check only the server can make on the field it concerns
webexpress.webui.Field.setError(document.getElementById("order-number"), "This number is taken.");

// drive any field the same way, whatever control it is
const due = document.getElementById("due");
webexpress.webui.Field.setValue(due, "2026-11-01");
webexpress.webui.Field.setDisabled(due, true);
```

## The C# Side

Applications are authored in C#; the contract is what the C# declarations become on the client.

| C#                                                                     | Client
|------------------------------------------------------------------------|---------------------------------------------------------------------
| `ControlFormItemInput.Disabled`                                        | the input is rendered disabled; `Field.isDisabled` is true and the field is not validated
| `ControlFormItemInput.Required`                                        | `required` on a native input, `data-required="true"` on the host of a custom one (`RequiredMark`); the required rule
| `ControlFormItemInput.Validate(handler)` with `ValidationResult`       | the server's verdict; `Field.validate` answers in the same shape, `TypeInputValidity.Error` and `Warning` as `"error"` and `"warning"`
| `ControlForm`: Initialize, Validate, Process                           | load, validate and save of a saving control
| `IDataIsland`: `wx-state`, `wx-service`                                | the state a control is seeded with, the services it loads and saves through
| a REST endpoint answering `400` with `errors`                          | the fields marked, `DATA_ERROR_EVENT` with `fields`

## Conformance

The contract is checked on the shipped sources:

- `controls.contract.mjs` (in `WebExpress.WebUI.Test/JsTest` and `WebExpress.WebApp.Test/JsTest`) runs for every registered control: it constructs and tears it down without a swallowed error, and a field must be pristine when it appears, stay silent and pristine when its own value is written back, and validate in the result shape. A new control is covered by calling `contract(...)` in its test file.
- `field.test.mjs` covers `webexpress.webui.Field`, `field.inputs.test.mjs` the change rule on the controls that once stayed silent, `control.restform.contract.test.mjs` the REST form and `control.smart-edit.persistence.test.mjs` the inline editor as saving controls.

- `control.modal-form.save.test.mjs` covers the dialog form, `control.saved-changes.test.mjs` the controls that save a change the moment it is made, and `UnitTestControlFormItemInputRequired` that every custom input renders its required mark and that the server refuses every required input submitted empty.

The saving side is implemented in three shapes:

| Shape                         | Controls                                                    | Entry
|-------------------------------|-------------------------------------------------------------|----------------------------------------------
| a form saved as a whole       | REST form (`RestFormCtrl`), REST wizard                     | `save()`
| an edit saved when confirmed  | inline editor (`SmartEditCtrl`), dialog form (`ModalFormCtrl`) | the confirm button of the edit or the dialog
| a change saved at once        | table, kanban, gantt, schedule, dashboard                   | every change; the gantt sandbox through `saveSandbox()`

The dialog form posts to the server and shows the form the server rendered back; the state field the C# `ControlForm` renders with it tells whether the server's validation refused the values. A control that saves a change at once has nothing to offer as `save()`; it stores each change through `_saveAction(action, payload, send, takeBack)` of the `Ctrl` base, which announces the change before it is sent, takes a vetoed change back without a word of failure and announces a stored one as saved.