/**
 * Headless contract test for the ListCtrl control (wx-webui-list).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.list.js",
    selector: "wx-webui-list",
    ctrl: "ListCtrl"
});

for (const [name, crypto] of [
    ["without crypto", undefined],
    ["without randomUUID", {}],
    ["with randomUUID", { randomUUID: () => "test-uuid" }]
]) {
    test(`list renders unkeyed items ${name} and preserves their keys`, () => {
        const runtime = loadWebUi({
            browser: true,
            extraFiles: ["webexpress.webui.list.js"],
            globals: { crypto }
        });
        const host = runtime.document.createElement("div");
        for (const label of ["First", "Second"]) {
            const row = runtime.document.createElement("div");
            row.className = "wx-list-item";
            row.textContent = label;
            host.appendChild(row);
        }
        runtime.document.body.appendChild(host);

        const ctrl = new runtime.wx.ListCtrl(host);
        const keys = ctrl._items.map(item => ctrl._getItemKey(item));
        ctrl.render();

        assert.equal(host.querySelectorAll("li").length, 2);
        assert.deepEqual(ctrl._items.map(item => ctrl._getItemKey(item)), keys);
        assert.ok(keys.every(key => typeof key === "string" && key.startsWith("i_")));
        if (crypto?.randomUUID) {
            assert.equal(keys[0], "i_test-uuid");
        } else {
            assert.notEqual(keys[0], keys[1]);
        }
        assert.equal(ctrl._getItemKey({ id: "explicit", _uid: "cached" }), "explicit");
        assert.equal(ctrl._getItemKey({ _uid: "cached" }), "cached");
        ctrl.destroy();
    });
}
