/**
 * Headless contract test for the SmartEditCtrl control (wx-webui-smart-edit).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * The edit affordance is covered on top of it: the control builds the icon in
 * JavaScript, so nothing on the server supplies the class. A name the icon set
 * does not know is not an error - it is an element with a class no rule defines,
 * and therefore an empty box where the affordance should be.
 */
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contract } from "./controls.contract.mjs";
import { loadWebUi, childListMutation } from "./harness.mjs";

const iconCss = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..", "..", "WebExpress.WebUI", "Assets", "css", "webexpress.webui.icon.css"
);

contract({
    file: "webexpress.webui.smartedit.js",
    selector: "wx-webui-smart-edit",
    ctrl: "SmartEditCtrl"
});

/**
 * Builds a smart edit control over a plain value and reveals its edit icon.
 * @returns {object} The host element with the affordance in place.
 */
function hover() {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.smartedit.js"] });

    const host = rt.document.createElement("div");
    const value = rt.document.createElement("span");
    value.textContent = "a value";
    host.appendChild(value);
    rt.document.body.appendChild(host);

    const ctrl = new rt.wx.SmartEditCtrl(host);
    ctrl._showEditIcon(host);

    return host;
}

test("the edit affordance is drawn as a pen, the way every other inline edit is", () => {
    const icon = hover().querySelectorAll("button i")[0];

    assert.ok(icon, "hovering reveals the edit affordance");
    assert.equal(
        icon.className,
        "wx-icon-light wx-icon-light-pen",
        "the dashboard, kanban, sidebar and graph editor all resolve \"pen\" for this"
    );
});

test("the affordance keeps the class other modules style and test against", () => {
    const button = hover().querySelectorAll("button")[0];

    // WebExpress.WebApp positions this button through ".wx-smart-edit .pencil"
    // in its file view and form editor, so the historic name is a dom contract
    assert.ok(button.classList.contains("pencil"), "the button carries the pencil class");
});

test("the read view survives repeated edit cycles", () => {
    const rt = loadWebUi({
        browser: true,
        extraFiles: [
            "webexpress.webui.editor.js",
            "webexpress.webui.content.js",
            "webexpress.webui.smartedit.js"
        ]
    });

    const host = rt.document.createElement("div");
    host.classList.add("wx-webui-smart-edit");
    const editor = rt.document.createElement("div");
    editor.classList.add("wx-webui-editor");
    editor.setAttribute("value", "<p>first</p>");
    host.appendChild(editor);
    rt.document.body.appendChild(host);

    rt.wx.Controller.createInstances(host);
    const ctrl = rt.wx.Controller.getInstanceByElement(host);

    // an edit parks the editor in a form and empties the host again when it ends.
    // the mutation batch that follows used to destroy the editor instance, and the
    // read view then fell through to the plain text branch - which shows the stored
    // markup as characters instead of as the document it describes
    for (const round of ["second", "third"]) {
        ctrl._startEditing(host);
        // while editing, the host holds the form the editor was parked in; that
        // form is what the observer reports as removed once the edit ends
        const form = host.firstElementChild;
        ctrl._finishEditing(true, host, `<p>${round}</p>`);
        rt.wx.Controller.handleMutations([childListMutation({ removed: [form] })]);

        assert.ok(
            rt.wx.Controller.getInstanceByElement(ctrl._editor),
            `the editor the control holds survives the ${round} cycle`
        );
    }

    ctrl._startEditing(host);
    ctrl._finishEditing(true, host, "<p>fourth</p>");
    assert.ok(
        host.querySelectorAll(".wx-content")[0],
        "the read view is still the converted document, not escaped markup"
    );
});

test("the class the affordance asks for is defined in the icon stylesheet", () => {
    const css = fs.readFileSync(iconCss, "utf8");
    const defined = new Set(
        [...css.matchAll(/\.(wx-icon-light-[a-z0-9-]+)\s*\{/g)].map((match) => match[1])
    );
    assert.ok(defined.size > 100, "the stylesheet was read and holds the icon set");

    for (const name of String(hover().querySelectorAll("button i")[0].className).split(/\s+/)) {
        if (name.startsWith("wx-icon-light-")) {
            assert.ok(defined.has(name), `${name} is asked for but no rule defines it`);
        }
    }
});
