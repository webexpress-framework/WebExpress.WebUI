export function imageCases(test, assert, loadEditor) {
    test("typing and atom deletion are separate transactions with exact undo", () => {
        const r = loadEditor({ html: '<p>a<img src="/photo.png" alt="photo">b</p>', files: ["editor/media.js"] });
        r.select(1); r.input("insertText", "x");
        r.wx.EditorImage.remove(r.editor, r.root.querySelector("img"));
        assert.equal(r.editor.exportHtml({ layout: false }), "<p>axb</p>");
        assert.deepEqual(Array.from(r.editor._history._entries, e => e.action.type), ["insertText", "removeNode"]);
        r.editor.execCommand("undo"); assert.match(r.editor.exportHtml({ layout: false }), /ax<img/);
        r.editor.execCommand("undo"); assert.match(r.editor.exportHtml({ layout: false }), /a<img/);
        r.editor.execCommand("redo"); r.editor.execCommand("redo"); assert.equal(r.editor.exportHtml({ layout: false }), "<p>axb</p>");
    });
    test("linked image updates preserve link, dimensions and position in JSON", () => {
        const r = loadEditor({ html: '<p>a<a href="/page"><img src="/old" alt="old"></a>b</p>', files: ["editor/media.js"] });
        r.wx.EditorImage.update(r.editor, r.root.querySelector("img"), { src: "/new", alt: '<literal>', width: "50%", align: "center" });
        const node = r.wx.EditorModel.entries(r.editor._state.doc).find(e => e.node.type === "image").node;
        assert.equal(node.attrs.link.href, "/page"); assert.equal(node.attrs.width, "50%"); assert.equal(node.attrs.alt, "<literal>");
        assert.equal(r.root.querySelector("img").getAttribute("alt"), "<literal>");
        r.editor.execCommand("undo"); assert.match(r.editor.exportHtml({ layout: false }), /src="\/old"/);
    });
    test("image selection resolves to one state unit across rendering", () => {
        const r = loadEditor({ html: '<p>a<img src="/photo">b</p>', files: ["editor/media.js"] });
        r.wx.EditorImage.select(r.editor, r.root.querySelector("img"));
        assert.equal(r.editor.selection.anchor, 1); assert.equal(r.editor.selection.focus, 2);
        r.editor.render(true); r.input("deleteContentBackward"); assert.equal(r.editor.exportHtml({ layout: false }), "<p>ab</p>");
    });
    for (const width of ["-1", "0", "url(evil)", "expression(evil)"]) test(`invalid image dimension ${width} is filtered`, () => {
        const r = loadEditor({ files: ["editor/media.js"] });
        r.wx.EditorImage.insert(r.editor, { src: "/ok", width });
        const node = r.wx.EditorModel.entries(r.editor._state.doc).find(e => e.node.type === "image").node;
        assert.equal(node.attrs.width, undefined);
    });
}
