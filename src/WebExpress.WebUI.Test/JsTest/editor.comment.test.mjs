import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

const files = ["editor/comment.js", "webexpress.webui.content.js"];

/**
 * Reads annotations independently of formatting wrappers and editor chrome.
 * @param {object} runtime - The editor test runtime.
 * @returns {Array<object>} The annotated text entries in document order.
 */
function comments(runtime) {
    return runtime.wx.EditorModel.entries(runtime.editor._state.doc).filter(entry => entry.node.type === "text" && entry.node.marks.comment);
}

/**
 * Opens the actual plugin dialog with a model-backed selection.
 * @param {object} runtime - The editor test runtime.
 * @param {number} anchor - The selection anchor.
 * @param {number} focus - The selection focus.
 * @returns {object} The editor-owned comment plugin.
 */
function open(runtime, anchor, focus) {
    runtime.select(anchor, focus);
    const plugin = runtime.editor._plugins.find(plugin => plugin.openComment);
    plugin.openComment(runtime.editor);
    return plugin;
}

test("a backward selection across formatting retains its text and selection after commenting", () => {
    const r = loadEditor({ files, html: "<p>Before <strong>bold</strong> after</p>" });
    const plugin = open(r, 14, 7);
    plugin._input.value = "Check wording";
    plugin._commit(false);
    assert.equal(comments(r).map(entry => entry.node.text).join(""), "bold af");
    assert.equal(new Set(comments(r).map(entry => entry.node.marks.comment.id)).size, 1);
    assert.equal(r.root.querySelector("strong").textContent, "bold");
    assert.deepEqual({ ...r.editor.selection }, { anchor: 14, focus: 7 });
    const reading = r.wx.ContentFormat.toFragment(r.editor.value);
    assert.equal(reading.querySelectorAll(".wx-editor-comment").length, 1);
    assert.equal(reading.querySelector("strong").textContent, "bold");
    const saved = r.editor.value;
    r.editor.execCommand("undo");
    assert.equal(comments(r).length, 0);
    r.editor.execCommand("redo");
    assert.equal(r.editor.value, saved);
    r.editor.value = saved;
    assert.equal(comments(r)[0].node.marks.comment.text, "Check wording");
});

test("editing or removing a comment updates all its text runs without deleting text", () => {
    const r = loadEditor({ files, html: "<p>One <em>two</em></p><p>Three</p>" });
    let plugin = open(r, 0, 13);
    plugin._input.value = "First";
    plugin._commit(false);
    const id = comments(r)[0].node.marks.comment.id;
    plugin.openComment(r.editor, id);
    assert.equal(plugin._input.value, "First");
    plugin._input.value = "Updated";
    plugin._commit(false);
    assert.ok(comments(r).every(entry => entry.node.marks.comment.text === "Updated"));
    plugin.openComment(r.editor, id);
    plugin._commit(true);
    assert.equal(comments(r).length, 0);
    assert.equal(r.root.querySelector("em").textContent, "two");
    r.editor.execCommand("undo");
    assert.ok(comments(r).every(entry => entry.node.marks.comment.text === "Updated"));
});

test("typing within a comment extends it while typing on either edge does not", () => {
    for (const [position, expected] of [[1, "lph"], [2, "lXph"], [4, "lph"]]) {
        const r = loadEditor({ files });
        r.editor.dispatch({ type: "comment", text: "Note", selection: { anchor: 1, focus: 4 } });
        r.select(position);
        r.input("insertText", "X");
        assert.equal(comments(r).map(entry => entry.node.text).join(""), expected);
    }
});

test("format clearing and the format painter do not remove or copy annotations", () => {
    const r = loadEditor({ files, html: "<p>alpha beta</p>" });
    r.editor.dispatch({ type: "comment", text: "Note", selection: { anchor: 0, focus: 5 } });
    r.editor.execCommand("bold");
    r.editor.execCommand("removeformat");
    assert.equal(comments(r).map(entry => entry.node.text).join(""), "alpha");
    r.editor.execCommand("formatpainter");
    assert.equal(r.editor._paintMarks.comment, undefined);
    r.select(0, 5);
    r.input("deleteContentForward");
    assert.equal(comments(r).length, 0);
    r.editor.execCommand("undo");
    assert.equal(comments(r).map(entry => entry.node.text).join(""), "alpha");
});

