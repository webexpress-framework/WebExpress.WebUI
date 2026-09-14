export function tableCases(test, assert, loadEditor) {
    const fixture = '<table><tbody><tr><td>one</td><td>two</td></tr><tr><td>three</td><td>four</td></tr></tbody></table>';
    function cells(r) { return r.wx.EditorModel.entries(r.editor._state.doc).filter(e => e.node.type === "td" || e.node.type === "th"); }
    test("formatting in table cells preserves a cross-cell selection after render", () => {
        const r = loadEditor({ html: fixture }); r.select(1,6); r.editor.execCommand("bold");
        const elements = r.root.querySelectorAll("td");
        assert.equal(elements[0].textContent, "one"); assert.equal(elements[1].textContent, "two");
        assert.match(elements[0].innerHTML, /<strong>ne<\/strong>/); assert.match(elements[1].innerHTML, /<strong>tw<\/strong>/);
        assert.equal(r.editor.selection.anchor, 1); assert.equal(r.editor.selection.focus, 6);
    });
    for (const command of ["insertRowAbove", "insertRowBelow", "insertColumnLeft", "insertColumnRight", "deleteRow", "deleteColumn", "deleteTable", "toggleLeftHeader", "insertIntermediateHeader"]) {
        test(`table ${command} commits once and undo restores every cell`, () => {
            const r = loadEditor({ html: fixture }); const before = r.editor.value;
            r.editor.dispatch({ type: "table", command, ids: [cells(r)[0].node.id], text: "Header" });
            assert.notEqual(r.editor.value, before); assert.equal(r.editor._history._entries.length, 1);
            r.editor.execCommand("undo"); assert.equal(r.editor.value, before);
        });
    }
    test("rectangular cell merge and split preserve text and cover all grid positions", () => {
        const r = loadEditor({ html: fixture });
        r.editor.dispatch({ type: "table", command: "mergeCells", ids: cells(r).map(e => e.node.id) });
        let entry = cells(r)[0]; assert.equal(cells(r).length, 1); assert.equal(entry.node.attrs.rowspan, 2); assert.equal(entry.node.attrs.colspan, 2);
        assert.equal(r.root.textContent, "onetwothreefour");
        r.editor.dispatch({ type: "table", command: "splitCell", ids: [entry.node.id] });
        assert.equal(cells(r).length, 4); assert.equal(r.root.textContent, "onetwothreefour");
    });
    test("incomplete rectangles and cross-section merges are rejected without a history entry", () => {
        const r = loadEditor({ html: fixture }); const before = r.editor.value, entries = cells(r);
        r.editor.dispatch({ type: "table", command: "mergeCells", ids: [entries[0].node.id, entries[3].node.id] });
        assert.equal(r.editor.value, before); assert.equal(r.editor._history.canUndo(), false);
        const h = loadEditor({ html: '<table><thead><tr><th>h</th></tr></thead><tbody><tr><td>b</td></tr></tbody></table>' });
        h.editor.dispatch({ type: "table", command: "mergeCells", ids: cells(h).map(e => e.node.id) });
        assert.equal(cells(h).length, 2); assert.equal(h.editor._history.canUndo(), false);
    });
    test("deleting a row through a vertical merge rehomes the spanning cell", () => {
        const r = loadEditor({ html: '<table><tbody><tr><td rowspan="2">span</td><td>a</td></tr><tr><td>b</td></tr></tbody></table>' });
        r.editor.dispatch({ type: "table", command: "deleteRow", ids: [cells(r)[0].node.id] });
        assert.equal(r.root.textContent, "spanb"); assert.equal(cells(r)[0].node.attrs.rowspan, 1);
    });
    test("cell background and column widths are model attributes with undo", () => {
        const r = loadEditor({ html: fixture });
        r.editor.dispatch({ type: "table", command: "background", ids: cells(r).map(e => e.node.id), color: "#ff0000" });
        assert.equal(cells(r).every(e => e.node.attrs.background === "#ff0000"), true);
        const table = r.editor._state.doc.children[0].children[0].children[0]; r.editor.updateNode(table.id, { widths: [150, 230] });
        assert.match(r.editor.exportHtml({ layout: false }), /width: 150px/);
        r.editor.execCommand("undo"); assert.equal(r.editor._state.doc.children[0].children[0].children[0].attrs.widths.length, 0);
    });
}
