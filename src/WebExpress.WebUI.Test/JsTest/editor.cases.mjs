/** Behavioral regressions use the same controller and reducers as the browser. */
export function editorCases(test, assert, loadEditor) {
    test("form values and change events carry independent JSON documents", () => {
        const { editor, host, select } = loadEditor();
        let published;
        host.addEventListener("wx-change-value", e => { published = e.detail.value; });
        select(5); editor.execCommand("insertText", "!");
        assert.equal(JSON.parse(editor._formInput.value).version, 1);
        assert.equal(published.doc.children[0].children[0].children[0].children[0].text, "alpha!");
        published.doc.children[0].children[0].children.length = 0;
        assert.equal(editor.getState().doc.children[0].children[0].children.length, 1);
    });
    test("render never imports arbitrary DOM mutations into state or history", () => {
        const { editor, root } = loadEditor();
        const before = editor.value;
        root.innerHTML = '<script>alert(1)</script><p>foreign</p>';
        editor._syncValue();
        assert.equal(editor.value, before);
        assert.equal(editor._history.canUndo(), false);
        editor.render(); assert.equal(root.textContent, "alpha");
    });
    test("beforeinput changes the model and recreates the caret after replacement", () => {
        const { editor, root, input, select, selection } = loadEditor();
        const oldText = root.querySelector("p").firstChild;
        select(2); const event = input("insertText", "X");
        assert.equal(event.defaultPrevented, true);
        assert.equal(editor.exportHtml({ layout: false }), "<p>alXpha</p>");
        assert.notEqual(root.querySelector("p").firstChild, oldText);
        assert.equal(selection.getRangeAt(0).startOffset, 3);
        assert.equal(selection.getRangeAt(0).startContainer, root.querySelector("p").firstChild);
    });
    test("toolbar and keyboard formatting use identical transactions", () => {
        const r = loadEditor(); r.select(1,4); r.key("b", { ctrlKey: true });
        assert.equal(r.editor.exportHtml({ layout: false }), "<p>a<strong>lph</strong>a</p>");
        r.editor.execCommand("bold"); assert.equal(r.editor.exportHtml({ layout: false }), "<p>alpha</p>");
        assert.equal(r.editor._history._entries.length, 2);
    });
    test("pending formatting stays active through repeated insertions", () => {
        const r = loadEditor(); r.select(5); r.editor.execCommand("bold");
        r.input("insertText", "x"); r.input("insertText", "y");
        assert.equal(r.editor.exportHtml({ layout: false }), "<p>alpha<strong>xy</strong></p>");
    });
    test("paragraph split and join restore the caret on both sides of an empty block", () => {
        const r = loadEditor(); r.select(0); r.input("insertParagraph");
        assert.equal(r.editor.exportHtml({ layout: false }), "<p><br></p><p>alpha</p>");
        assert.equal(r.editor.selection.focus, 1);
        r.input("deleteContentBackward"); assert.equal(r.editor.exportHtml({ layout: false }), "<p>alpha</p>");
        assert.equal(r.editor.selection.focus, 0);
    });
    test("undo preserves before-selection and redo restores after-selection", () => {
        const r = loadEditor(); r.select(1,4); r.input("insertText", "X");
        r.editor.execCommand("undo");
        assert.equal(r.editor.exportHtml({ layout: false }), "<p>alpha</p>");
        assert.equal(r.editor.selection.anchor, 1); assert.equal(r.editor.selection.focus, 4);
        r.editor.execCommand("redo"); assert.equal(r.editor.exportHtml({ layout: false }), "<p>aXa</p>");
        assert.equal(r.editor.selection.focus, 2);
    });
    test("no-op actions keep redo, new content removes only the redo tail", () => {
        const r = loadEditor(); r.select(5); r.input("insertText", "x"); r.editor.execCommand("undo");
        r.editor.dispatch({ type: "removeNode", id: "missing" });
        assert.equal(r.editor._history.canRedo(), true);
        r.editor.execCommand("insertText", "y"); assert.equal(r.editor._history.canRedo(), false);
    });
    test("history retains at most its configured number of unique transactions", () => {
        const r = loadEditor(); r.wx.EditorHistory.MAX = 3;
        for (const ch of "12345") r.input("insertText", ch);
        assert.equal(r.editor._history._entries.length, 3);
        assert.equal(new Set(r.editor._history._entries.map(e => e.id)).size, 3);
        assert.equal(r.timers.size, 0);
    });
    for (const flags of [{ defaultPrevented: true }, { isComposing: true }, { altKey: true }]) {
        test(`undo key respects ownership flags ${JSON.stringify(flags)}`, () => {
            const r = loadEditor(); r.input("insertText", "x"); const before = r.editor.value;
            r.key("z", { ctrlKey: true, ...flags }); assert.equal(r.editor.value, before);
        });
    }
    for (const tag of ["input", "textarea", "select", "button", "div"]) {
        test(`embedded ${tag} keeps its own history and text input`, () => {
            const r = loadEditor(); r.input("insertText", "x");
            const nested = r.document.createElement(tag);
            if (tag === "div") nested.setAttribute("contenteditable", "true");
            r.root.appendChild(nested); const before = r.editor.value;
            r.key("z", { ctrlKey: true, target: nested });
            r.input("historyUndo", null, { target: nested });
            r.input("insertText", "ignored", { target: nested });
            assert.equal(r.editor.value, before);
        });
    }
    test("one keyboard undo followed by native history input undoes exactly once", () => {
        const r = loadEditor(); r.input("insertText", "1"); r.input("insertText", "2");
        r.key("z", { metaKey: true }); r.input("historyUndo");
        assert.equal(r.editor.exportHtml({ layout: false }), "<p>1alpha</p>");
        r.flush(); r.input("historyUndo"); assert.equal(r.editor.exportHtml({ layout: false }), "<p>alpha</p>");
    });
    test("disabled state covers contenteditable, toolbar, input and programmatic commands", () => {
        const r = loadEditor({ disabled: true }); const before = r.editor.value;
        assert.equal(r.root.getAttribute("contenteditable"), "false");
        assert.equal(r.editor._formInput.disabled, true);
        assert.equal(r.host.querySelector("button").disabled, true);
        r.editor.execCommand("insertText", "x"); r.input("insertText", "y");
        r.form.dispatchEvent({ type: "submit" }); assert.equal(r.editor.value, before);
        r.editor.disabled = false; r.input("insertText", "z"); assert.notEqual(r.editor.value, before);
        r.editor.disabled = true; r.editor._history.undo(); assert.equal(r.editor.exportHtml({ layout: false }), "<p>zalpha</p>");
    });
    test("external JSON replacement resets history and malformed values leave it intact", () => {
        const r = loadEditor(); r.input("insertText", "x");
        const state = r.editor.getState(); state.doc.children[0].children[0].children[0].children[0].text = "external";
        r.editor.setState(state, { emit: false });
        assert.equal(r.editor._history.canUndo(), false);
        state.doc.children[0].children[0].children.length = 0; assert.equal(r.editor.exportHtml({ layout: false }), "<p>external</p>");
        const before = r.editor.value;
        assert.throws(() => r.editor.setState({ version: 9 }), /state|version/); assert.equal(r.editor.value, before);
    });
    test("IME text commits once while temporary composition DOM never becomes the document", () => {
        const r = loadEditor(); r.select(1,4);
        r.root.dispatchEvent({ type: "compositionstart", target: r.root.querySelector(".wx-editor-region") });
        const before = r.editor.value;
        r.root.innerHTML = "<p>native intermediate</p>";
        r.input("insertCompositionText", "中", { isComposing: true, cancelable: false });
        assert.equal(r.editor.value, before);
        r.key("z", { ctrlKey: true }); assert.equal(r.editor.value, before);
        r.root.dispatchEvent({ type: "compositionend", target: r.root.querySelector(".wx-editor-region"), data: "中文" });
        r.input("insertFromComposition", "中文");
        assert.equal(r.editor.exportHtml({ layout: false }), "<p>a中文a</p>");
        assert.equal(r.editor._history._entries.length, 1);
        r.editor.execCommand("undo"); assert.equal(r.editor.exportHtml({ layout: false }), "<p>alpha</p>");
    });
    test("noncancelable text input reduces event data and rejects unrelated native markup", () => {
        const r = loadEditor(); r.select(5); r.input("insertText", "!", { cancelable: false });
        r.root.innerHTML = '<p onclick="evil()">alpha!</p>';
        r.root.dispatchEvent({ type: "input", target: r.root.querySelector(".wx-editor-region"), data: "!" });
        assert.equal(r.editor.exportHtml({ layout: false }), "<p>alpha!</p>");
        assert.equal(r.editor._history._entries.length, 1);
    });
    test("paste validates scripts, unsafe attributes, CSS and URLs before history and events", () => {
        const r = loadEditor(); r.select(0,5);
        r.editor.insertHtmlAtCursor('<script>bad</script><p onclick="bad()"><b>safe</b><img src="javascript:evil"><a href="data:text/html,bad">link</a><span style="color: url(evil)">text</span><input value="bad"></p>');
        const value = r.editor.value;
        assert.equal(/javascript:|onclick|url\(evil\)|bad/.test(value), false);
        assert.equal(r.editor._history._entries.length, 1);
        assert.match(r.editor.exportHtml({ layout: false }), /<strong>safe<\/strong>linktext/);
    });
    test("plain clipboard line breaks become model paragraphs and literal markup stays text", () => {
        const r = loadEditor(); r.select(0,5);
        r.editor._onPaste({ target: r.root.querySelector(".wx-editor-region"), preventDefault() {}, clipboardData: { getData: type => type === "text/plain" ? "<b>literal</b>\nsecond" : "" } });
        assert.match(r.editor.exportHtml({ layout: false }), /&lt;b&gt;literal&lt;\/b&gt;/);
        assert.equal(r.editor._history._entries.length, 1);
    });
    test("destroy removes input, form and document handlers and cancels pending callbacks", () => {
        const r = loadEditor(); let ran = false;
        r.input("insertText", "x"); r.key("z", { ctrlKey: true });
        r.editor.defer(() => { ran = true; }, 50);
        r.editor.destroy(); r.editor.destroy();
        for (const handlers of Object.values(r.root._listeners)) assert.equal(handlers.size, 0);
        assert.equal(r.form._listeners.submit.size, 0); assert.equal(r.timers.size, 0);
        const before = r.editor.value; r.input("insertText", "ignored"); r.flush();
        assert.equal(r.editor.value, before); assert.equal(ran, false);
    });
}
