/**
 * Headless tests for the field side of the control contract (docs/js/contract.md):
 * webexpress.webui.Field reads and drives native inputs and controls in one shape, fills in
 * what a control leaves out, and lets a control's own members win where it has them.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";

/**
 * Copies a value out of the vm context, whose arrays and objects fail a strict deep equality
 * against literals of this realm.
 * @param {*} value - The value.
 * @returns {*} The copy.
 */
const plain = (value) => JSON.parse(JSON.stringify(value));

/**
 * Loads a runtime and defines a minimal value control inside it: a value, the change event
 * on a real change, and a named hidden input like the shipped inputs keep.
 * @returns {object} The runtime and the control class.
 */
function load() {
    const rt = loadWebUi({ browser: true });
    const Ctrl = rt.wx.Ctrl;
    const Event = rt.wx.Event;

    class ValueCtrl extends Ctrl {
        constructor(element) {
            super(element);
            this._value = element.getAttribute("data-value") || "";
            this._hidden = rt.createElement("input");
            this._hidden.type = "hidden";
            this._hidden.setAttribute("name", element.getAttribute("data-name") || "field");
            element.appendChild(this._hidden);
        }

        get value() {
            return this._value;
        }

        set value(value) {
            const next = value == null ? "" : String(value);
            if (next === this._value) {
                return;
            }
            this._value = next;
            this._hidden.value = next;
            this._dispatch(Event.CHANGE_VALUE_EVENT, { value: next });
        }
    }

    rt.wx.Controller.registerClass("wx-test-value", ValueCtrl);
    return { rt, ValueCtrl };
}

/**
 * Builds a connected host of the test control and lets the controller create it.
 * @param {object} rt - The runtime.
 * @param {object} [attributes={}] - Attributes of the host.
 * @returns {object} The host and the control.
 */
function create(rt, attributes = {}) {
    const host = rt.createElement("div");
    host.classList.add("wx-test-value");
    for (const [name, value] of Object.entries(attributes)) {
        host.setAttribute(name, value);
    }
    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);
    return { host, ctrl: rt.wx.Controller.getInstanceByElement(host) };
}

/**
 * Builds a native text input.
 * @param {object} rt - The runtime.
 * @param {object} [attributes={}] - Attributes of the input.
 * @returns {object} The input.
 */
function nativeInput(rt, attributes = {}) {
    const el = rt.createElement("input");
    el.type = "text";
    el.value = "";
    for (const [name, value] of Object.entries(attributes)) {
        el.setAttribute(name, value);
    }
    rt.document.body.appendChild(el);
    return el;
}

test("a native input and a control are fields; a plain element is not", () => {
    const { rt } = load();
    const { host, ctrl } = create(rt);
    const Field = rt.wx.Field;

    assert.equal(Field.isField(nativeInput(rt)), true);
    assert.equal(Field.isField(ctrl), true);
    assert.equal(Field.isField(host), true, "the host resolves to its control");
    assert.equal(Field.isField(rt.createElement("div")), false);
});

test("a write to a native field is announced like one the user made, and only when it moved", () => {
    const { rt } = load();
    const Field = rt.wx.Field;
    const el = nativeInput(rt);
    const changes = [];
    el.addEventListener("change", () => changes.push(el.value));

    Field.setValue(el, "Guybrush");
    Field.setValue(el, "Guybrush");
    Field.setValue(el, ["a", "b"]);

    assert.deepEqual(changes, ["Guybrush", "a;b"], "a list is written in the server's list form");
    assert.equal(Field.getValue(el), "a;b");
});

test("a control the controller created is pristine; a change makes it dirty and reset brings it back", () => {
    const { rt } = load();
    const Field = rt.wx.Field;
    const { host, ctrl } = create(rt, { "data-value": "Monkey Island" });
    const announced = [];
    host.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, (e) => announced.push(e.detail.value));

    assert.equal(Field.isDirty(ctrl), false);

    ctrl.value = "Melee Island";
    assert.equal(Field.isDirty(host), true);

    Field.reset(ctrl);
    assert.equal(ctrl.value, "Monkey Island");
    assert.equal(Field.isDirty(ctrl), false);
    assert.deepEqual(announced, ["Melee Island", "Monkey Island"], "the reset is a change like any other");

    ctrl.value = "Scabb Island";
    Field.markPristine(ctrl);
    assert.equal(Field.isDirty(ctrl), false, "a saved value is the new baseline");
});

test("a field without a baseline is pristine from the first question on", () => {
    const { rt, ValueCtrl } = load();
    const Field = rt.wx.Field;
    const host = rt.createElement("div");
    rt.document.body.appendChild(host);
    const ctrl = new ValueCtrl(host);

    assert.equal(Field.isDirty(ctrl), false);
    ctrl.value = "changed";
    assert.equal(Field.isDirty(ctrl), true);
});

