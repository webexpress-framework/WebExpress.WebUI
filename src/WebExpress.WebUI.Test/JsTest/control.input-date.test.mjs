/**
 * Headless contract test for the InputDateCtrl control (wx-webui-input-date).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { test } from "node:test";
import assert from "node:assert";
import { contract } from "./controls.contract.mjs";
import { loadWebUi, webuiAsset } from "./harness.mjs";

contract({
    file: "webexpress.webui.input.date.js",
    selector: "wx-webui-input-date",
    ctrl: "InputDateCtrl"
});

test("an empty field pages from the current month instead of failing", () => {
    const rt = loadWebUi({ browser: true, extraFiles: [webuiAsset("webexpress.webui.input.date.js")] });
    for (const range of [false, true]) {
        const host = rt.document.createElement("div");
        if (range) {
            host.setAttribute("data-range", "true");
        }
        rt.document.body.appendChild(host);
        const ctrl = new rt.wx.InputDateCtrl(host);
        const [prevYear, prevMonth, nextMonth] = host.querySelectorAll(".wx-calendar-nav");
        const now = new Date();

        nextMonth.dispatchEvent(new rt.sandbox.Event("click"));
        const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        assert.equal(ctrl._viewDate.getMonth(), next.getMonth(), `range ${range}: one month on`);

        prevMonth.dispatchEvent(new rt.sandbox.Event("click"));
        prevYear.dispatchEvent(new rt.sandbox.Event("click"));
        assert.equal(ctrl._viewDate.getFullYear(), now.getFullYear() - 1, `range ${range}: one year back`);
        assert.equal(ctrl._viewDate.getMonth(), now.getMonth(), `range ${range}: back in the current month`);
        assert.equal(ctrl._input.value, "", `range ${range}: paging selects nothing`);
    }
});

test("paging from the 31st does not skip a short month", () => {
    const rt = loadWebUi({ browser: true, extraFiles: [webuiAsset("webexpress.webui.input.date.js")] });
    const host = rt.document.createElement("div");
    host.setAttribute("data-format", "yyyy-MM-dd");
    host.setAttribute("data-value", "2026-01-31");
    // the dom stub does not mirror attributes into dataset, which the control reads
    host.dataset.value = "2026-01-31";
    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.InputDateCtrl(host);

    ctrl._changeView(1, "month");

    assert.equal(ctrl._viewDate.getMonth(), 1, "january is followed by february");
    assert.equal(ctrl.value.getDate(), 31, "the selected date is left alone");
});
