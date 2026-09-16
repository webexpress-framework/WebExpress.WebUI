/**
 * Headless tests for the box as an editor add-on (editor/addons/box.js): the
 * registration the picker and the property dialog read, the frame choice the
 * dialog offers as a list, and the way the choice persists on the add-on frame
 * so the reading view can hand it to BoxCtrl.
 *
 * The add-on reads BoxCtrl.LAYOUTS at registration time, so the control file is
 * loaded first - as the include list does.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

const CONTROL = "webexpress.webui.box.js";
const ADDON = "editor/addons/box.js";
const PLUGIN = "editor/addons.js";

test("the box registers as a container add-on with a frame choice and a label", () => {
    const r = loadEditor({ files: [CONTROL, ADDON] });
    const def = r.wx.EditorAddOns.get("box");

    assert.ok(def, "the add-on is registered");
    assert.equal(def.type, "block");
    assert.equal(def.isContainer, true, "the author types into it");
    assert.equal(def.contentClass, "wx-webui-box", "the reading view hands the block to the box controller");
    assert.equal(def.icon, "control-box");

    const layout = def.properties.find((p) => p.name === "layout");
    assert.equal(layout.type, "select", "the frame is a choice, not free text");
    assert.deepEqual(layout.options.map((o) => o.value), r.wx.BoxCtrl.LAYOUTS, "every frame the controller draws is offered");
    assert.equal(layout.default, r.wx.BoxCtrl.LAYOUTS[0], "and the default frame is the controller's default");

    const header = def.properties.find((p) => p.name === "header");
    assert.equal(header.type, "text");
});

test("the property dialog offers the frames as a list and persists the choice on the frame", () => {
    const r = loadEditor({ files: [CONTROL, PLUGIN, ADDON] });
    const plugin = r.plugins.get("addons");
    const def = r.wx.EditorAddOns.get("box");

    plugin._currentEditor = r.editor;
    plugin._activeAddonNode = null;
    plugin._openPropertyDialog(def, null);

    const select = plugin._propModal.querySelector("select[data-prop-name=\"layout\"]");
    assert.ok(select, "the frame is offered as a select");
    // the option list comes from the dom stub and the layout list from the vm realm, so both
    // are copied into one realm before they are compared
    assert.deepEqual(Array.from(select.querySelectorAll("option"), (o) => o.value), Array.from(r.wx.BoxCtrl.LAYOUTS));
    assert.equal(select.value, "solid", "the default frame is preselected");

    select.value = "dashed";
    plugin._propModal.querySelector("input[data-prop-name=\"header\"]").value = "Notes";
    plugin._handlePropertySave();

    const frame = r.root.querySelector(".wx-addon-frame[data-addon-id=\"box\"]");
    assert.ok(frame, "the box is inserted");
    assert.equal(frame.getAttribute("data-layout"), "dashed", "the chosen frame is on the frame element, where the editor preview and the reading view read it");
    assert.equal(frame.getAttribute("data-header"), "Notes");
    assert.ok(frame.querySelector(".wx-addon-body-container"), "the body is the author's to type into");
    assert.match(r.editor.value, /"layout":"dashed"/, "the choice is part of the persisted state");
});

test("reopening the dialog on an existing box shows the frame it has", () => {
    const r = loadEditor({ files: [CONTROL, PLUGIN, ADDON] });
    const plugin = r.plugins.get("addons");
    const M = r.wx.EditorModel;

    r.editor.dispatch({ type: "insertNodes", nodes: [M.node("addon", [M.node("p", [{ type: "text", text: "inside", marks: {} }])], { name: "box", container: true, data: { layout: "raised", header: "" } })] });

    const frame = r.root.querySelector(".wx-addon-frame[data-addon-id=\"box\"]");
    plugin._openSettingsForNode(r.editor, frame);

    assert.equal(plugin._propModal.querySelector("select[data-prop-name=\"layout\"]").value, "raised", "the dialog starts from the persisted frame, not from the default");
});