test("the required rule reads the markers a server or a control leaves", () => {
    const { rt } = load();
    const Field = rt.wx.Field;

    const native = nativeInput(rt, { required: "" });
    assert.equal(Field.isRequired(native), true);
    assert.equal(Field.validate(native)[0].source, "required");

    // the shipped inputs mark the hidden input they submit through, some only in the dataset
    const { ctrl } = create(rt);
    assert.equal(Field.isRequired(ctrl), false);
    ctrl._hidden.dataset.wxRequired = "true";
    assert.equal(Field.isRequired(ctrl), true);
    assert.deepEqual(plain(Field.validate(ctrl).map((r) => r.text)), ["This field is required."]);

    ctrl.value = "filled";
    assert.deepEqual(plain(Field.validate(ctrl)), []);

    const { ctrl: marked } = create(rt, { "data-required": "true" });
    assert.equal(Field.isRequired(marked), true, "the host marker of the server counts as well");
});

test("a control whose empty state is a particular value says so for the required rule", () => {
    const { rt } = load();
    const Field = rt.wx.Field;
    const { ctrl } = create(rt, { "data-required": "true" });
    let empty = true;
    Object.defineProperty(ctrl, "empty", { get: () => empty });
    ctrl.value = "0";

    assert.equal(Field.validate(ctrl)[0].source, "required", "a value the control calls empty is missing");

    empty = false;
    ctrl.value = "";
    assert.deepEqual(plain(Field.validate(ctrl)), [], "the control's word wins over the text");
});

test("a rating without a star and a light that is off are missing for the required rule", () => {
    for (const [file, selector, filled] of [
        ["webexpress.webui.input.rating.js", "wx-webui-input-rating", 3],
        ["webexpress.webui.input.traffic.light.js", "wx-webui-input-traffic-light", "red"]
    ]) {
        const rt = loadWebUi({ browser: true, extraFiles: [file] });
        const host = rt.createElement("div");
        host.classList.add(selector);
        host.setAttribute("data-required", "true");
        rt.document.body.appendChild(host);
        rt.wx.Controller.createInstances(host);
        const ctrl = rt.wx.Controller.getInstanceByElement(host);

        assert.equal(rt.wx.Field.validate(ctrl).length, 1, `${selector} starts out empty`);
        ctrl.value = filled;
        assert.equal(rt.wx.Field.validate(ctrl).length, 0, `${selector} holds a value`);
    }
});

test("a disabled field is not validated, as on the server", () => {
    const { rt } = load();
    const Field = rt.wx.Field;
    const native = nativeInput(rt, { required: "", disabled: "" });

    assert.equal(Field.isDisabled(native), true);
    assert.deepEqual(plain(Field.validate(native)), []);
});

test("a control the server rendered disabled is disabled, however the server marked it", () => {
    const { rt } = load();
    const Field = rt.wx.Field;

    const marks = [
        ["the disabled attribute", (host) => host.setAttribute("disabled", "")],
        ["aria-disabled", (host) => host.setAttribute("aria-disabled", "true")],
        ["the disabled class", (host) => host.classList.add("disabled")]
    ];
    for (const [name, mark] of marks) {
        const { host, ctrl } = create(rt);
        assert.equal(Field.isDisabled(ctrl), false);
        mark(host);
        assert.equal(Field.isDisabled(ctrl), true, `${name} disables`);
    }

    const fieldset = rt.createElement("fieldset");
    fieldset.setAttribute("disabled", "");
    rt.document.body.appendChild(fieldset);
    const { host, ctrl } = create(rt);
    fieldset.appendChild(host);
    assert.equal(Field.isDisabled(ctrl), true, "a disabled fieldset around it disables");
});

test("whatever a control's own validate answers counts in one result shape", () => {
    const { rt } = load();
    const Field = rt.wx.Field;
    const { ctrl } = create(rt);
    const outcomes = [
        [["too short"], [{ type: "error", text: "too short", source: "control" }]],
        ["no", [{ type: "error", text: "no", source: "control" }]],
        [false, [{ type: "error", text: "Invalid value.", source: "control" }]],
        [true, []],
        [[{ type: "Warning", message: "unusual" }], [{ type: "warning", text: "unusual", source: "control" }]]
    ];

    for (const [outcome, expected] of outcomes) {
        ctrl.validate = () => outcome;
        assert.deepEqual(plain(Field.validate(ctrl)), expected);
    }
});

