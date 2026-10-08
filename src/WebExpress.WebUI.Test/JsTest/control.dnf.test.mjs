/**
 * Headless tests for the DNF value model and the read-only DNF view
 * (wx-webui-dnf). The shared contract (controls.contract.mjs) verifies that the
 * control registers correctly and survives a construct / teardown lifecycle;
 * the tests below pin what the notation means and what a reader is shown.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.dnf.js",
    selector: "wx-webui-dnf",
    ctrl: "DnfCtrl"
});

/**
 * Loads a runtime carrying the DNF sources. The shipped English catalogue is
 * loaded with them, because the operator words are the whole point of the view
 * and asserting against untranslated keys would prove nothing about it.
 * @returns {object} The loaded runtime.
 */
function load() {
    return loadWebUi({ browser: true, extraFiles: ["i18n/en.js", "webexpress.webui.dnf.js"] });
}

/**
 * Builds a connected host with the declared options of the examples.
 * @param {object} rt - The loaded runtime.
 * @param {object} [attributes] - Dataset entries for the host.
 * @returns {object} The host element.
 */
function host(rt, attributes = {}) {
    const element = rt.createElement("div");

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

test("the notation carries both levels: terms with ';', conjunctions with '|'", () => {
    const rt = load();

    assert.deepEqual(rt.wx.DnfValue.parse("a;b|c"), [["a", "b"], ["c"]]);
    assert.equal(rt.wx.DnfValue.format([["a", "b"], ["c"]]), "a;b|c");
});

test("a flat list is one conjunction, so a selection value is already a valid expression", () => {
    const rt = load();

    assert.deepEqual(rt.wx.DnfValue.parse(["a", "b"]), [["a", "b"]]);
    assert.deepEqual(rt.wx.DnfValue.parse("a;b"), [["a", "b"]]);
});

test("nothing that carries no meaning survives parsing", () => {
    const rt = load();

    // a blank term, a repeat inside one conjunction (A and A is A) and a group
    // that ended up empty all describe nothing and are dropped
    assert.deepEqual(rt.wx.DnfValue.parse("a; ;a|;|b"), [["a"], ["b"]]);
    assert.deepEqual(rt.wx.DnfValue.parse(""), []);
    assert.deepEqual(rt.wx.DnfValue.parse(null), []);
});

test("objects are accepted, because that is the shape a REST payload arrives in", () => {
    const rt = load();

    assert.deepEqual(rt.wx.DnfValue.parse([[{ id: "a" }, { id: "b" }], [{ id: "c" }]]), [["a", "b"], ["c"]]);
});

test("equality is about meaning, not about the notation it was written in", () => {
    const rt = load();

    assert.ok(rt.wx.DnfValue.equals("a;b", [["a", "b"]]), "the same expression in two notations");
    assert.ok(!rt.wx.DnfValue.equals("a;b", "a|b"), "one conjunction is not two");
});

test("the readable form brackets a conjunction only where the precedence is in question", () => {
    const rt = load();

    assert.equal(rt.wx.DnfValue.toText("a;b", null, "and", "or"), "a and b", "a lone conjunction needs no bracket");
    assert.equal(rt.wx.DnfValue.toText("a;b|c", null, "and", "or"), "(a and b) or c");
});

test("the view renders the operators as text, so the expression can be read and copied", () => {
    const rt = load();
    const element = host(rt, { value: "a;b|c" });

    const ctrl = new rt.wx.DnfCtrl(element);

    assert.equal(ctrl.text, "(Amsterdam and Berlin) or Cairo", "labels, not ids");
    assert.equal(
        element.querySelectorAll(".wx-dnf-operator").length,
        2,
        "one 'and' inside the first conjunction and one 'or' between the conjunctions"
    );
    assert.equal(element.querySelectorAll(".wx-dnf-term").length, 3, "one chip per term");
});

test("a term without a registered option still shows, as itself", () => {
    const rt = load();
    const element = host(rt, { value: "a;zz" });

    const ctrl = new rt.wx.DnfCtrl(element);

    // a value that arrived before its options did would otherwise read as an
    // empty filter, which is the one thing a filter must never claim falsely
    assert.equal(ctrl.text, "Amsterdam and zz");
});

test("options arriving later relabel the expression already on screen", () => {
    const rt = load();
    const element = rt.createElement("div");
    element.dataset.value = "a;b";
    rt.document.body.appendChild(element);

    const ctrl = new rt.wx.DnfCtrl(element);
    assert.equal(ctrl.text, "a and b", "no options yet, so the ids stand in");

    ctrl.options = [{ id: "a", label: "Amsterdam" }, { id: "b", label: "Berlin" }];

    assert.equal(ctrl.text, "Amsterdam and Berlin");
});

test("the compact view keeps the full expression reachable in the title", () => {
    const rt = load();
    const element = host(rt, { value: "a;b|c", compact: "true" });

    new rt.wx.DnfCtrl(element);

    assert.equal(element.getAttribute("title"), "(Amsterdam and Berlin) or Cairo");
});

test("an empty expression shows the placeholder instead of an empty box", () => {
    const rt = load();
    const element = host(rt, { placeholder: "No filter" });

    const ctrl = new rt.wx.DnfCtrl(element);

    assert.equal(element.querySelectorAll(".wx-dnf-placeholder").length, 1);
    assert.deepEqual(ctrl.value, []);
});
