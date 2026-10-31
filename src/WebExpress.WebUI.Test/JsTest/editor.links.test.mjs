import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

const MEDIA = ["editor/media.js", "panels/webexpress.webui.panel.editor.link.js", "panels/webexpress.webui.panel.editor.image.js"];

/**
 * Sends individual model input transactions so shortcut behavior matches typing.
 * @param {object} runtime - The editor runtime under test.
 * @param {string} text - The characters entered at the current caret.
 */
function type(runtime, text) {
    layout(runtime);
    for (const char of text) runtime.input("insertText", char);
}

/**
 * Gives ranges and elements the layout the popups position themselves by, which the stub lacks.
 * @param {object} runtime - The editor runtime under test.
 */
function layout(runtime) {
    Object.getPrototypeOf(runtime.document.createRange()).getBoundingClientRect = () => ({ left: 0, top: 0, right: 1, bottom: 1, width: 1, height: 1 });
    Object.getPrototypeOf(runtime.document.body).getBoundingClientRect = () => ({ left: 0, top: 0, right: 1, bottom: 1, width: 1, height: 1 });
}

/**
 * Submits the link page the way ModalSidebarPanelCtrl does: validation first, then the change.
 * @param {object} r - The editor runtime.
 * @param {object} target - The link target from EditorLink.
 * @param {string} url - The entered address.
 * @param {string} text - The entered link text.
 * @param {boolean} [newTab=false] - Whether the new-tab box is checked.
 * @returns {object} The modal stand-in, with the validation result in valid.
 */
function submitLink(r, target, url, text, newTab = false) {
    const panel = r.panels.get("editor-link-page");
    const modal = { editorDialog: r.wx.EditorLink.dialog(r.editor, target), _link: { urlInput: { value: url }, textInput: { value: text }, newTabInput: { checked: newTab } } };
    modal.valid = panel.validate(modal);
    if (modal.valid === true) panel.onSubmit(modal);
    return modal;
}

/**
 * Builds the image page state the way its render does, with the given field values.
 * @param {object} r - The editor runtime.
 * @param {HTMLElement|null} image - The image to edit, or null to insert.
 * @param {object} values - The url, alt, width and height field values.
 * @returns {object} The modal stand-in.
 */
function imageModal(r, image, values) {
    const field = name => ({ value: values[name] ?? "" });
    return { editorDialog: r.wx.EditorImage.dialog(r.editor, image), _image: { urlInput: field("url"), altInput: field("alt"), widthInput: field("width"), heightInput: field("height") } };
}

const media = r => r.editor._plugins.find(plugin => plugin.linkModal !== undefined);
const menuAction = (r, target, key) => media(r).getContextMenuItems(r.editor, target).find(item => item.label === "webexpress.webui:" + key).action();
const html = r => r.editor.exportHtml({ layout: false });

test("typed addresses only gain a scheme when they name a host", () => {
    const { wx } = loadEditor();
    const cases = {
        "page.html": "page.html", "./docs/a": "./docs/a", "../x": "../x", "?tab=2": "?tab=2", "#top": "#top",
        "images/logo.png": "images/logo.png", "/wiki/Mein Artikel": "/wiki/Mein%20Artikel", "tel:+4912345": "tel:+4912345",
        "MAILTO:a@b.de": "MAILTO:a@b.de", "a@b.de": "mailto:a@b.de", "example.com/a": "https://example.com/a",
        "www.example.com": "https://www.example.com", "localhost:8080/x": "https://localhost:8080/x", "https://x.test": "https://x.test"
    };
    for (const [input, expected] of Object.entries(cases)) {
        assert.equal(wx.EditorModel.completeUrl(input), expected, input);
        assert.equal(wx.EditorModel.url(expected), expected, "the document keeps " + expected);
    }
    assert.equal(wx.EditorModel.url(wx.EditorModel.completeUrl("java\tscript:alert(1)")), "", "encoding never revives a scheme");
});

test("an internal link stays relative, opens in place and keeps the selected formatting", () => {
    const r = loadEditor({ html: "<p>see <strong>this</strong> page</p>", files: MEDIA });
    r.select(0, 13);
    assert.equal(submitLink(r, r.wx.EditorLink.selected(r.editor), "page.html", "see this page").valid, true);
    assert.equal(r.root.querySelector("p").textContent, "see this page");
    assert.ok(r.root.querySelectorAll("a").every(a => a.getAttribute("href") === "page.html" && a.getAttribute("target") === null));
    assert.match(html(r), /<strong>this<\/strong>/);
});

