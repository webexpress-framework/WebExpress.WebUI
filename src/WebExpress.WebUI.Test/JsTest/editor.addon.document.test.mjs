import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

const ADDON = "editor/addons/document.js";

test("document add-ons serialize and retain safe text in editor and reading views", () => {
    const rt = loadEditor({ files: [ADDON, "webexpress.webui.content.js"] });
    const M = rt.wx.EditorModel;
    rt.editor.dispatch({ type: "insertNodes", nodes: [
        M.node("addon", [M.node("p", [{ type: "text", text: "notice body", marks: {} }])], { name: "callout", container: true, data: { tone: "warning", title: "Notice <&>" } }),
        M.node("p", [M.node("addon", [], { name: "status", inline: true, container: false, data: { text: "<script>caption</script>", tone: "success" } })]),
        M.node("addon", [], { name: "toc", container: false, data: {} })
    ] });
    assert.match(rt.editor.value, /"name":"callout"/);
    assert.match(rt.editor.value, /"name":"status"/);
    assert.match(rt.editor.value, /"name":"toc"/);
    const content = rt.wx.ContentFormat.toFragment(rt.editor.value);
    assert.equal(content.querySelector("script"), null);
    assert.match(content.textContent, /notice body/);
    assert.match(content.textContent, /<script>caption<\/script>/);
    const notice = content.querySelector(".wx-editor-callout");
    assert.equal(notice.getAttribute("data-tone"), "warning");
    assert.equal(notice.getAttribute("data-title"), "Notice <&>");
    assert.ok(content.querySelector(".wx-webui-document-toc"));
    const status = rt.wx.EditorAddOns.get("status");
    assert.equal(status.properties.find(p => p.name === "text").type, "text");
});

test("contents use document headings and reading anchors without changing editor heading ids", () => {
    const rt = loadEditor({ files: [ADDON, "webexpress.webui.content.js"] });
    const M = rt.wx.EditorModel;
    rt.editor.dispatch({ type: "insertNodes", nodes: [
        M.node("h2", [{ type: "text", text: "Heading one", marks: {} }]),
        M.node("addon", [M.node("addon", [], { name: "toc", container: false, data: {} })], { name: "callout", container: true, data: {} })
    ] });
    rt.document.getElementById = id => rt.document.querySelector(`[id="${id}"]`);
    const editorNav = rt.root.querySelector(".wx-webui-document-toc");
    const editorToc = new rt.wx.DocumentTocCtrl(editorNav);
    rt.flush();
    assert.match(editorNav.textContent, /Heading one/);
    assert.equal(editorNav.querySelector("a"), null);
    assert.equal(rt.root.querySelector("h2").id || "", "");
    const reading = rt.document.createElement("div");
    reading.className = "wx-content";
    reading.appendChild(rt.wx.ContentFormat.toFragment(rt.editor.value));
    rt.document.body.appendChild(reading);
    const readingNav = reading.querySelector(".wx-webui-document-toc");
    const readingToc = new rt.wx.DocumentTocCtrl(readingNav);
    rt.flush();
    assert.ok(readingNav.querySelector("a").getAttribute("href").startsWith("#wx-heading-"));
    assert.ok(reading.querySelector("h2").id);
    editorToc.destroy();
    readingToc.destroy();
});