test("comment HTML round trips preserve metadata and clipboard copies receive independent identities", () => {
    const r = loadEditor({ files });
    const message = '<script>alert("x")</script> & ü';
    r.editor.dispatch({ type: "comment", text: message, selection: { anchor: 1, focus: 4 } });
    const id = comments(r)[0].node.marks.comment.id;
    const html = r.editor.exportHtml();
    r.editor.value = html;
    assert.equal(comments(r)[0].node.marks.comment.id, id);
    assert.equal(comments(r)[0].node.marks.comment.text, message);
    const imported = r.wx.EditorHtml.read(html, { clipboard: true });
    const copied = r.wx.EditorModel.entries(imported.state.doc).find(entry => entry.node.marks?.comment);
    assert.notEqual(copied.node.marks.comment.id, id);
    assert.equal(copied.node.marks.comment.text, message);
    const reading = r.wx.ContentFormat.toFragment(r.editor.value);
    const span = reading.querySelector(".wx-editor-comment");
    assert.equal(span.getAttribute("tabindex"), "0");
    assert.equal(span.getAttribute("data-wx-trigger"), "hover focus");
    assert.equal(span.getAttribute("data-wx-content"), message);
    assert.equal(span.classList.contains("wx-webui-popover"), true);
    assert.equal(reading.querySelector("script"), null);
    assert.equal(reading.textContent, "alpha");
});

test("empty selections, empty comments and overlapping selections leave the document unchanged", () => {
    const r = loadEditor({ files });
    const initial = r.editor.value;
    let plugin = open(r, 2, 2);
    assert.equal(plugin._input.disabled, true);
    plugin._commit(false);
    assert.equal(r.editor.value, initial);
    plugin = open(r, 1, 4);
    plugin._input.value = "   ";
    plugin._commit(false);
    assert.equal(r.editor.value, initial);
    plugin._input.value = "Existing";
    plugin._commit(false);
    const saved = r.editor.value;
    plugin = open(r, 0, 3);
    assert.equal(plugin._input.disabled, true);
    assert.match(plugin._hint.textContent, /overlap/);
    r.editor.dispatch({ type: "comment", text: "Replacement" });
    assert.equal(r.editor.value, saved);
});

test("cancellation and stale dialogs cannot attach comments to another document", () => {
    const r = loadEditor({ files });
    const original = r.editor.value;
    const plugin = open(r, 4, 1);
    plugin._input.value = "Unsaved";
    plugin._dialog.dispatchEvent({ type: "close" });
    assert.equal(r.editor.value, original);
    assert.deepEqual({ ...r.editor.selection }, { anchor: 4, focus: 1 });
    r.editor.value = "<p>Replacement</p>";
    plugin._commit(false);
    assert.equal(comments(r).length, 0);
    r.editor.disabled = true;
    r.editor.dispatch({ type: "comment", text: "Disabled", selection: { anchor: 0, focus: 3 } });
    assert.equal(comments(r).length, 0);
    r.editor.destroy();
    assert.equal(r.document.body.contains(plugin._dialog), false);
});

test("invalid comment marks are discarded at the document boundary", () => {
    const r = loadEditor({ files });
    const M = r.wx.EditorModel;
    for (const comment of [{ id: '<bad>', text: 'text' }, { id: 'valid', text: {} }, { id: 'valid', text: '  ' }]) {
        assert.equal(M.marks({ comment }).comment, undefined);
    }
    assert.equal(M.marks({ comment: { id: 'valid', text: 'x'.repeat(11000) } }).comment.text.length, 10000);
});


test("comments expose no main toolbar button and share the modal footer conventions", () => {
    const r = loadEditor({ files });
    const plugin = open(r, 0, 5);
    assert.equal(plugin.createToolbar, undefined);
    assert.equal(plugin._dialog.querySelector("h2"), null);
    assert.equal(plugin._dialog.querySelectorAll("button").length, 2);
    assert.equal(plugin._remove.classList.contains("me-auto"), true);
    assert.equal(plugin._remove.parentElement.classList.contains("flex-grow-1"), true);
    assert.equal(plugin._remove.parentElement.classList.contains("d-flex"), true);
    assert.ok(plugin._remove.querySelector("i"));
    assert.equal(plugin._remove.textContent, "webexpress.webui:editor.comment.remove");
});

/**
 * Builds the reading control with its shipped annotation adapter and optional permission.
 * @param {boolean} allowed - Whether the reading surface may annotate existing text.
 * @returns {object} The runtime, content host and controller.
 */
function reading(allowed) {
    const r = loadEditor({ files: [...files, "webexpress.webui.content.comments.js"] });
    r.wx.Controller.createInstances = () => {};
    const host = r.document.createElement("div");
    host.innerHTML = "<p>Before <strong>existing</strong> text</p>";
    if (allowed) host.setAttribute("data-allow-comments", "true");
    r.document.body.appendChild(host);
    return { r, host, content: new r.wx.ContentCtrl(host) };
}