test("linking a selection across paragraphs keeps the paragraphs and their images", () => {
    const r = loadEditor({ html: '<p>one</p><p>t<img src="/i.png" alt="i">o</p>', files: MEDIA });
    r.select(0, 7);
    submitLink(r, r.wx.EditorLink.selected(r.editor), "/page", "oneto", true);
    assert.equal(r.root.querySelectorAll("p").length, 2);
    assert.ok(r.root.querySelector("img"));
    assert.ok(r.root.querySelectorAll("a").length >= 2);
    assert.ok(r.root.querySelectorAll("a").every(a => a.getAttribute("target") === "_blank"));
});

test("an address the document would drop is reported instead of losing the link", () => {
    const r = loadEditor({ html: "<p>text</p>", files: MEDIA });
    r.select(0, 4);
    const modal = submitLink(r, r.wx.EditorLink.selected(r.editor), "javascript:alert(1)", "text");
    assert.equal(modal.valid.valid, false);
    assert.equal(r.root.querySelector("a"), null);
});

test("the new-tab box follows the address of a new link but keeps an existing link's choice", () => {
    const r = loadEditor({ html: "<p>text</p>", files: MEDIA });
    const panel = r.panels.get("editor-link-page");
    const modal = {};
    // the stub's inputs cannot select their text
    Object.getPrototypeOf(r.document.body).select = () => {};
    panel.render(r.document.createElement("div"), modal);
    for (const [prefill, checked] of [[{ url: "example.com", newTab: null }, true], [{ url: "/intern", newTab: null }, false], [{ url: "https://x.test", newTab: false }, false]]) {
        modal.editorDialog = { prefill: { text: "", image: false, ...prefill } };
        panel.onShow(modal);
        assert.equal(modal._link.newTabInput.checked, checked, prefill.url);
    }
});

test("removing the link of an image keeps the image", () => {
    const r = loadEditor({ html: '<p>a<a href="/page"><img src="/i.png" alt="i"></a>b</p>', files: MEDIA });
    menuAction(r, r.root.querySelector("img"), "editor.remove.link");
    assert.ok(r.root.querySelector("img"));
    assert.equal(r.root.querySelector("a"), null);
    r.editor.execCommand("undo");
    assert.equal(r.root.querySelector("a").getAttribute("href"), "/page");
});

test("link actions cover every run of a formatted link and keep its formatting", () => {
    const r = loadEditor({ html: '<p><a href="/x">foo <strong>bar</strong></a> end</p>', files: MEDIA });
    const target = r.wx.EditorLink.of(r.editor, r.root.querySelector("a"));
    assert.equal(target.text, "foo bar");
    submitLink(r, target, "/y", "foo bar");
    assert.ok(r.root.querySelectorAll("a").every(a => a.getAttribute("href") === "/y"));
    menuAction(r, r.root.querySelector("a"), "editor.remove.link");
    assert.equal(r.root.querySelector("a"), null);
    assert.equal(r.root.querySelector("p").textContent, "foo bar end");
    assert.match(html(r), /<strong>bar<\/strong>/);
});

test("an image address is completed, encoded and validated before it reaches the document", () => {
    const r = loadEditor({ html: "<p>x</p>", files: MEDIA });
    const panel = r.panels.get("image-web");
    const modal = imageModal(r, null, { url: "data:image/png;base64,AAAA" });
    assert.equal(panel.validate(modal).valid, false);
    modal._image.urlInput.value = "/files/my photo.png";
    assert.equal(panel.validate(modal), true);
    panel.onSubmit(modal);
    assert.equal(r.root.querySelector("img").getAttribute("src"), "/files/my%20photo.png");
});

test("an invalid source never deletes an existing image", () => {
    const r = loadEditor({ html: '<p><img src="/i.png" alt="i"></p>', files: MEDIA });
    assert.equal(r.editor.updateNode(r.root.querySelector("img"), { src: "data:image/png;base64,AAAA" }), false);
    assert.equal(r.root.querySelector("img").getAttribute("src"), "/i.png");
});

test("saving an image without changes closes the dialog", () => {
    const r = loadEditor({ html: '<p><img src="/i.png" alt="i"></p>', files: MEDIA });
    const modal = imageModal(r, r.root.querySelector("img"), { url: "/i.png", alt: "i" });
    // the dialog stays open only when onSubmit throws
    assert.doesNotThrow(() => r.panels.get("image-web").onSubmit(modal));
    assert.equal(r.editor._history._entries.length, 0);
});

test("WebUI ships no site library page; the image dialog only offers the address page", () => {
    const r = loadEditor({ files: MEDIA });
    assert.equal(r.panels.get("image-site"), undefined);
    assert.ok(r.panels.get("image-web"));
});