test("an external error holds until the value changes and is reported as a turn of validity", () => {
    const { rt } = load();
    const Field = rt.wx.Field;
    const { host, ctrl } = create(rt);
    const turns = [];
    host.addEventListener(rt.wx.Event.CHANGE_VALIDITY_EVENT, (e) => turns.push(e.detail.valid));

    Field.setError(ctrl, "already taken");
    assert.equal(host.getAttribute("aria-invalid"), "true");
    assert.equal(Field.validate(ctrl)[0].source, "external");

    Field.setError(ctrl, "still taken");
    assert.deepEqual(turns, [false], "a second error is no new turn");

    ctrl.value = "another name";
    assert.equal(host.hasAttribute("aria-invalid"), false);
    assert.deepEqual(plain(Field.validate(ctrl)), []);
    assert.deepEqual(turns, [false, true]);
});

test("an external error cleared in code leaves nothing waiting for the next change", () => {
    const { rt } = load();
    const Field = rt.wx.Field;
    const { host, ctrl } = create(rt);
    const waiting = () => (host._listeners[rt.wx.Event.CHANGE_VALUE_EVENT] || new Set()).size;
    const before = waiting();

    Field.setError(ctrl, "taken");
    Field.setError(ctrl, "still taken");
    assert.equal(waiting(), before + 1, "one listener waits, however often the error is set");

    Field.setError(ctrl, null);
    assert.equal(waiting(), before);
    assert.equal(host.hasAttribute("aria-invalid"), false);
});

test("disabling a control without a setter switches off only what was on and back", () => {
    const { rt } = load();
    const Field = rt.wx.Field;
    const { host, ctrl } = create(rt);
    const button = rt.createElement("button");
    const locked = rt.createElement("button");
    locked.disabled = true;
    host.appendChild(button);
    host.appendChild(locked);

    Field.setDisabled(ctrl, true);
    assert.equal(Field.isDisabled(ctrl), true);
    assert.equal(button.disabled, true);

    Field.setDisabled(ctrl, false);
    assert.equal(Field.isDisabled(ctrl), false);
    assert.equal(button.disabled, false);
    assert.equal(locked.disabled, true, "what was disabled before stays so");
});

test("a control's own members win over the defaults", () => {
    const { rt } = load();
    const Field = rt.wx.Field;
    const { ctrl } = create(rt);
    const calls = [];
    let disabled = false;
    Object.defineProperty(ctrl, "disabled", { get: () => disabled, set: (v) => { calls.push("disabled:" + v); disabled = v; } });
    Object.defineProperty(ctrl, "dirty", { get: () => true });
    Object.defineProperty(ctrl, "required", { get: () => true });
    ctrl.markPristine = () => calls.push("markPristine");
    ctrl.reset = () => calls.push("reset");

    Field.setDisabled(ctrl, true);
    Field.markPristine(ctrl);
    Field.reset(ctrl);

    assert.equal(Field.isDisabled(ctrl), true);
    assert.equal(Field.isDirty(ctrl), true);
    assert.equal(Field.isRequired(ctrl), true);
    assert.deepEqual(calls, ["disabled:true", "markPristine", "reset"]);
});

test("a change saved at once is announced before and after, and a listener may replace what is sent", async () => {
    const { rt } = load();
    const { host, ctrl } = create(rt);
    const events = [];
    host.addEventListener(rt.wx.Event.BEFORE_SAVE_EVENT, (e) => {
        events.push("before:" + e.detail.action);
        e.detail.payload = { moved: "card 2" };
    });
    host.addEventListener(rt.wx.Event.SAVED_EVENT, (e) => events.push("saved:" + e.detail.action));
    const sent = [];

    const result = await ctrl._saveAction("move", { moved: "card 1" }, async (payload) => {
        sent.push(payload.moved);
        return { ok: true, status: 200, data: null, error: null };
    });

    assert.equal(result.ok, true);
    assert.deepEqual(sent, ["card 2"]);
    assert.deepEqual(events, ["before:move", "saved:move"]);
});

test("a vetoed change saved at once is taken back, not sent, and answered with an abort", async () => {
    const { rt } = load();
    const { host, ctrl } = create(rt);
    host.addEventListener(rt.wx.Event.BEFORE_SAVE_EVENT, (e) => e.preventDefault());
    let sent = 0;
    let takenBack = 0;

    const result = await ctrl._saveAction("move", {}, async () => { sent++; return { ok: true }; }, () => takenBack++);

    assert.equal(sent, 0);
    assert.equal(takenBack, 1);
    assert.equal(result.error.kind, "abort");
});

test("a cancelable announcement tells the veto of a listener", () => {
    const { rt } = load();
    const { host, ctrl } = create(rt);
    host.addEventListener(rt.wx.Event.BEFORE_SAVE_EVENT, (e) => e.preventDefault());

    const vetoed = ctrl._dispatch(rt.wx.Event.BEFORE_SAVE_EVENT, { payload: {} }, { cancelable: true });
    const plain = ctrl._dispatch(rt.wx.Event.SAVED_EVENT, {});

    assert.equal(vetoed.defaultPrevented, true);
    assert.equal(plain.defaultPrevented, false);
});
