import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadEditor } from "./editor.runtime.mjs";

/**
 * Invokes a palette action without replacing the saved editor selection.
 * @param {HTMLElement} button - The palette action under test.
 */
function click(button) {
    button.dispatchEvent({ type: "click", target: button, button: 0, preventDefault() {}, stopPropagation() {} });
}

test("color dropdowns preserve selected text and remove only the selected color mark", () => {
    const r = loadEditor({ html: '<p><strong><span style="color:#ff0000;background-color:#ffff00">alpha</span></strong></p>', files: ["editor/formatting.js"] });
    r.select(5, 0);
    const toggle = r.host.querySelector('[data-color-command="hiliteColor"]');
    assert.ok(toggle.classList.contains("dropdown-toggle"));
    assert.equal(toggle.parentNode.querySelectorAll(".wx-editor-btn").length, 1);
    const menu = toggle.parentNode.querySelector("[popover]");
    menu.hidePopover = () => {};
    click(menu.querySelector(".dropdown-item"));
    assert.deepEqual({ ...r.editor.selection }, { anchor: 0, focus: 5 });
    assert.doesNotMatch(r.editor.exportHtml(), /background-color/);
    assert.match(r.editor.exportHtml(), /color: #ff0000/);
    assert.match(r.editor.exportHtml(), /<strong>/);
    assert.equal(toggle.dataset.color, "transparent");
    r.editor.execCommand("undo");
    assert.match(r.editor.exportHtml(), /background-color: #ffff00/);
    assert.equal(toggle.dataset.color, "#ffff00");
    r.editor.execCommand("redo");
    assert.equal(toggle.dataset.color, "transparent");
});

test("palette colors and cursor movement update an unmasked indicator in each editor", () => {
    const r = loadEditor({ html: "<p>alpha plain</p>", files: ["editor/formatting.js"] });
    const toggle = r.host.querySelector('[data-color-command="foreColor"]');
    const menu = toggle.parentNode.querySelector("[popover]");
    menu.hidePopover = () => {};
    r.select(0, 5);
    click(menu.querySelector('[aria-label="#FF0000"]'));
    assert.equal(toggle.dataset.color, "#FF0000");
    const indicator = toggle.querySelector(".wx-color-preview-box");
    assert.equal(indicator.parentNode.querySelector("i").className, "font");
    assert.equal(indicator.style.backgroundColor, "#FF0000");
    assert.match(r.editor.exportHtml(), /color: #FF0000/);
    r.select(10);
    r.root.dispatchEvent({ type: "keyup" });
    assert.equal(toggle.dataset.color, "currentColor");
    r.select(3);
    r.root.dispatchEvent({ type: "keyup" });
    assert.equal(toggle.dataset.color, "#FF0000");
    click(menu.querySelector(".dropdown-item"));
    r.input("insertText", "X");
    assert.match(r.editor.exportHtml(), /<\/span>X<span/);
});

test("table frames expose a toolbar and all formatting and bubble icons use shipped light drawings", () => {
    const r = loadEditor({ html: '<table><tbody><tr><td>alpha</td></tr></tbody></table>', files: ["editor/formatting.js", "editor/table.js", "editor/bubble.js"] });
    assert.equal(r.root.querySelector(".wx-editor-table-options"), null);
    assert.ok(r.root.querySelector(".wx-editor-table-toolbar"));
    const bubble = r.editor._plugins.find(plugin => plugin._makeBtn);
    bubble._rebuild(r.editor, { hasSelection: true, hasContext: false });
    const css = fs.readFileSync(new URL("../../WebExpress.WebUI/Assets/css/webexpress.webui.icon.css", import.meta.url), "utf8");
    for (const icon of [...r.host.querySelectorAll("i"), ...bubble._bubbleEl.querySelectorAll("i")]) {
        const name = icon.className.split(" ")[0];
        assert.ok(css.includes(".wx-icon-light-" + name + " {"), name + " has a light mask rule");
        assert.ok(fs.existsSync(new URL("../../WebExpress.WebUI/Assets/icons/" + name + ".svg", import.meta.url)), name + " has a drawing");
    }
    const editorCss = fs.readFileSync(new URL("../../WebExpress.WebUI/Assets/css/webexpress.webui.editor.css", import.meta.url), "utf8");
    assert.doesNotMatch(editorCss, /mask-image|data:image|\.wx-icon-light-/);
});

test("table toolbar follows cell selection, merge and split without exposing a cell context menu", () => {
    const r = loadEditor({ html: '<p>outside</p><table><tbody><tr><td>alpha</td><td>beta</td></tr><tr><td>gamma</td><td>delta</td></tr></tbody></table>', files: ["editor/table.js", "editor/bubble.js"] });
    const table = r.editor._plugins.find(plugin => plugin._selectCellRectangle);
    const button = command => r.root.querySelector('[data-table-command="' + command + '"]');
    assert.equal(button("insertRowAbove").disabled, true);
    assert.equal(button("deleteTable"), null);
    assert.equal(r.root.querySelector('[data-frame-command="delete"]').disabled, false);
    let cells = r.root.querySelectorAll("td");
    table._selectCellRectangle(r.editor, cells[0], cells[0]);
    assert.equal(button("insertRowAbove").disabled, false);
    assert.equal(button("mergeCells").disabled, true);
    assert.equal(button("splitCell").disabled, true);
    table._selectCellRectangle(r.editor, cells[0], cells[1]);
    assert.equal(button("mergeCells").disabled, false);
    click(button("mergeCells"));
    cells = r.root.querySelectorAll("td");
    assert.equal(cells.length, 3);
    assert.equal(cells[0].colSpan, 2);
    assert.equal(button("mergeCells").disabled, true);
    assert.equal(button("splitCell").disabled, false);
    click(button("splitCell"));
    assert.equal(r.root.querySelectorAll("td").length, 4);
    assert.equal(button("splitCell").disabled, true);
    const bubble = r.editor._plugins.find(plugin => plugin._contextElement);
    assert.equal(bubble._contextElement(r.editor, r.root.querySelector("td p")), null);
    r.select(0);
    r.document.dispatchEvent({ type: "selectionchange" });
    assert.equal(button("insertRowAbove").disabled, true);
    assert.doesNotMatch(r.editor.exportHtml(), /data-table-command|wx-color-input|wx-editor-table-toolbar/);
});

test("table color inputs clear mixed cells and preserve selection and undo history", () => {
    const r = loadEditor({ html: '<table><tbody><tr><td style="background-color:#ff0000">alpha</td><td style="background-color:#0000ff">beta</td></tr></tbody></table><table><tbody><tr><td>other</td></tr></tbody></table>', files: ["editor/table.js"] });
    const table = r.editor._plugins.find(plugin => plugin._selectCellRectangle);
    const cells = r.root.querySelectorAll("td");
    const backgrounds = () => Array.from(r.root.querySelectorAll("td"), cell => cell.style.backgroundColor || "");
    table._selectCellRectangle(r.editor, cells[0], cells[1]);
    const controls = Array.from(table._colorControls.values());
    assert.ok(controls.every(control => control instanceof r.wx.InputColorCtrl));
    assert.equal(controls[0].value, "");
    assert.equal(controls[0].disabled, false);
    assert.equal(controls[1].disabled, true);
    const menu = controls[0]._dropdownmenu;
    menu.hidePopover = () => {};
    click(menu.querySelector(".wx-color-clear"));
    assert.deepEqual(backgrounds(), ["", "", ""]);
    assert.equal(table._getSelectedCells(r.editor).length, 2);
    r.editor.execCommand("undo");
    assert.deepEqual(backgrounds(), ["#ff0000", "#0000ff", ""]);
    const current = Array.from(table._colorControls.values())[0];
    current._dropdownmenu.hidePopover = () => {};
    click(current._dropdownmenu.querySelector('[aria-label="#008000"]'));
    assert.deepEqual(backgrounds(), ["#008000", "#008000", ""]);
    assert.equal(Array.from(table._colorControls.values())[0].value, "#008000");
});

test("color input supports silent previews, optional removal and synchronized disabled state", () => {
    const r = loadEditor();
    const host = r.document.createElement("div");
    host.dataset.allowEmpty = "true";
    host.dataset.compact = "true";
    host.dataset.icon = "font";
    host.setAttribute("aria-label", "Text color");
    r.document.body.appendChild(host);
    const control = new r.wx.InputColorCtrl(host);
    const changed = [];
    host.addEventListener(r.wx.Event.CHANGE_VALUE_EVENT, event => changed.push(event.detail.value));
    assert.equal(control.value, "");
    control.setValue("#abc", false);
    assert.equal(control._nativePicker.value, "#aabbcc");
    assert.equal(control._trigger.getAttribute("aria-label"), "Text color");
    assert.equal(control._trigger.hasAttribute("aria-labelledby"), false);
    assert.deepEqual(changed, []);
    assert.equal(control.setValue("rgb(12, 34, 56)", false), true);
    assert.equal(control.value, "#0c2238");
    assert.equal(control._nativePicker.value, "#0c2238");
    assert.deepEqual(changed, []);
    control.value = "#123456";
    assert.deepEqual(changed, ["#123456"]);
    control.value = "invalid";
    assert.equal(control.value, "#123456");
    control._dropdownmenu.hidePopover = () => {};
    click(host.querySelector(".wx-color-clear"));
    assert.equal(control.value, "");
    assert.equal(control._hidden.value, "");
    control.disabled = true;
    assert.ok(Array.from(host.querySelectorAll("button,input")).every(input => input.disabled));
    control.disabled = false;
    assert.ok(Array.from(host.querySelectorAll("button,input")).every(input => !input.disabled));
    const normal = r.document.createElement("div");
    const required = new r.wx.InputColorCtrl(normal);
    required.value = "";
    assert.equal(required.value, "#000000");
    assert.equal(normal.querySelector(".wx-color-clear"), null);
    control.destroy();
    required.destroy();
});

test("highlight removal accepts imported non-hex colors even when the shared picker value is empty", () => {
    const r = loadEditor({ html: '<p><span style="background-color:yellow">alpha</span></p>', files: ["editor/formatting.js"] });
    r.select(0, 5);
    const toggle = r.host.querySelector('[data-color-command="hiliteColor"]');
    r.root.dispatchEvent({ type: "keyup" });
    const menu = toggle.parentNode.querySelector("[popover]");
    menu.hidePopover = () => {};
    click(menu.querySelector(".wx-color-clear"));
    assert.doesNotMatch(r.editor.exportHtml(), /background-color/);
});

test("the field label names the editing surface, which a label on the host div cannot reach", () => {
    const r = loadEditor({ label: "Wysiwyg:" });
    assert.equal(r.host.id, "field", "the host keeps its id for instance lookups");
    assert.equal(r.root.getAttribute("aria-labelledby"), r.label.id);
});

test("the emoji search carries an id but no name, so autofill can address it without it being posted", () => {
    const r = loadEditor({ label: "Wysiwyg:", files: ["editor/emojis.js"] });
    const search = r.host.querySelector(".wx-emoji-search");
    assert.equal(search.id, "field-emoji-search");
    assert.equal(search.hasAttribute("name"), false);
});
