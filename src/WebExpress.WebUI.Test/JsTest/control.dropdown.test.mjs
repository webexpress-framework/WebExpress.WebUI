/**
 * Headless contract test for the DropdownCtrl control (wx-webui-dropdown).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.dropdown.js",
    selector: "wx-webui-dropdown",
    ctrl: "DropdownCtrl"
});

for (const css of [" dropdown-toggle", " first  second ", "first\tsecond\nthird", "   "]) {
    test(`dropdown ignores empty CSS tokens in ${JSON.stringify(css)}`, () => {
        // arrange
        const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.dropdown.js"] });
        const element = rt.createElement("div");
        element.dataset.buttoncss = css;
        element.dataset.menucss = css;

        // act
        const ctrl = new rt.wx.DropdownCtrl(element);

        // validation
        const expected = css.split(/\s+/).filter(Boolean);
        for (const target of [element.querySelector("button"), element.querySelector("ul")]) {
            const tokens = [...target.classList];
            assert.ok(tokens.every(token => token.length > 0 && !/\s/.test(token)));
            assert.ok(expected.every(token => tokens.includes(token)));
        }
        ctrl.destroy();
    });
}