test("a panel of another module inserts an image at the caret the dialog was opened for", () => {
    const r = loadEditor({ html: "<p>xy</p>", files: MEDIA });
    r.select(1);
    media(r).openImage(r.editor);
    const dialog = media(r).imageModal.ctrl.editorDialog;
    assert.equal(dialog.mode, "insert");
    r.select(0);
    assert.equal(dialog.apply({ src: "javascript:alert(1)" }), false);
    assert.equal(dialog.apply({ src: "/files/a b.png", alt: "a" }), true);
    assert.match(html(r), /^<p>x<img src="\/files\/a%20b\.png" alt="a">y<\/p>$/);
});

test("a panel of another module replaces an edited image and keeps what it leaves out", () => {
    const r = loadEditor({ html: '<p><a href="/page"><img src="/old.png" alt="old" style="width: 50%"></a></p>', files: MEDIA });
    media(r).openImage(r.editor, r.root.querySelector("img"));
    const dialog = media(r).imageModal.ctrl.editorDialog;
    assert.equal(dialog.mode, "edit");
    assert.equal(dialog.prefill.url, "/old.png");
    assert.equal(dialog.apply({ src: "/library/new.png", alt: "new" }), true);
    const image = r.root.querySelector("img");
    assert.equal(image.getAttribute("src"), "/library/new.png");
    assert.equal(image.style.width, "50%");
    assert.equal(r.root.querySelector("a").getAttribute("href"), "/page");
});

test("a panel of another module links the selection like an entered address", () => {
    const r = loadEditor({ html: "<p>see <strong>this</strong></p>", files: MEDIA });
    r.select(0, 8);
    media(r).openLink(r.editor);
    const dialog = media(r).linkModal.ctrl.editorDialog;
    assert.deepEqual({ ...dialog.prefill }, { url: "", text: "see this", newTab: null, image: false });
    assert.equal(dialog.apply({ href: "/wiki/Seite" }), true);
    assert.ok(r.root.querySelectorAll("a").every(a => a.getAttribute("href") === "/wiki/Seite" && a.getAttribute("target") === null));
    assert.match(html(r), /<strong>this<\/strong>/);
});

test("the dialog shell leaves validation and submission of the active page to the panel control", () => {
    const r = loadEditor({ html: "<p>x</p>", files: MEDIA });
    // the stub's inputs cannot select their text
    Object.getPrototypeOf(r.document.body).select = () => {};
    media(r).openLink(r.editor);
    const element = media(r).linkModal.element;
    assert.deepEqual(media(r).linkModal.ctrl.pages.map(page => page.id), ["editor-link-page"]);
    assert.equal(element.getAttribute("data-validate-active-only"), "true");
    assert.equal(element.querySelector(".submit-btn").id, element.getAttribute("data-submit-id"));
});

test("a page of another module is offered only to editors it declares itself available for", () => {
    const seen = [];
    for (const upload of ["/api/upload", ""]) {
        const r = loadEditor({ html: "<p>x</p>", files: MEDIA });
        Object.getPrototypeOf(r.document.body).select = () => {};
        r.editor.imageUploadUri = upload;
        r.wx.DialogPanels.register("editor-image", {
            id: "library",
            available: editor => !!editor.imageUploadUri,
            render(pane, modal) { seen.push(modal.editorDialog.editor.imageUploadUri); }
        });
        media(r).openImage(r.editor);
        const ids = media(r).imageModal.ctrl.pages.map(page => page.id);
        assert.deepEqual(ids, upload ? ["image-web", "library"] : ["image-web"], upload || "no upload address");
    }
    assert.deepEqual(seen, ["/api/upload"], "the page renders with the editor it belongs to");
});

test("a cancelled date edit does not redirect the next inserted date", () => {
    const r = loadEditor({ html: "<p>x</p>", files: ["editor/shortcut.js"] });
    const shortcut = r.editor._plugins.find(plugin => plugin.onTransaction);
    layout(r);
    r.select(1);
    shortcut._triggerDateDialog(r.editor);
    shortcut._commitDate(r.editor, "01.01.2026", "DD.MM.YYYY");
    shortcut._editDate(r.editor, r.root.querySelector(".wx-editor-date"));
    shortcut._closeDatePopup();
    r.select(2);
    type(r, " //");
    shortcut._commitDate(r.editor, "02.02.2026", "DD.MM.YYYY");
    assert.deepEqual(r.root.querySelectorAll(".wx-editor-date").map(date => date.textContent), ["01.01.2026", "02.02.2026"]);
});

test("the AddOn slash command inserts through the editor's own add-on plugin", () => {
    const r = loadEditor({ html: "<p>before</p>", files: ["editor/addons.js"], addons: { note: { type: "block", isContainer: true, content: "<p>Note</p>" } } });
    const commands = new Map();
    r.wx.EditorShortcuts.register = (id, definition) => commands.set(id, definition);
    r.load("editor/shortcuts/default.js");
    r.select(6);
    commands.get("insert.addon").execute(r.editor);
    r.editor._addonPlugin._insertAddon(r.wx.EditorAddOns.get("note"), {});
    assert.equal(r.root.querySelectorAll("[data-addon-id]").length, 1);
});

