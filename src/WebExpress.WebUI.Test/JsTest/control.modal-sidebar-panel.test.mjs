/**
 * Headless contract test for the ModalSidebarPanelCtrl control (wx-webui-modal-sidebar-panel).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { contract } from "./controls.contract.mjs";
import { loadWebUi } from "./harness.mjs";

contract({
    file: "webexpress.webui.modal.sidebar.panel.js",
    selector: "wx-webui-modal-sidebar-panel",
    ctrl: "ModalSidebarPanelCtrl",
    deps: ["webexpress.webui.modal.js"]
});

test("a page another module registers under a dialog key is shown, validated and submitted on its own", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.modal.js", "webexpress.webui.modal.sidebar.panel.js"] });
    // in a browser the namespace is a property of window, which the control reads the registry from
    rt.sandbox.window.webexpress = rt.sandbox.webexpress;
    const calls = [];
    const page = (id, result) => ({
        id, title: id,
        render() {},
        validate() { calls.push(id + ".validate"); return result; },
        onSubmit() { calls.push(id + ".submit"); }
    });
    // the editor registers its own page first; a plugin adds one later under the same key
    rt.wx.DialogPanels.register("editor-image", page("image-web", { valid: false, message: "empty" }));
    rt.wx.DialogPanels.register("editor-image", page("library", true));

    const dialog = rt.createElement("dialog");
    dialog.id = "media";
    dialog.setAttribute("data-key", "editor-image");
    dialog.setAttribute("data-validate-active-only", "true");
    rt.document.body.appendChild(dialog);
    const ctrl = new rt.wx.ModalSidebarPanelCtrl(dialog);

    ctrl.show();
    ctrl.selectPage("library");
    ctrl.submit();
    assert.deepEqual(calls, ["library.validate", "library.submit"], "the other page neither blocks nor submits");
    assert.equal(dialog.open, false);
});

test("a page names its icon and the sidebar resolves it into the classes the tree draws", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.modal.js", "webexpress.webui.modal.sidebar.panel.js"] });
    const dialog = rt.createElement("dialog");
    rt.document.body.appendChild(dialog);
    const ctrl = new rt.wx.ModalSidebarPanelCtrl(dialog);
    ctrl.addPage({ id: "a", title: "A", iconClass: "link", render() {} });
    ctrl.addPage({ id: "b", title: "B", iconClass: rt.wx.IconSet.resolve("sitemap"), render() {} });
    // copied out of the control's realm, so the comparison sees plain strings
    const icons = Array.from(ctrl._treeModel, node => node.iconOpen);
    assert.deepEqual(icons, [rt.wx.IconSet.resolve("link"), rt.wx.IconSet.resolve("sitemap")]);
    assert.match(icons[0], /wx-icon-light-link/);
});
