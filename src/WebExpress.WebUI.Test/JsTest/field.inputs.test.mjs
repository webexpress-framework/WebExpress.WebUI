/**
 * Headless tests for the change rule of the control contract (docs/js/contract.md) on the
 * controls that used to stay silent: a field announces every change of its value with
 * CHANGE_VALUE_EVENT, whether the user or code made it, and the detail carries the value the
 * getter returns; writing the current value back announces nothing.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";

/**
 * Creates an input through the controller on an empty host and records what it announces.
 * @param {string} file - The source file of the input.
 * @param {string} selector - The marker class.
 * @param {Function} [prepare] - Gives the host the structure the control reads.
 * @returns {object} The runtime, the control and the recorded announcements.
 */
function create(file, selector, prepare) {
    const rt = loadWebUi({ browser: true, extraFiles: [file] });
    const host = rt.createElement("div");
    host.classList.add(selector);
    host.setAttribute("name", "field");
    prepare?.(rt, host);
    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);
    const ctrl = rt.wx.Controller.getInstanceByElement(host);
    const announced = [];
    host.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, (e) => announced.push(JSON.parse(JSON.stringify(e.detail.value))));
    return { rt, ctrl, announced };
}

const cases = [
    ["webexpress.webui.input.password.js", "wx-webui-input-password", "secret"],
    ["webexpress.webui.input.cascading.js", "wx-webui-input-cascading", ["europe", "germany"]],
    ["webexpress.webui.input.tag.js", "wx-webui-input-tag", "red;green"],
    // the display controls take their value from the page; it still changes, and is announced
    ["webexpress.webui.color.js", "wx-webui-color", "#ff0000"],
    ["webexpress.webui.content.js", "wx-webui-content", "Deep in the Caribbean"],
    ["webexpress.webui.date.js", "wx-webui-date", "2026-10-20"],
    ["webexpress.webui.rating.js", "wx-webui-rating", 3],
    ["webexpress.webui.tag.js", "wx-webui-tag", "red;green"],
    ["webexpress.webui.traffic.light.js", "wx-webui-traffic-light", "red"],
    // a search surface announces its filter, and its value beside it
    ["webexpress.webui.search.js", "wx-webui-search", "zurich"],
    ["webexpress.webui.search.content.js", "wx-webui-search-content", "zurich"],
    // the read-only view reads its inner element via firstElementChild
    ["webexpress.webui.smartview.js", "wx-webui-smart-view", "Grace", (rt, host) => host.appendChild(rt.createElement("div"))]
];

for (const [file, selector, next, prepare] of cases) {
    test(`${selector} announces a value written in code, once`, () => {
        const { rt, ctrl, announced } = create(file, selector, prepare);

        ctrl.value = next;
        ctrl.value = next;

        assert.deepEqual(announced, [JSON.parse(JSON.stringify(ctrl.value))]);
        assert.equal(rt.wx.Field.isDirty(ctrl), true);
    });
}

test("the tag input announces a tag the user adds or removes", () => {
    const { ctrl, announced } = create("webexpress.webui.input.tag.js", "wx-webui-input-tag");

    ctrl._addTag("blue");
    ctrl._addTag("blue");
    ctrl._removeTag("blue");

    assert.deepEqual(announced, ["blue", ""], "a duplicate changes nothing and is not announced");
});

test("the slider carries the value in the detail beside its bounds", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.slider.js"] });
    const host = rt.createElement("div");
    host.classList.add("wx-webui-input-slider");
    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);
    const ctrl = rt.wx.Controller.getInstanceByElement(host);
    const details = [];
    host.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, (e) => details.push(JSON.parse(JSON.stringify({
        value: e.detail.value,
        valueMin: e.detail.valueMin,
        valueMax: e.detail.valueMax
    }))));

    ctrl.value = "10;20";

    assert.equal(details.length, 1);
    assert.deepEqual(details[0].value, JSON.parse(JSON.stringify(ctrl.value)));
    assert.equal(details[0].valueMin, 10);
    assert.equal(details[0].valueMax, 20);
});