test("inline markdown keeps links and atoms inside the delimiters", () => {
    const r = loadEditor({ html: '<p>**<a href="/x">word</a>**</p>', files: ["editor/shortcut.js"] });
    r.select(8);
    type(r, " ");
    assert.equal(r.root.querySelector("p").textContent, "word ");
    assert.equal(r.root.querySelector("a").getAttribute("href"), "/x");
    assert.match(html(r), /<strong>word<\/strong>/);
    r.editor.execCommand("undo");
    assert.equal(r.root.querySelector("p").textContent, "**word** ");

    const s = loadEditor({ html: "<p>*see </p>", files: ["editor/shortcut.js"] });
    s.select(5);
    s.editor.dispatch({ type: "insertNodes", nodes: [s.wx.EditorModel.node("atom", [], { kind: "mention", text: "@Ada", value: "1" })] });
    type(s, " here* ");
    assert.equal(s.root.querySelector("p").textContent, "see @Ada here ");
    assert.ok(s.root.querySelector(".wx-mention"));
    assert.ok(s.root.querySelector("em"));
});

test("markdown shortcuts stay literal in code", () => {
    const r = loadEditor({ html: "<pre></pre>", files: ["editor/shortcut.js"] });
    r.select(0);
    type(r, "# a * b * `x` ");
    assert.equal(html(r), "<pre># a * b * `x` </pre>");

    const c = loadEditor({ html: "<p>x</p>", files: ["editor/addons.js", "editor/shortcut.js"], addons: { code: { type: "block", isContainer: true, content: "<p></p>" } } });
    c.select(1);
    c.editor._addonPlugin._openModal(c.editor, "_selectionModal", "editor-addon", "title");
    c.editor._addonPlugin._insertAddon(c.wx.EditorAddOns.get("code"), {});
    const Model = c.wx.EditorModel;
    const block = Model.entries(c.editor._state.doc).find(e => e.node.type === "p" && e.ancestors.some(n => n.type === "addon"));
    c.select(block.start);
    type(c, "# ");
    assert.equal(Model.entries(c.editor._state.doc).filter(e => e.node.type === "h1").length, 0);
});

test("an absolute address of this site opens in place unless a tab was chosen", () => {
    const r = loadEditor({ html: "<p>a b c</p>", files: MEDIA });
    // the browser globals the origin comparison needs, which the editor runtime leaves out
    r.sandbox.URL = URL;
    r.sandbox.location = { href: "http://localhost/webui/page" };
    assert.equal(r.wx.EditorLink.external("http://localhost/webui/other"), false);
    assert.equal(r.wx.EditorLink.external("https://example.com/"), true);
    assert.equal(r.wx.EditorLink.external("mailto:a@b.de"), false);
    r.select(0, 1);
    r.wx.EditorLink.dialog(r.editor).apply({ href: "http://localhost/webui/other" });
    r.select(4, 5);
    r.wx.EditorLink.dialog(r.editor).apply({ href: "https://example.com/" });
    assert.deepEqual(r.root.querySelectorAll("a").map(a => a.getAttribute("target")), [null, "_blank"]);
});

test("the image menu offers the sizes directly and each one resizes the image", () => {
    const r = loadEditor({ html: '<p><img src="/i.png" alt="i"></p>', files: MEDIA });
    const items = media(r).getContextMenuItems(r.editor, r.root.querySelector("img"));
    assert.ok(items.every(item => !item.submenu), "no entry only opens further entries");
    assert.equal(items.some(item => item.label === "webexpress.webui:editor.image.size"), false);
    items.find(item => item.label === "50%").action();
    assert.equal(r.root.querySelector("img").style.width, "50%");
});

test("the entries of a bubble submenu open with it instead of standing in the menu", () => {
    const r = loadEditor({ html: "<p>x</p>", files: ["editor/bubble.js"] });
    const bubble = r.editor._plugins.find(plugin => typeof plugin._renderFlyoutItem === "function");
    const menu = r.document.createElement("div");
    bubble._renderFlyoutItem(menu, { label: "More", submenu: [{ label: "One", action: () => {} }, { label: "Two", action: () => {} }] }, r.editor);
    const palette = menu.querySelector(".wx-editor-bubble-menu-palette");
    assert.equal(palette.querySelectorAll(".wx-editor-bubble-menu-item").length, 2);
    assert.equal(menu.childNodes.length, 2, "the menu holds the submenu row and its palette only");
});