test("ContentCtrl comments are opt-in and never create editable text or a form input", () => {
    const disabled = reading(false);
    assert.equal(disabled.content._comments, undefined);
    const { host, content } = reading(true);
    assert.ok(content._comments);
    assert.equal(host.querySelector("[contenteditable]"), null);
    assert.equal(host.querySelector("input"), null);
    assert.equal(content._comments.dispatch({ type: "insertText", text: "replacement" }), false);
    assert.equal(content.text, "Before existing text");
});

test("ContentCtrl comment actions emit persisted JSON and retain the original text and formatting", () => {
    const { r, host, content } = reading(true);
    host.setAttribute("data-delete-comments", "true");
    const updates = [];
    host.addEventListener(r.wx.Event.CHANGE_VALUE_EVENT, event => updates.push(event.detail.value));
    const session = content._comments;
    session.selection = { anchor: 18, focus: 7 };
    session._plugin.openComment(session);
    session._plugin._input.value = "Review";
    session._plugin._commit(false);
    assert.equal(updates.length, 1);
    assert.equal(updates[0].version, 1);
    assert.equal(host.querySelector("strong").textContent, "existing");
    assert.equal(content.text, "Before existing text");
    assert.equal(host.querySelectorAll(".wx-editor-comment").length, 1);
    assert.deepEqual({ ...session.selection }, { anchor: 18, focus: 7 });
    const saved = content.value;
    const id = host.querySelector(".wx-editor-comment").getAttribute("data-comment-id");
    session._plugin.openComment(session, id);
    session._plugin._input.value = "Updated";
    session._plugin._commit(false);
    assert.equal(host.querySelector(".wx-editor-comment").getAttribute("data-comment-text"), "Updated");
    session._plugin.openComment(session, id);
    session._plugin._commit(true);
    assert.equal(host.querySelector(".wx-editor-comment"), null);
    assert.equal(updates.length, 3);
    content.value = saved;
    assert.equal(host.querySelector(".wx-editor-comment").getAttribute("data-comment-text"), "Review");
    const popup = r.document.createElement("div");
    popup.className = "wx-popover";
    popup.textContent = "Comment Review";
    host.appendChild(popup);
    assert.equal(content.text, "Before existing text");
    content.destroy();
    assert.equal(r.document.body.contains(session._bubble), false);
    assert.equal(r.document.body.contains(session._plugin._dialog), false);
    assert.equal(session.dispatch({ type: "comment", text: "After destruction" }), false);
});

for (const mode of ["editor", "content"]) {
    test(`${mode} applies the deletion permission only to the reading surface`, () => {
        const r = mode === "editor" ? loadEditor({ files }) : null;
        const readingControl = mode === "content" ? reading(true) : null;
        const editor = r?.editor || readingControl.content._comments;
        const host = r?.editor._uiContainer || readingControl.host;
        const plugin = r?.editor._plugins.find(item => item.openComment) || editor._plugin;
        editor.dispatch({ type: "comment", text: "Review", selection: { anchor: 0, focus: 3 } });
        const target = host.querySelector(".wx-editor-comment");
        const id = target.getAttribute("data-comment-id");
        for (const permission of [null, "false", "invalid", "true"]) {
            if (permission === null) host.removeAttribute("data-delete-comments");
            else host.setAttribute("data-delete-comments", permission);
            plugin.openComment(editor, id);
            const canDelete = mode === "editor" || permission === "true";
            assert.equal(plugin._remove.hidden, !canDelete);
            const items = plugin.getContextMenuItems(editor, host.querySelector(".wx-editor-comment"));
            assert.equal(items.some(item => item.icon === "trash"), canDelete);
            if (!canDelete) {
                const before = JSON.stringify(editor._state.doc);
                plugin._commit(true);
                assert.equal(editor.dispatch({ type: "comment", id, remove: true }), false);
                assert.equal(JSON.stringify(editor._state.doc), before);
                plugin._input.value = "Still editable";
                plugin._commit(false);
                assert.equal(host.querySelector(".wx-editor-comment").getAttribute("data-comment-text"), "Still editable");
            }
        }
        const remove = plugin.getContextMenuItems(editor, host.querySelector(".wx-editor-comment")).find(item => item.icon === "trash");
        host.setAttribute("data-delete-comments", "false");
        remove.action();
        plugin._commit(true);
        if (mode === "content") {
            assert.ok(host.querySelector(".wx-editor-comment"));
            host.setAttribute("data-delete-comments", "true");
            plugin._commit(true);
        }
        assert.equal(host.querySelector(".wx-editor-comment"), null);
    });
}
