/**
 * Headless tests for the DNF input control (wx-webui-input-dnf). The shared
 * contract (controls.contract.mjs) verifies that the control registers
 * correctly and survives a construct / teardown lifecycle; the tests below pin
 * how the two levels of the expression are edited.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

const sources = [
    "i18n/en.js",
    "webexpress.webui.dnf.js",
    "webexpress.webui.input.selection.js",
    "webexpress.webui.input.dnf.js"
];

contract({
    file: "webexpress.webui.input.dnf.js",
    selector: "wx-webui-input-dnf",
    ctrl: "InputDnfCtrl",
    deps: sources.slice(0, -1)
});

/**
 * Loads a runtime carrying the DNF input and everything it composes.
 * @returns {object} The loaded runtime.
 */
function load() {
    return loadWebUi({ browser: true, extraFiles: sources });
}

/**
 * Builds a connected host with the declared options of the examples.
 * @param {object} rt - The loaded runtime.
 * @param {object} [attributes] - Dataset entries for the host.
 * @returns {object} The host element.
 */
function host(rt, attributes = {}) {
    const element = rt.createElement("div");
    element.id = "filter";
    element.setAttribute("name", "filter");

    [["a", "Amsterdam"], ["b", "Berlin"], ["c", "Cairo"]].forEach(([id, label]) => {
        const option = rt.createElement("div");
        option.classList.add("wx-selection-item");
        option.id = id;
        option.dataset.label = label;
        element.appendChild(option);
    });

    Object.assign(element.dataset, attributes);
    rt.document.body.appendChild(element);

    return element;
}

/**
 * Returns the field the whole expression is submitted in.
 * @param {object} element - The host element.
 * @returns {object} The hidden input.
 */
function submitted(element) {
    return element.querySelector("input");
}

test("an empty control still offers the one conjunction an expression is made of", () => {
    const rt = load();
    const ctrl = new rt.wx.InputDnfCtrl(host(rt));

    assert.equal(ctrl.groupCount, 1, "there is something to edit");
    assert.deepEqual(ctrl.value, [], "but the expression itself is empty");
});

test("the declared value is spread over one group per conjunction", () => {
    const rt = load();
    const element = host(rt, { value: "a;b|c" });

    const ctrl = new rt.wx.InputDnfCtrl(element);

    assert.equal(ctrl.groupCount, 2);
    assert.deepEqual(ctrl.value, [["a", "b"], ["c"]]);
    assert.equal(submitted(element).value, "a;b|c", "the form carries the whole expression in one field");
});

test("every group offers the same options, because a term is a property of the subject", () => {
    const rt = load();
    const ctrl = new rt.wx.InputDnfCtrl(host(rt, { value: "a|b" }));

    const labels = ctrl._groups.map((group) => group.ctrl.options.map((item) => item.label));

    assert.deepEqual(labels, [
        ["Amsterdam", "Berlin", "Cairo"],
        ["Amsterdam", "Berlin", "Cairo"]
    ]);
});

test("the groups pick from a shared multi-select, so a group is a conjunction", () => {
    const rt = load();
    const ctrl = new rt.wx.InputDnfCtrl(host(rt, { value: "a;b" }));

    assert.equal(ctrl._groups[0].ctrl.multiSelect, true);
    assert.deepEqual(ctrl._groups[0].ctrl.value, ["a", "b"]);
});

test("closing the first group empties it, because the expression cannot lose its last conjunction", () => {
    const rt = load();
    const element = host(rt, { value: "a;b|c" });
    const ctrl = new rt.wx.InputDnfCtrl(element);

    ctrl._groups[0].close.dispatchEvent({ type: "click" });

    assert.equal(ctrl.groupCount, 2, "the group itself stays");
    assert.deepEqual(ctrl.value, [["c"]], "only its terms are gone");
    assert.equal(submitted(element).value, "c");
});

test("closing a further group removes the whole conjunction", () => {
    const rt = load();
    const element = host(rt, { value: "a;b|c" });
    const ctrl = new rt.wx.InputDnfCtrl(element);

    ctrl._groups[1].close.dispatchEvent({ type: "click" });

    assert.equal(ctrl.groupCount, 1);
    assert.deepEqual(ctrl.value, [["a", "b"]]);
    assert.equal(submitted(element).value, "a;b");
});

test("the add button appends a conjunction and the OR words are rebuilt around it", () => {
    const rt = load();
    const element = host(rt, { value: "a" });
    const ctrl = new rt.wx.InputDnfCtrl(element);

    ctrl._addButtonElement.dispatchEvent({ type: "click" });
    ctrl._addButtonElement.dispatchEvent({ type: "click" });

    assert.equal(ctrl.groupCount, 3);
    assert.equal(
        element.querySelectorAll(".wx-dnf-separator").length,
        2,
        "one OR between each pair of conjunctions, never before the first"
    );
});

