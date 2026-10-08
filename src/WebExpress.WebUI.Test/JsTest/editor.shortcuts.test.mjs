import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

/**
 * Sends individual model input transactions so shortcut behavior matches typing.
 * @param {object} runtime - The editor runtime under test.
 * @param {string} text - The characters entered at the current caret.
 */
function type(runtime, text) {
    Object.getPrototypeOf(runtime.document.createRange()).getBoundingClientRect = () => ({ left: 0, top: 0, right: 1, bottom: 1, width: 1, height: 1 });
    Object.getPrototypeOf(runtime.document.body).getBoundingClientRect = () => ({ left: 0, top: 0, right: 1, bottom: 1, width: 1, height: 1 });
    for (const char of text) runtime.input("insertText", char);
}

test("single link and add-on triggers remain literal until a dialog confirms insertion", () => {
    const r = loadEditor({ html: "<p>prefix </p>", files: ["editor/media.js", "editor/addons.js", "editor/shortcut.js", "panels/webexpress.webui.panel.editor.link.js"],
        addons: { note: { type: "block", isContainer: true, content: "<p>Note</p>" } } });
    const media = r.editor._plugins.find(plugin => plugin.linkModal !== undefined);
    const addon = r.editor._addonPlugin;
    r.select(7);
    type(r, "[");
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>prefix [</p>");
    media.linkModal.ctrl.hide();
    type(r, " ");
    type(r, "{");
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>prefix [ {</p>");
    addon._selectionModal.ctrl.hide();
    type(r, " tail ");
    type(r, "{");
    addon._insertAddon(r.wx.EditorAddOns.get("note"), {});
    assert.equal(r.root.querySelectorAll("[data-addon-id]").length, 1);
    assert.equal(r.root.querySelector(".wx-addon-body-container").textContent, "Note");
    assert.equal(r.root.querySelector(".wx-addon-body-container").querySelector(".wx-editor-row"), null);
    assert.ok(r.editor.exportHtml({ layout: false }).startsWith("<p>prefix [ { tail </p>"));
    r.editor.execCommand("undo");
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>prefix [ { tail {</p>");
    r.select(8);
    media.openLink(r.editor, { anchor: 7, focus: 8, text: "" });
    media.linkModal.ctrl._link = { urlInput: { value: "https://example.test" }, textInput: { value: "Example" }, newTabInput: { checked: false } };
    r.panels.get("editor-link-page").onSubmit(media.linkModal.ctrl);
    assert.equal(r.root.querySelector("a").textContent, "Example");
    assert.ok(r.root.querySelector("p").textContent.startsWith("prefix Example { tail {"));
});

test("emoji queries insert Unicode and cancellation leaves the literal trigger intact", () => {
    const r = loadEditor({ html: "<p></p>", files: ["editor/emojis.js", "editor/shortcut.js"] });
    const shortcut = r.editor._plugins.find(plugin => plugin.onTransaction);
    r.select(0);
    type(r, ":wink");
    assert.ok(shortcut._inlineState.items.some(item => item.emoji === "😉"));
    r.key("Enter");
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>😉</p>");
    r.editor.execCommand("undo");
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>:wink</p>");
    r.editor.execCommand("redo");
    type(r, " :");
    r.key("Escape");
    assert.ok([...r.document.body.querySelectorAll(".wx-editor-shortcut-popup")].every(popup => popup.style.display === "none"));
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>😉 :</p>");
});

test("cancelling a property dialog preserves the trigger and restores the insertion caret", () => {
    const r = loadEditor({ html: "<p>before </p>", files: ["editor/addons.js", "editor/shortcut.js"],
        addons: { note: { type: "block", isContainer: true, content: "<p>Note</p>", properties: [{ name: "label", type: "text" }] } } });
    r.select(7);
    type(r, "{");
    const addon = r.editor._addonPlugin;
    addon._openPropertyDialog(r.wx.EditorAddOns.get("note"));
    r.select(0);
    addon._propModal.dispatchEvent({ type: "close" });
    assert.equal(r.editor.selection.focus, 8);
    type(r, " continued");
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>before { continued</p>");
});

test("emoticons replace only complete tokens and undo restores the entered characters", () => {
    const r = loadEditor({ html: "<p>prefix </p>", files: ["editor/emojis.js", "editor/shortcut.js"] });
    r.select(7);
    type(r, ":)");
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>prefix 🙂</p>");
    r.editor.execCommand("undo");
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>prefix :)</p>");
    r.editor.execCommand("redo");
    type(r, " ;-) <3 (/) (x) (!)");
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>prefix 🙂 😉 ❤️ ✅ ❌ ℹ️</p>");
});

test("trigger punctuation in code and addresses remains literal", () => {
    for (const html of ["<pre></pre>", "<p><code>x</code></p>", "<p>https:</p>"]) {
        const r = loadEditor({ html, files: ["editor/emojis.js", "editor/shortcut.js"] });
        const shortcut = r.editor._plugins.find(plugin => plugin.onTransaction);
        let opened = 0;
        shortcut._triggerLinkDialog = () => opened++;
        shortcut._triggerDateDialog = () => opened++;
        const prefix = r.root.querySelector("pre,p").textContent;
        r.select(prefix.length);
        type(r, "//[:)");
        assert.equal(opened, 0);
        assert.equal(shortcut._inlineState, null);
        assert.ok(r.root.querySelector("pre,p").textContent.endsWith("//[:)"));
    }
});

test("the second slash opens the date picker from the command palette at block start", () => {
    const r = loadEditor({ html: "<p></p>", files: ["editor/shortcut.js"] });
    const shortcut = r.editor._plugins.find(plugin => plugin.onTransaction);
    r.select(0);
    type(r, "/");
    shortcut._searchInput.dispatchEvent({ type: "keydown", key: "/", preventDefault() {} });
    assert.ok(shortcut._datePopup);
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>//</p>");
    shortcut._closeDatePopup();
    type(r, " //");
    shortcut._commitDate(r.editor, "30.09.2026", "DD.MM.YYYY");
    assert.match(r.editor.exportHtml({ layout: false }), /^<p>\/\/ <span[^>]+/);
    assert.equal(r.root.querySelector("p").textContent, "// 30.09.2026");
    r.editor.execCommand("undo");
    assert.equal(r.root.querySelector("p").textContent, "// //");
});

test("mention queries keep the configured endpoint and insert the selected atom", async () => {
    const r = loadEditor({ html: "<p></p>", files: ["editor/shortcut.js"] });
    r.host.dataset.mentionUri = "/mentions";
    const requests = [];
    r.sandbox.webexpress.webapp = { ServiceRegistry: { request: url => {
        requests.push(url);
        return Promise.resolve({ ok: true, data: [{ id: "42", label: "Ada" }] });
    } } };
    r.select(0);
    type(r, "@Ada");
    r.flush();
    await Promise.resolve();
    assert.deepEqual(requests, ["/mentions?q=Ada"]);
    assert.match(r.document.body.querySelector(".wx-editor-shortcut-popup").textContent, /Ada/);
    r.key("Enter");
    assert.match(r.editor.exportHtml(), /class="wx-mention">@Ada<\/span>/);
    assert.match(r.editor.value, /"value":"42"/);
});

test("rapid double slashes dismiss the command palette without stealing date focus", () => {
    const r = loadEditor({ html: "<p></p>", files: ["editor/shortcut.js"] });
    const shortcut = r.editor._plugins.find(plugin => plugin.onTransaction);
    let opened = 0;
    shortcut._triggerDateDialog = () => opened++;
    r.select(0);
    type(r, "//");
    r.flush();
    assert.equal(opened, 1);
    assert.equal(shortcut._popup.style.display, "none");
    assert.notEqual(r.document.activeElement, shortcut._searchInput);
});
