/**
 * Headless contract test for the TreeCtrl control (wx-webui-tree).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.tree.js",
    selector: "wx-webui-tree",
    ctrl: "TreeCtrl"
});

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

test("the leaf marker is a drawing of the icon set, like the branch angle", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tree.js"] });
    const host = rt.document.createElement("div");
    const leaf = rt.document.createElement("div");
    leaf.classList.add("wx-tree-node");
    leaf.dataset.label = "Leaf";
    host.appendChild(leaf);
    rt.document.body.appendChild(host);

    new rt.wx.TreeCtrl(host);

    const marker = host.querySelector(".wx-tree-indicator-dot");
    assert.ok(marker, "a leaf carries a marker");
    assert.equal(marker.className, "wx-tree-indicator-dot " + rt.wx.IconSet.resolve("dot"), "the marker resolves through the set rather than painting its own glyph");
});

test("an item the arrow keys move to is focused and scrolled into view, the nearest way", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tree.js"] });
    const host = rt.document.createElement("div");
    for (const label of ["One", "Two"]) {
        const node = rt.document.createElement("div");
        node.classList.add("wx-tree-node");
        node.dataset.label = label;
        host.appendChild(node);
    }
    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.TreeCtrl(host);
    const items = host.querySelectorAll("[role=\"treeitem\"]");
    const scrolled = [];
    for (const item of items) {
        item.scrollIntoView = (options) => scrolled.push([item.textContent, options.block]);
    }

    ctrl._onKeyDown({ key: "ArrowDown", target: items[0], defaultPrevented: false, preventDefault() { } });

    assert.deepEqual(scrolled, [["Two", "nearest"]]);
});