test("a limit stops the expression from growing and says so on the button", () => {
    const rt = load();
    const ctrl = new rt.wx.InputDnfCtrl(host(rt, { value: "a", maxGroups: "2" }));

    assert.equal(ctrl.addGroup(), true);
    assert.equal(ctrl.addGroup(), false, "the limit is reached");
    assert.equal(ctrl.groupCount, 2);
    assert.equal(ctrl._addButtonElement.disabled, true);
});

test("the AND marker appears exactly where a conjunction has something to conjoin", () => {
    const rt = load();
    const ctrl = new rt.wx.InputDnfCtrl(host(rt, { value: "a;b|c" }));

    assert.equal(ctrl._groups[0].badge.hidden, false, "two terms are conjoined");
    assert.equal(ctrl._groups[1].badge.hidden, true, "a single term conjoins nothing");
});

test("a change inside a group is reported once, as the change of the whole expression", () => {
    const rt = load();
    const element = host(rt, { value: "a|b" });
    const ctrl = new rt.wx.InputDnfCtrl(element);

    const seen = [];
    element.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, (e) => seen.push(e.detail.value));

    ctrl._groups[0].ctrl.value = ["a", "c"];

    assert.equal(seen.length, 1, "the group's own change is absorbed, not forwarded");
    assert.deepEqual(seen[0], [["a", "c"], ["b"]], "and answered with the whole expression");
    assert.equal(submitted(element).value, "a;c|b");
});

test("building the control is not a change, so a host is not told about its own markup", () => {
    const rt = load();
    const element = host(rt, { value: "a;b|c" });

    const seen = [];
    element.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, () => seen.push(1));
    new rt.wx.InputDnfCtrl(element);

    assert.deepEqual(seen, []);
});

test("re-assigning the expression announces it once, not once per group it rewrote", () => {
    const rt = load();
    const element = host(rt, { value: "a|b" });
    const ctrl = new rt.wx.InputDnfCtrl(element);

    const seen = [];
    element.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, (e) => seen.push(e.detail.value));

    // both groups are rewritten, and each rewrite is a change of a selection
    // control; a host has to hear the one change that happened to the expression
    ctrl.value = "b|a";

    assert.equal(seen.length, 1);
    assert.deepEqual(seen[0], [["b"], ["a"]]);
});

test("assigning the same expression again leaves the groups untouched", () => {
    const rt = load();
    const element = host(rt, { value: "a;b|c" });
    const ctrl = new rt.wx.InputDnfCtrl(element);
    const before = ctrl._groups.map((group) => group.ctrl);

    const seen = [];
    element.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, () => seen.push(1));
    ctrl.value = [["a", "b"], ["c"]];

    assert.deepEqual(ctrl._groups.map((group) => group.ctrl), before, "the same group controls survive");
    assert.deepEqual(seen, [], "and nothing is announced");
});

test("assigning a shorter expression drops the groups it no longer needs", () => {
    const rt = load();
    const element = host(rt, { value: "a|b|c" });
    const ctrl = new rt.wx.InputDnfCtrl(element);

    ctrl.value = "a;c";

    assert.equal(ctrl.groupCount, 1);
    assert.deepEqual(ctrl.value, [["a", "c"]]);
    assert.equal(element.querySelectorAll(".wx-dnf-group").length, 1, "the removed groups left no markup behind");
    assert.equal(element.querySelectorAll(".wx-dnf-separator").length, 0);
});

test("clearing the expression keeps one group to edit", () => {
    const rt = load();
    const element = host(rt, { value: "a;b|c" });
    const ctrl = new rt.wx.InputDnfCtrl(element);

    ctrl.value = null;

    assert.equal(ctrl.groupCount, 1);
    assert.deepEqual(ctrl.value, []);
    assert.equal(submitted(element).value, "");
});

test("replacing the options keeps the terms that still exist", () => {
    const rt = load();
    const element = host(rt, { value: "a;b|c" });
    const ctrl = new rt.wx.InputDnfCtrl(element);

    // a REST backed refresh of the option list must not silently rewrite the
    // filter the user built
    ctrl.options = [{ id: "a", label: "Amsterdam" }, { id: "b", label: "Berlin" }, { id: "c", label: "Cairo" }];

    assert.deepEqual(ctrl.value, [["a", "b"], ["c"]]);
    assert.equal(submitted(element).value, "a;b|c");
});

test("teardown releases the group controls the controller cannot reach", () => {
    const rt = load();
    const ctrl = new rt.wx.InputDnfCtrl(host(rt, { value: "a|b" }));
    const destroyed = [];

    ctrl._groups.forEach((group) => { group.ctrl.destroy = () => destroyed.push(group); });

    ctrl.destroy();

    assert.equal(destroyed.length, 2, "both groups were built here, so both are released here");
    assert.equal(ctrl.groupCount, 0);
});
