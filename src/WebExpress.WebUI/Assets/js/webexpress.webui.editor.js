/**
 * Selection and range helpers for the editor.
 *
 * Replaces the fragile "clone a live range" approach with two robust tools:
 *  - getRange / apply for persisting the selection across focus changes
 *    (toolbar click, bubble, modal), constrained to the editor root.
 *  - Caret markers (temporary, empty elements) used to relocate the caret
 *    AFTER DOM mutations (table framing, typing space). Markers move with
 *    their parent node and therefore survive node relocation, unlike offsets
 *    or cloned ranges.
 */
webexpress.webui.EditorSelection = class {
 
    static MARKER_ATTR = "data-wx-caret";
 
    /**
     * Returns the current selection range, provided it lies entirely within root.
     * @param {HTMLElement} root - The editor root (contenteditable).
     * @returns {Range|null} The range, or null when no range lies inside root.
     */
    static getRange(root) {
        if (!root) {
            return null;
        }
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            return null;
        }
        const range = sel.getRangeAt(0);
        if (root.contains(range.startContainer) && root.contains(range.endContainer)) {
            return range;
        }
        return null;
    }
 
    /**
     * Applies a range as the active selection.
     * @param {Range} range - The range to apply.
     * @returns {void}
     */
    static apply(range) {
        const sel = window.getSelection();
        if (!sel || !range) {
            return;
        }
        sel.removeAllRanges();
        sel.addRange(range);
    }
 
    /**
     * Creates an empty, inert caret marker.
     * @returns {HTMLElement} The marker element.
     */
    static createMarker() {
        const marker = document.createElement("span");
        marker.setAttribute(this.MARKER_ATTR, "");
        // zero footprint so the user never sees it during the (synchronous)
        // intermediate step; it is removed again immediately.
        marker.style.cssText = "display:inline;padding:0;margin:0;width:0;height:0;line-height:0;";
        return marker;
    }
 
    /**
     * Inserts a marker directly after referenceNode, or at the range when no
     * reference node is available.
     * @param {Range} range - The current range, used as the fallback position.
     * @param {Node|null} referenceNode - Node after which the marker is placed.
     * @returns {HTMLElement} The inserted marker.
     */
    static insertMarker(range, referenceNode) {
        const marker = this.createMarker();
        if (referenceNode && referenceNode.parentNode) {
            referenceNode.parentNode.insertBefore(marker, referenceNode.nextSibling);
        } else if (range) {
            range.insertNode(marker);
        }
        return marker;
    }
 
    /**
     * Locates the caret marker in root, places the caret at its position and
     * then removes it. Orphaned markers are removed defensively as well.
     * @param {HTMLElement} root - The editor root.
     * @returns {boolean} True when a marker was found and the caret was set.
     */
    static placeCaretAtMarker(root) {
        if (!root) {
            return false;
        }
        const marker = root.querySelector("[" + this.MARKER_ATTR + "]");
        if (!marker || !marker.parentNode) {
            this._removeAllMarkers(root);
            return false;
        }
 
        const parent = marker.parentNode;
        const index = Array.prototype.indexOf.call(parent.childNodes, marker);
        parent.removeChild(marker);
 
        const range = document.createRange();
        const safeIndex = Math.min(index, parent.childNodes.length);
        range.setStart(parent, safeIndex);
        range.collapse(true);
        this.apply(range);
 
        this._removeAllMarkers(root);
        return true;
    }
 
    /**
     * Removes all (including orphaned) markers from root.
     * @param {HTMLElement} root - The editor root.
     * @returns {void}
     */
    static _removeAllMarkers(root) {
        root.querySelectorAll("[" + this.MARKER_ATTR + "]").forEach((m) => {
            if (m.parentNode) {
                m.parentNode.removeChild(m);
            }
        });
    }

    /** Block elements a range marker may be sunk into. */
    static _SINK_TAGS = new Set([
        "P", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "DIV",
        "UL", "OL", "LI"
    ]);

    /**
     * Marks the current range with a start and an end marker so the whole
     * selection (not just the caret) can be restored after DOM restructuring
     * via restoreRange. The end marker is inserted first so the start boundary
     * stays valid. Markers that would land between block elements are sunk
     * into the adjacent block, keeping sibling relationships between blocks
     * intact (run grouping in the list engine relies on them).
     * @param {Range} range - The selection range to preserve.
     * @returns {boolean} True when the markers were inserted.
     */
    static markRange(range) {
        if (!range) {
            return false;
        }

        if (range.collapsed) {
            // a single marker suffices for a caret; a marker pair would leave
            // an empty text-split residue between the two markers and the
            // restored range would no longer be collapsed
            const caretMarker = this.createMarker();
            caretMarker.setAttribute(this.MARKER_ATTR, "start");
            const r = range.cloneRange();
            r.insertNode(caretMarker);
            return true;
        }

        const endMarker = this.createMarker();
        endMarker.setAttribute(this.MARKER_ATTR, "end");
        const endRange = range.cloneRange();
        endRange.collapse(false);
        endRange.insertNode(endMarker);

        const startMarker = this.createMarker();
        startMarker.setAttribute(this.MARKER_ATTR, "start");
        const startRange = range.cloneRange();
        startRange.collapse(true);
        startRange.insertNode(startMarker);

        this._sinkStartMarker(startMarker);
        this._sinkEndMarker(endMarker);
        return true;
    }

    /**
     * Restores the selection between the markers left by markRange and removes
     * them. A collapsed marked range is restored as a collapsed caret.
     * @param {HTMLElement} root - The editor root.
     * @returns {boolean} True when the selection was restored.
     */
    static restoreRange(root) {
        if (!root) {
            return false;
        }
        const start = root.querySelector("[" + this.MARKER_ATTR + "='start']");
        const end = root.querySelector("[" + this.MARKER_ATTR + "='end']");
        if (!start || !start.parentNode) {
            this._removeAllMarkers(root);
            return false;
        }
        if (!end || !end.parentNode) {
            // a single marker stands for a collapsed caret
            const caret = document.createRange();
            caret.setStartBefore(start);
            caret.collapse(true);
            start.parentNode.removeChild(start);
            this.apply(caret);
            this._removeAllMarkers(root);
            return true;
        }
        if (!(start.compareDocumentPosition(end) & Node.DOCUMENT_POSITION_FOLLOWING)) {
            // the restructuring reordered the markers - give up gracefully
            this._removeAllMarkers(root);
            return false;
        }
        const range = document.createRange();
        range.setStartAfter(start);
        range.setEndBefore(end);
        // ranges are live: removing the markers adjusts the boundaries
        start.parentNode.removeChild(start);
        end.parentNode.removeChild(end);
        this.apply(range);
        this._removeAllMarkers(root);
        return true;
    }

    /**
     * Moves a start marker that sits before a block element into that block's
     * first position, so the marker never separates sibling blocks.
     * @param {HTMLElement} marker - The start marker.
     * @returns {void}
     */
    static _sinkStartMarker(marker) {
        let guard = 0;
        while (guard++ < 50) {
            let next = marker.nextSibling;
            while (next && this._isIgnorableText(next)) {
                next = next.nextSibling;
            }
            if (!this._isSinkTarget(next)) {
                break;
            }
            next.insertBefore(marker, next.firstChild);
        }
    }

    /**
     * Moves an end marker that sits after a block element into that block's
     * last position, so the marker never separates sibling blocks.
     * @param {HTMLElement} marker - The end marker.
     * @returns {void}
     */
    static _sinkEndMarker(marker) {
        let guard = 0;
        while (guard++ < 50) {
            let prev = marker.previousSibling;
            while (prev && this._isIgnorableText(prev)) {
                prev = prev.previousSibling;
            }
            if (!this._isSinkTarget(prev)) {
                break;
            }
            prev.appendChild(marker);
        }
    }

    /**
     * Returns true when node is an editable block a marker may be moved into.
     * @param {Node|null} node - Candidate node.
     * @returns {boolean}
     */
    static _isSinkTarget(node) {
        return !!node &&
            node.nodeType === Node.ELEMENT_NODE &&
            this._SINK_TAGS.has(node.tagName) &&
            node.getAttribute("contenteditable") !== "false";
    }

    /**
     * Returns true when node is a whitespace-only text node.
     * @param {Node} node - Candidate node.
     * @returns {boolean}
     */
    static _isIgnorableText(node) {
        return node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim() === "";
    }
};

/**
 * Keyboard deletion handler for the editor.
 *
 * Intercepts Backspace and Delete to give deterministic behaviour around
 * non-editable atomic nodes, which native contenteditable handles poorly: it
 * tends to delete the whole element or merge blocks destructively when the
 * caret sits next to such a node.
 */
webexpress.webui.EditorDeletion = class {
 
    /** Inline elements that may wrap an atomic and must be descended into. */
    static INLINE_TAGS = new Set([
        "A", "ABBR", "B", "BDI", "BDO", "CITE", "CODE", "DATA", "DFN", "EM",
        "I", "KBD", "MARK", "Q", "S", "SAMP", "SMALL", "SPAN", "STRONG",
        "SUB", "SUP", "TIME", "U", "VAR"
    ]);
 
    /**
     * @param {webexpress.webui.EditorCtrl} editor - The owning editor instance.
     */
    constructor(editor) {
        this._editor = editor;
        this._normalizeTimer = null;
        this._attach();
    }
 
    /**
     * Binds the keydown and input listeners to the editor content element.
     * @returns {void}
     */
    _attach() {
        const el = this._editor.getEditorElement();
        if (!el) {
            return;
        }
        el.addEventListener("keydown", (e) => this._onKeyDown(e));
        el.addEventListener("input", (e) => this._onInput(e));
    }
 
    /**
     * Routes Backspace and Delete; every other key is left to other handlers.
     * @param {KeyboardEvent} e - The keydown event.
     * @returns {void}
     */
    _onKeyDown(e) {
        if (e.defaultPrevented || e.isComposing) {
            return;
        }
        if (e.key !== "Backspace" && e.key !== "Delete") {
            return;
        }
        // word/line deletions (Ctrl/Alt/Meta) are left to the browser
        if (e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }
 
        const editor = this._editor.getEditorElement();
        const range = webexpress.webui.EditorSelection.getRange(editor);
        if (!range) {
            return;
        }
 
        if (!range.collapsed) {
            this._handleRangeDelete(e, range, editor);
            return;
        }
 
        const host = this._editingHost(range.startContainer);
        if (e.key === "Backspace") {
            this._handleBackspace(e, range, host);
        } else {
            this._handleDelete(e, range, host);
        }
    }
 
    /**
     * Schedules guard restoration after native (non-intercepted) deletions.
     * @param {InputEvent} e - The input event.
     * @returns {void}
     */
    _onInput(e) {
        const type = e.inputType || "";
        if (type.indexOf("delete") !== 0) {
            return;
        }
        this._scheduleNormalize();
    }

    /**
     * Handles Backspace with a collapsed caret.
     * @param {KeyboardEvent} e - The keydown event.
     * @param {Range} range - The current (collapsed) range.
     * @param {HTMLElement} host - The nearest editing host.
     * @returns {void}
     */
    _handleBackspace(e, range, host) {
        const leaf = this._precedingLeaf(range.startContainer, range.startOffset, host);
        if (leaf === null) {
            // start of the editing host: block native deletion so the caret
            // cannot escape a nested editable island or trigger a destructive
            // merge with a preceding frame
            e.preventDefault();
            return;
        }
        if (leaf.nodeType === Node.TEXT_NODE) {
            return; // an ordinary character precedes the caret -> native
        }
        if (this._isAtomic(leaf)) {
            e.preventDefault();
            this._selectAtomic(leaf);
            return;
        }
        // <br> or empty inline element -> native
    }
 
    /**
     * Handles Delete (forward) with a collapsed caret.
     * @param {KeyboardEvent} e - The keydown event.
     * @param {Range} range - The current (collapsed) range.
     * @param {HTMLElement} host - The nearest editing host.
     * @returns {void}
     */
    _handleDelete(e, range, host) {
        const leaf = this._followingLeaf(range.startContainer, range.startOffset, host);
        if (leaf === null) {
            e.preventDefault();
            return;
        }
        if (leaf.nodeType === Node.TEXT_NODE) {
            return;
        }
        if (this._isAtomic(leaf)) {
            e.preventDefault();
            this._selectAtomic(leaf);
            return;
        }
    }
 
    /**
     * Deletes a non-collapsed selection. Pure content selections are left to
     * the browser (correct block merging); when the selection touches an
     * atomic, its boundaries are snapped outside the atomic and the range is
     * removed manually, then the caret and guards are restored.
     * @param {KeyboardEvent} e - The keydown event.
     * @param {Range} range - The current (non-collapsed) range.
     * @param {HTMLElement} editor - The editor content element.
     * @returns {void}
     */
    _handleRangeDelete(e, range, editor) {
        if (!this._rangeTouchesAtomic(range, editor)) {
            return; // no atomic involved -> let the browser merge correctly
        }
 
        const target = this._snapRangeOutsideAtomics(range, editor);
        e.preventDefault();
 
        target.deleteContents();
 
        if (this._isEditorEmpty(editor)) {
            editor.innerHTML = "<p><br></p>";
            this._caretToStart(editor.firstChild);
        } else {
            const marker = webexpress.webui.EditorSelection.createMarker();
            target.insertNode(marker);
            this._editor._ensureTypingSpace();
            webexpress.webui.EditorSelection.placeCaretAtMarker(editor);
        }
 
        this._editor._saveCurrentSelection();
        this._editor._syncValue();
        this._editor._updateUndoRedoStates();
    }
 
    /**
     * Selects an atomic node so the next keystroke removes it as one unit.
     * @param {HTMLElement} atomic - The non-editable element to select.
     * @returns {void}
     */
    _selectAtomic(atomic) {
        const range = document.createRange();
        range.selectNode(atomic);
        webexpress.webui.EditorSelection.apply(range);
        this._editor._saveCurrentSelection();
    }
 
    /**
     * Returns the leaf node immediately before (container, offset) within host,
     * descending into inline wrappers so a wrapped atomic is detected. Block
     * boundaries are not crossed, since their merge is left to the browser.
     * @param {Node} container - Range start container.
     * @param {number} offset - Range start offset.
     * @param {HTMLElement} host - The editing host (search boundary).
     * @returns {Node|null} The preceding leaf, or null at the host start.
     */
    _precedingLeaf(container, offset, host) {
        if (container.nodeType === Node.TEXT_NODE) {
            if (offset > 0) {
                return container;
            }
            return this._resolveLast(this._previousAcross(container, host));
        }
        if (offset > 0) {
            return this._resolveLast(container.childNodes[offset - 1] || null);
        }
        return this._resolveLast(this._previousAcross(container, host));
    }
 
    /**
     * Returns the leaf node immediately after (container, offset) within host.
     * @param {Node} container - Range start container.
     * @param {number} offset - Range start offset.
     * @param {HTMLElement} host - The editing host (search boundary).
     * @returns {Node|null} The following leaf, or null at the host end.
     */
    _followingLeaf(container, offset, host) {
        if (container.nodeType === Node.TEXT_NODE) {
            if (offset < (container.textContent || "").length) {
                return container;
            }
            return this._resolveFirst(this._nextAcross(container, host));
        }
        if (offset < container.childNodes.length) {
            return this._resolveFirst(container.childNodes[offset] || null);
        }
        return this._resolveFirst(this._nextAcross(container, host));
    }
 
    /**
     * Walks up to the nearest ancestor that has a previous sibling and returns
     * that sibling, bounded by host.
     * @param {Node} node - Start node.
     * @param {HTMLElement} host - Search boundary.
     * @returns {Node|null}
     */
    _previousAcross(node, host) {
        let n = node;
        while (n && n !== host) {
            if (n.previousSibling) {
                return n.previousSibling;
            }
            n = n.parentNode;
        }
        return null;
    }
 
    /**
     * Walks up to the nearest ancestor that has a next sibling and returns that
     * sibling, bounded by host.
     * @param {Node} node - Start node.
     * @param {HTMLElement} host - Search boundary.
     * @returns {Node|null}
     */
    _nextAcross(node, host) {
        let n = node;
        while (n && n !== host) {
            if (n.nextSibling) {
                return n.nextSibling;
            }
            n = n.parentNode;
        }
        return null;
    }
 
    /**
     * Descends the last-child chain through non-atomic inline wrappers so a
     * trailing atomic inside e.g. <b>...<span contenteditable="false"></span></b>
     * is found. Block elements stop the descent.
     * @param {Node|null} node - Candidate node.
     * @returns {Node|null}
     */
    _resolveLast(node) {
        let cur = node;
        while (this._isInlineWrapper(cur) && cur.lastChild) {
            cur = cur.lastChild;
        }
        return cur;
    }
 
    /**
     * Descends the first-child chain through non-atomic inline wrappers.
     * @param {Node|null} node - Candidate node.
     * @returns {Node|null}
     */
    _resolveFirst(node) {
        let cur = node;
        while (this._isInlineWrapper(cur) && cur.firstChild) {
            cur = cur.firstChild;
        }
        return cur;
    }
 
    /**
     * Returns true when node is a non-atomic inline element that may be
     * descended into.
     * @param {Node|null} node - Node to test.
     * @returns {boolean}
     */
    _isInlineWrapper(node) {
        return !!node &&
            node.nodeType === Node.ELEMENT_NODE &&
            !this._isAtomic(node) &&
            webexpress.webui.EditorDeletion.INLINE_TAGS.has(node.tagName);
    }
 
    /**
     * Returns true when node is a non-editable atomic (contenteditable="false",
     * IMG or HR).
     * @param {Node} node - Node to test.
     * @returns {boolean}
     */
    _isAtomic(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }
        if (node.getAttribute("contenteditable") === "false") {
            return true;
        }
        return node.tagName === "IMG" || node.tagName === "HR";
    }
 
    /**
     * Returns the nearest editing host (closest contenteditable="true"
     * ancestor) for node, or the editor content element itself.
     * @param {Node} node - Start node.
     * @returns {HTMLElement}
     */
    _editingHost(node) {
        const editor = this._editor.getEditorElement();
        let n = node && node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        while (n && n !== editor) {
            if (n.getAttribute && n.getAttribute("contenteditable") === "true") {
                return n;
            }
            n = n.parentElement;
        }
        return editor;
    }
 
    /**
     * Returns true when the range intersects any atomic, either by having an
     * endpoint inside one or by spanning one.
     * @param {Range} range - The selection range.
     * @param {HTMLElement} editor - Search root.
     * @returns {boolean}
     */
    _rangeTouchesAtomic(range, editor) {
        if (this._atomicAncestor(range.startContainer, editor) ||
            this._atomicAncestor(range.endContainer, editor)) {
            return true;
        }
        const atomics = editor.querySelectorAll('[contenteditable="false"], img, hr');
        for (const a of atomics) {
            if (range.intersectsNode(a)) {
                return true;
            }
        }
        return false;
    }
 
    /**
     * Clones range and moves its boundaries outside any atomic ancestor so a
     * delete never cuts an atomic in half.
     * @param {Range} range - The selection range.
     * @param {HTMLElement} editor - Search boundary.
     * @returns {Range} A new, snapped range.
     */
    _snapRangeOutsideAtomics(range, editor) {
        const r = range.cloneRange();
        const startAtomic = this._atomicAncestor(r.startContainer, editor);
        if (startAtomic) {
            r.setStartBefore(startAtomic);
        }
        const endAtomic = this._atomicAncestor(r.endContainer, editor);
        if (endAtomic) {
            r.setEndAfter(endAtomic);
        }
        return r;
    }
 
    /**
     * Returns the outermost atomic ancestor of node within editor, or null.
     * @param {Node} node - Start node.
     * @param {HTMLElement} editor - Search boundary.
     * @returns {HTMLElement|null}
     */
    _atomicAncestor(node, editor) {
        let n = node && node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        let found = null;
        while (n && n !== editor) {
            if (this._isAtomic(n)) {
                found = n;
            }
            n = n.parentElement;
        }
        return found;
    }
 
    /**
     * Returns true when the editor has no textual or atomic content.
     * @param {HTMLElement} editor - The editor content element.
     * @returns {boolean}
     */
    _isEditorEmpty(editor) {
        const text = (editor.textContent || "").trim();
        return text === "" &&
            !editor.querySelector("img, hr, table, [contenteditable='false']");
    }
 
    /**
     * Collapses the caret to the start of the given node.
     * @param {Node} node - Target node.
     * @returns {void}
     */
    _caretToStart(node) {
        if (!node) {
            return;
        }
        const r = document.createRange();
        r.selectNodeContents(node);
        r.collapse(true);
        webexpress.webui.EditorSelection.apply(r);
    }
 
    /**
     * Debounces a guard-restoring normalization pass after native deletions.
     * @returns {void}
     */
    _scheduleNormalize() {
        if (this._normalizeTimer) {
            clearTimeout(this._normalizeTimer);
        }
        this._normalizeTimer = setTimeout(() => {
            this._normalizeTimer = null;
            this._normalizePreservingCaret();
        }, 120);
    }
 
    /**
     * Re-runs the typing-space normalization while preserving the caret, so
     * guard paragraphs removed by a native deletion are restored.
     * @returns {void}
     */
    _normalizePreservingCaret() {
        const editor = this._editor.getEditorElement();
        if (!editor) {
            return;
        }
 
        if (this._isEditorEmpty(editor)) {
            editor.innerHTML = "<p><br></p>";
            this._caretToStart(editor.firstChild);
            this._editor._saveCurrentSelection();
            this._editor._syncValue();
            return;
        }
 
        const range = webexpress.webui.EditorSelection.getRange(editor);
        let marker = null;
        if (range) {
            marker = webexpress.webui.EditorSelection.createMarker();
            range.insertNode(marker);
        }
 
        this._editor._ensureTypingSpace();
 
        if (marker) {
            webexpress.webui.EditorSelection.placeCaretAtMarker(editor);
        }
        this._editor._saveCurrentSelection();
    }
};

/**
 * Range-based inline formatting engine. Stateless: every public method takes
 * the owning editor instance and reads the live selection itself.
 */
webexpress.webui.EditorFormat = class {

    /** Inline elements treated as formatting wrappers. */
    static INLINE_FORMAT_SELECTOR =
        "b,strong,i,em,u,s,strike,del,sub,sup,mark,small,code,font,span";

    /** Block units a multi-block transform is sliced by. */
    static BLOCK_UNIT_SELECTOR =
        "p,h1,h2,h3,h4,h5,h6,blockquote,pre,div,li,td,th";

    /**
     * Command table. Keys are lower-cased command names.
     * - type "toggle": tag to add / selector to detect / styleProps to clear /
     *   probe to read computed style / optional opposite (mutually exclusive).
     * - type "style":  CSS property set on a wrapping span.
     * - type "remove": strips all inline formatting.
     */
    static SPECS = {
        bold: {
            type: "toggle", tag: "strong", selector: "b,strong",
            styleProps: ["fontWeight"],
            probe: (s) => {
                const w = parseInt(s.fontWeight, 10);
                return s.fontWeight === "bold" || (Number.isFinite(w) && w >= 600);
            }
        },
        italic: {
            type: "toggle", tag: "em", selector: "i,em",
            styleProps: ["fontStyle"],
            probe: (s) => s.fontStyle === "italic" || s.fontStyle === "oblique"
        },
        underline: {
            type: "toggle", tag: "u", selector: "u",
            styleProps: ["textDecoration", "textDecorationLine"],
            probe: (s) => ((s.textDecorationLine || s.textDecoration || "").indexOf("underline") !== -1)
        },
        strikethrough: {
            type: "toggle", tag: "s", selector: "s,strike,del",
            styleProps: ["textDecoration", "textDecorationLine"],
            probe: (s) => ((s.textDecorationLine || s.textDecoration || "").indexOf("line-through") !== -1)
        },
        superscript: { type: "toggle", tag: "sup", selector: "sup", opposite: "subscript" },
        subscript: { type: "toggle", tag: "sub", selector: "sub", opposite: "superscript" },

        forecolor: { type: "style", prop: "color" },
        hilitecolor: { type: "style", prop: "backgroundColor" },
        backcolor: { type: "style", prop: "backgroundColor" },

        removeformat: { type: "remove" }
    };

    /**
     * Returns true when this engine owns the given command.
     * @param {string} command - Command name (any case).
     * @returns {boolean}
     */
    static handles(command) {
        return !!this._spec(command);
    }

    /**
     * Resolves a command spec by its lower-cased name.
     * @param {string} command - Command name.
     * @returns {object|null}
     */
    static _spec(command) {
        return this.SPECS[(command || "").toLowerCase()] || null;
    }

    /**
     * Executes a formatting command against the editor's current selection.
     * @param {webexpress.webui.EditorCtrl} editor - The editor instance.
     * @param {string} command - Command name.
     * @param {*} value - Optional value (e.g. a colour for style commands).
     * @returns {boolean} True when the command was handled by this engine.
     */
    static exec(editor, command, value) {
        const spec = this._spec(command);
        if (!spec) {
            return false;
        }
        const root = editor.getEditorElement();
        if (!root) {
            return true;
        }
        const range = webexpress.webui.EditorSelection.getRange(root);
        if (!range) {
            return true;
        }

        if (range.collapsed) {
            // collapsed caret: remember the format and apply it to the next typed text
            if (editor._pendingFormat) {
                if (spec.type === "toggle") {
                    editor._pendingFormat.toggle(command);
                } else if (spec.type === "style") {
                    editor._pendingFormat.setStyle(spec.prop, value);
                }
                // "remove" has nothing to clear at a caret
            } else {
                try {
                    document.execCommand(command, false, value);
                } catch (e) {
                    /* noop */
                }
            }
            editor._saveCurrentSelection();
            return true;
        }

        if (spec.type === "toggle") {
            this._execToggleRange(root, range, spec);
        } else if (spec.type === "style") {
            this._execStyleRange(root, range, spec, value);
        } else if (spec.type === "remove") {
            this._execRemoveRange(root, range);
        }

        this._cleanupEmptyWrappers(root);
        editor._saveCurrentSelection();
        editor._syncValue();
        editor._updateUndoRedoStates();
        return true;
    }

    /**
     * Returns whether the current selection carries the given toggle format.
     * Style and remove commands have no active state.
     * @param {webexpress.webui.EditorCtrl} editor - The editor instance.
     * @param {string} command - Command name.
     * @returns {boolean}
     */
    static queryState(editor, command) {
        const spec = this._spec(command);
        if (!spec || spec.type !== "toggle") {
            return false;
        }
        const root = editor.getEditorElement();
        const range = webexpress.webui.EditorSelection.getRange(root);
        if (!range) {
            return false;
        }
        if (range.collapsed && editor._pendingFormat && editor._pendingFormat.state(command)) {
            return true;
        }
        let el = range.startContainer;
        el = el.nodeType === Node.TEXT_NODE ? el.parentElement : el;
        if (!el || !root.contains(el)) {
            return false;
        }
        if (spec.selector && this._closestWithin(el, spec.selector, root)) {
            return true;
        }
        if (spec.probe) {
            try {
                return !!spec.probe(window.getComputedStyle(el));
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    /**
     * Replaces the inline formatting of the selection with the given wrapper
     * chain (captured by the format painter). The existing inline formatting
     * is stripped first, then every text node is wrapped in clones of the
     * chain, outermost first. An empty chain therefore acts like removeFormat.
     * @param {webexpress.webui.EditorCtrl} editor - The editor instance.
     * @param {Range} range - The (non-collapsed) selection range.
     * @param {{tag:string, style:string}[]} chain - Wrapper descriptors.
     * @returns {void}
     */
    static applyChain(editor, range, chain) {
        const root = editor.getEditorElement();
        if (!root) {
            return;
        }
        this._transformRange(root, range, (frag) => {
            this._stripAllInlineInFrag(frag);
            if (!chain || !chain.length) {
                return;
            }
            this._textNodesInScope(frag, false).forEach((t) => {
                let outer = null;
                let inner = null;
                chain.forEach((d) => {
                    const el = document.createElement(d.tag);
                    if (d.style) {
                        el.setAttribute("style", d.style);
                    }
                    if (inner) {
                        inner.appendChild(el);
                    } else {
                        outer = el;
                    }
                    inner = el;
                });
                t.parentNode.insertBefore(outer, t);
                inner.appendChild(t);
            });
        });
        this._cleanupEmptyWrappers(root);
        editor._saveCurrentSelection();
        editor._syncValue();
        editor._updateUndoRedoStates();
    }

    /**
     * Adds or removes a toggle format across the selection, depending on
     * whether the whole selection already carries it.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The (non-collapsed) selection range.
     * @param {object} spec - Toggle spec.
     * @returns {void}
     */
    static _execToggleRange(root, range, spec) {
        if (this._isRangeFormatted(root, range, spec)) {
            // When the whole selection sits inside a single matching format
            // wrapper (e.g. selecting part of a <strong>), extractContents would
            // NOT carry the wrapper, so stripping the (wrapper-less) fragment is
            // a no-op and the bold/italic/... silently survives. Splitting the
            // wrapper around the selection removes the format reliably.
            const wrapper = spec.selector ? this._commonFormatAncestor(range, spec.selector, root) : null;
            if (wrapper) {
                this._unwrapWithinWrapper(wrapper, range, spec);
            } else {
                this._transformRange(root, range, (frag) => this._stripFormatInFrag(frag, spec));
            }
        } else {
            this._transformRange(root, range, (frag) => this._wrapBareTextInFrag(frag, spec));
        }
    }

    /**
     * Returns the nearest ancestor matching selector that fully contains the
     * range (i.e. the range lives entirely inside one format wrapper), or null.
     * @param {Range} range - The selection range.
     * @param {string} selector - The format selector.
     * @param {HTMLElement} root - Search boundary.
     * @returns {HTMLElement|null}
     */
    static _commonFormatAncestor(range, selector, root) {
        return this._closestWithin(range.commonAncestorContainer, selector, root);
    }

    /**
     * Removes a toggle format that wraps the whole selection by splitting the
     * wrapper into up to three parts: the content before the selection stays
     * wrapped, the selected content is unwrapped (plain), and the content after
     * the selection is re-wrapped. The selection is restored on the plain part.
     * @param {HTMLElement} wrapper - The format element enclosing the selection.
     * @param {Range} range - The selection range (inside the wrapper).
     * @param {object} spec - Toggle spec.
     * @returns {void}
     */
    static _unwrapWithinWrapper(wrapper, range, spec) {
        const parent = wrapper.parentNode;
        if (!parent) {
            return;
        }
        const tag = wrapper.tagName;

        const startC = range.startContainer;
        const startO = range.startOffset;
        const endC = range.endContainer;
        const endO = range.endOffset;

        // 1) take the content AFTER the selection out of the wrapper
        const postR = document.createRange();
        postR.setStart(endC, endO);
        postR.setEnd(wrapper, wrapper.childNodes.length);
        const postFrag = postR.extractContents();

        // 2) take the SELECTED content out of the (now shortened) wrapper
        const midR = document.createRange();
        midR.setStart(startC, startO);
        midR.setEnd(wrapper, wrapper.childNodes.length);
        const midFrag = midR.extractContents();

        // the middle becomes plain text - clear any nested matching format/style
        this._stripFormatInFrag(midFrag, spec);

        // re-wrap the trailing content, preserving the wrapper's attributes
        let postWrapper = null;
        if (postFrag.childNodes.length) {
            postWrapper = document.createElement(tag);
            this._copyAttributes(wrapper, postWrapper);
            postWrapper.appendChild(postFrag);
        }

        const midFirst = midFrag.firstChild;
        const midLast = midFrag.lastChild;

        const after = wrapper.nextSibling;
        if (postWrapper) {
            parent.insertBefore(postWrapper, after);
        }
        parent.insertBefore(midFrag, postWrapper || after);

        // drop the original wrapper when its leading part is now empty
        if (this._isEffectivelyEmpty(wrapper)) {
            parent.removeChild(wrapper);
        }

        if (midFirst && midLast) {
            const sel = document.createRange();
            sel.setStartBefore(midFirst);
            sel.setEndAfter(midLast);
            webexpress.webui.EditorSelection.apply(sel);
        }
    }

    /**
     * Copies all attributes from one element to another.
     * @param {HTMLElement} src - Source element.
     * @param {HTMLElement} dst - Destination element.
     * @returns {void}
     */
    static _copyAttributes(src, dst) {
        if (!src || !dst || !src.attributes) {
            return;
        }
        for (let i = 0; i < src.attributes.length; i++) {
            const attr = src.attributes[i];
            try {
                dst.setAttribute(attr.name, attr.value);
            } catch (e) {
                /* noop */
            }
        }
    }

    /**
     * Applies a CSS property to the selection by wrapping its text in spans.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @param {object} spec - Style spec.
     * @param {string} value - The CSS value to set.
     * @returns {void}
     */
    static _execStyleRange(root, range, spec, value) {
        this._transformRange(root, range, (frag) => this._wrapStyleInFrag(frag, spec, value));
    }

    /**
     * Removes all inline formatting from the selection.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @returns {void}
     */
    static _execRemoveRange(root, range) {
        this._transformRange(root, range, (frag) => this._stripAllInlineInFrag(frag));
    }

    /**
     * Transforms the selected content in place and reselects it. The range is
     * sliced into per-block sub-ranges first, because extractContents() on a
     * range that crosses block boundaries clones the block structure into the
     * fragment: reinserting it would nest a copy of the list/table and leave
     * empty shells (e.g. empty <li>s) at the selection boundaries. Each slice
     * lies entirely within one block, so only inline wrappers are ever cloned;
     * the insertion point of every slice is normalized so leftover empty
     * wrappers do not re-apply formatting.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @param {function(DocumentFragment):void} transform - Fragment rewriter.
     * @returns {void}
     */
    static _transformRange(root, range, transform) {
        const slices = this._sliceRangeByBlock(root, range);
        let first = null;
        let last = null;

        slices.forEach((slice) => {
            const frag = slice.extractContents();
            transform(frag);
            this._normalizeInsertionPoint(slice, root);
            const f = frag.firstChild;
            if (!f) {
                return; // nothing left to insert in this block
            }
            const l = frag.lastChild;
            slice.insertNode(frag);
            if (!first) {
                first = f;
            }
            last = l;
        });

        if (first && last) {
            const selRange = document.createRange();
            selRange.setStartBefore(first);
            selRange.setEndAfter(last);
            webexpress.webui.EditorSelection.apply(selRange);
        }
    }

    /**
     * Splits a (possibly multi-block) range into sub-ranges that each lie
     * entirely within one block unit. Consecutive text nodes sharing the same
     * block form one slice; the slices containing the original boundaries are
     * clamped to them. Slices are built up front, before any mutation, and
     * stay valid while earlier slices are transformed because each one is
     * confined to its own block.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @returns {Range[]} The per-block sub-ranges, in document order.
     */
    static _sliceRangeByBlock(root, range) {
        const texts = this._textNodesInRange(range, root, false);
        const runs = [];
        let cur = null;
        texts.forEach((t) => {
            const unit = this._blockOf(t, root);
            if (cur && cur.unit === unit) {
                cur.nodes.push(t);
            } else {
                cur = { unit: unit, nodes: [t] };
                runs.push(cur);
            }
        });
        return runs.map((run) => {
            const r = document.createRange();
            const firstNode = run.nodes[0];
            const lastNode = run.nodes[run.nodes.length - 1];
            r.setStart(firstNode, 0);
            r.setEnd(lastNode, (lastNode.textContent || "").length);
            if (range.compareBoundaryPoints(Range.START_TO_START, r) > 0) {
                r.setStart(range.startContainer, range.startOffset);
            }
            if (range.compareBoundaryPoints(Range.END_TO_END, r) < 0) {
                r.setEnd(range.endContainer, range.endOffset);
            }
            this._widenToBlockEdge(r, run.unit);
            return r;
        });
    }

    /**
     * Lifts the slice boundaries to position-equivalent points directly under
     * the block unit. A boundary sitting at the very edge of an inline
     * wrapper, e.g. (text, 0) inside <b>text</b>, marks the same position as
     * the point before the wrapper, but extractContents behaves differently:
     * with the inner representation it takes the same-text-node shortcut and
     * never clones the wrapper into the fragment, so a strip transform could
     * not remove it and the reinserted content would land back inside it.
     * @param {Range} r - The slice range (mutated in place).
     * @param {HTMLElement} unit - The block unit the slice belongs to.
     * @returns {void}
     */
    static _widenToBlockEdge(r, unit) {
        let sn = r.startContainer;
        let so = r.startOffset;
        while (sn !== unit && so === 0 && sn.parentNode) {
            so = Array.prototype.indexOf.call(sn.parentNode.childNodes, sn);
            sn = sn.parentNode;
        }
        r.setStart(sn, so);

        let en = r.endContainer;
        let eo = r.endOffset;
        while (en !== unit && en.parentNode &&
            eo === (en.nodeType === Node.TEXT_NODE
                ? (en.textContent || "").length
                : en.childNodes.length)) {
            eo = Array.prototype.indexOf.call(en.parentNode.childNodes, en) + 1;
            en = en.parentNode;
        }
        r.setEnd(en, eo);
    }

    /**
     * Returns the nearest block unit containing node, or root when the node
     * lives directly under the editor root.
     * @param {Node} node - Start node.
     * @param {HTMLElement} root - Search boundary.
     * @returns {HTMLElement}
     */
    static _blockOf(node, root) {
        let el = node && node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        while (el && el !== root) {
            if (el.matches && el.matches(this.BLOCK_UNIT_SELECTOR)) {
                return el;
            }
            el = el.parentElement;
        }
        return root;
    }

    /**
     * After extraction, lifts the collapsed point out of any empty inline
     * wrapper and removes it, so reinserting content does not re-enter (and
     * thus re-apply) a wrapper whose content was just removed.
     * @param {Range} range - Collapsed range at the extraction point.
     * @param {HTMLElement} root - The editor content element.
     * @returns {void}
     */
    static _normalizeInsertionPoint(range, root) {
        let guard = 0;
        while (guard++ < 50) {
            const container = range.startContainer;
            if (container === root || container.nodeType !== Node.ELEMENT_NODE) {
                break;
            }
            if (!this._isInlineFormatEl(container) || !this._isEffectivelyEmpty(container)) {
                break;
            }
            const parent = container.parentNode;
            if (!parent) {
                break;
            }
            const index = Array.prototype.indexOf.call(parent.childNodes, container);
            parent.removeChild(container);
            range.setStart(parent, index);
            range.collapse(true);
        }
    }

    /**
     * Wraps every bare (not yet formatted) text node of the fragment in the
     * spec's tag. Mutually exclusive opposites are stripped first.
     * @param {DocumentFragment} frag - The fragment to format.
     * @param {object} spec - Toggle spec.
     * @returns {void}
     */
    static _wrapBareTextInFrag(frag, spec) {
        if (spec.opposite) {
            this._unwrapAll(frag, this._spec(spec.opposite).selector);
        }
        const texts = this._textNodesInScope(frag, false);
        texts.forEach((t) => {
            if (this._closestWithin(t, spec.selector, frag)) {
                return; // already formatted
            }
            const wrapper = document.createElement(spec.tag);
            t.parentNode.insertBefore(wrapper, t);
            wrapper.appendChild(t);
        });
    }

    /**
     * Wraps every text node of the fragment in a span carrying the given CSS
     * property, clearing the same property on existing descendants first.
     * @param {DocumentFragment} frag - The fragment to style.
     * @param {object} spec - Style spec.
     * @param {string} value - CSS value.
     * @returns {void}
     */
    static _wrapStyleInFrag(frag, spec, value) {
        frag.querySelectorAll("*").forEach((el) => {
            if (this._isAtomicEl(el)) {
                return;
            }
            try {
                el.style[spec.prop] = "";
            } catch (e) {
                /* noop */
            }
        });
        const texts = this._textNodesInScope(frag, false);
        texts.forEach((t) => {
            const span = document.createElement("span");
            span.style[spec.prop] = value;
            t.parentNode.insertBefore(span, t);
            span.appendChild(t);
        });
    }

    /**
     * Strips a single toggle format from the fragment (unwrap matching tags and
     * clear matching inline style properties).
     * @param {DocumentFragment} frag - The fragment to clean.
     * @param {object} spec - Toggle spec.
     * @returns {void}
     */
    static _stripFormatInFrag(frag, spec) {
        this._unwrapAll(frag, spec.selector);
        if (spec.styleProps) {
            frag.querySelectorAll("*").forEach((el) => {
                if (this._isAtomicEl(el)) {
                    return;
                }
                spec.styleProps.forEach((p) => {
                    try {
                        el.style[p] = "";
                    } catch (e) {
                        /* noop */
                    }
                });
            });
        }
    }

    /**
     * Removes all inline formatting from the fragment, keeping anchors and
     * non-editable atomics intact.
     * @param {DocumentFragment} frag - The fragment to clean.
     * @returns {void}
     */
    static _stripAllInlineInFrag(frag) {
        frag.querySelectorAll(this.INLINE_FORMAT_SELECTOR).forEach((el) => {
            if (this._isAtomicEl(el) || el.tagName === "A") {
                return;
            }
            this._unwrap(el);
        });
    }

    /**
     * Returns true when every non-whitespace text node of the selection carries
     * the toggle format.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @param {object} spec - Toggle spec.
     * @returns {boolean}
     */
    static _isRangeFormatted(root, range, spec) {
        const texts = this._textNodesInRange(range, root, true);
        if (texts.length === 0) {
            return false;
        }
        for (const t of texts) {
            if (!this._nodeHasFormat(t, spec, root)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns true when node sits inside the toggle format (matching ancestor
     * or matching computed style).
     * @param {Node} node - Text node.
     * @param {object} spec - Toggle spec.
     * @param {Node} boundary - Search boundary.
     * @returns {boolean}
     */
    static _nodeHasFormat(node, spec, boundary) {
        if (spec.selector && this._closestWithin(node, spec.selector, boundary)) {
            return true;
        }
        if (spec.probe) {
            const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
            if (el) {
                try {
                    return !!spec.probe(window.getComputedStyle(el));
                } catch (e) {
                    return false;
                }
            }
        }
        return false;
    }

    /**
     * Collects text nodes intersecting range, skipping empties, atomics and
     * (optionally) whitespace-only nodes.
     * @param {Range} range - The selection range.
     * @param {Node} root - Search root.
     * @param {boolean} skipWhitespace - Skip whitespace-only nodes.
     * @returns {Text[]}
     */
    static _textNodesInRange(range, root, skipWhitespace) {
        const out = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let n;
        while ((n = walker.nextNode())) {
            if (!range.intersectsNode(n)) {
                continue;
            }
            if (!this._acceptText(n, root, skipWhitespace)) {
                continue;
            }
            out.push(n);
        }
        return out;
    }

    /**
     * Collects all text nodes within a scope, skipping empties, atomics and
     * (optionally) whitespace-only nodes.
     * @param {Node} scope - Root node or fragment.
     * @param {boolean} skipWhitespace - Skip whitespace-only nodes.
     * @returns {Text[]}
     */
    static _textNodesInScope(scope, skipWhitespace) {
        const out = [];
        const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
        let n;
        while ((n = walker.nextNode())) {
            if (!this._acceptText(n, scope, skipWhitespace)) {
                continue;
            }
            out.push(n);
        }
        return out;
    }

    /**
     * Shared text-node filter.
     * @param {Text} n - Text node.
     * @param {Node} boundary - Search boundary.
     * @param {boolean} skipWhitespace - Skip whitespace-only nodes.
     * @returns {boolean}
     */
    static _acceptText(n, boundary, skipWhitespace) {
        const txt = n.textContent || "";
        if (txt.length === 0) {
            return false;
        }
        if (skipWhitespace && txt.trim() === "") {
            return false;
        }
        return !this._closestWithin(n, '[contenteditable="false"]', boundary);
    }

    /**
     * Walks up from node to (but not including) boundary and returns the first
     * ancestor matching selector.
     * @param {Node} node - Start node.
     * @param {string} selector - CSS selector.
     * @param {Node} boundary - Search boundary.
     * @returns {HTMLElement|null}
     */
    static _closestWithin(node, selector, boundary) {
        let el = node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
        while (el && el !== boundary) {
            if (el.nodeType === Node.ELEMENT_NODE && el.matches && el.matches(selector)) {
                return el;
            }
            el = el.parentNode;
        }
        return null;
    }

    /**
     * Unwraps every element matching selector within scope (replaces the
     * element with its children).
     * @param {Node} scope - Root node or fragment.
     * @param {string} selector - CSS selector.
     * @returns {void}
     */
    static _unwrapAll(scope, selector) {
        scope.querySelectorAll(selector).forEach((el) => {
            if (this._isAtomicEl(el)) {
                return;
            }
            this._unwrap(el);
        });
    }

    /**
     * Replaces an element with its child nodes.
     * @param {HTMLElement} el - Element to unwrap.
     * @returns {void}
     */
    static _unwrap(el) {
        const parent = el.parentNode;
        if (!parent) {
            return;
        }
        while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
    }

    /**
     * Removes empty inline formatting wrappers from root, never touching the
     * one that currently hosts the caret.
     * @param {HTMLElement} root - The editor content element.
     * @returns {void}
     */
    static _cleanupEmptyWrappers(root) {
        const sel = window.getSelection();
        const caret = sel && sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
        root.querySelectorAll(this.INLINE_FORMAT_SELECTOR).forEach((el) => {
            if (this._isAtomicEl(el)) {
                return;
            }
            if (caret && el.contains(caret)) {
                return;
            }
            if ((el.textContent || "").trim() !== "") {
                return;
            }
            if (el.querySelector("img,hr,br,[contenteditable='false']")) {
                return;
            }
            this._unwrap(el);
        });
    }

    /**
     * Returns true when el is a non-editable atomic (contenteditable="false",
     * IMG or HR).
     * @param {Node} el - Element to test.
     * @returns {boolean}
     */
    static _isAtomicEl(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }
        if (el.getAttribute("contenteditable") === "false") {
            return true;
        }
        return el.tagName === "IMG" || el.tagName === "HR";
    }

    /**
     * Returns true when el is a non-atomic inline formatting wrapper.
     * @param {Node} el - Element to test.
     * @returns {boolean}
     */
    static _isInlineFormatEl(el) {
        return !!el &&
            el.nodeType === Node.ELEMENT_NODE &&
            !!el.matches &&
            el.matches(this.INLINE_FORMAT_SELECTOR) &&
            !this._isAtomicEl(el);
    }

    /**
     * Returns true when el has no visible content (no non-whitespace text and
     * no atomic/line-break child).
     * @param {HTMLElement} el - Element to test.
     * @returns {boolean}
     */
    static _isEffectivelyEmpty(el) {
        if ((el.textContent || "").trim() !== "") {
            return false;
        }
        return !el.querySelector("img,hr,br,[contenteditable='false']");
    }
};

/**
 * Block-level command engine. Stateless: every method takes the owning editor
 * and reads the live selection itself.
 */
webexpress.webui.EditorBlocks = class {

    /** Block elements that formatBlock / alignment may target. */
    static BLOCK_SELECTOR = "p,h1,h2,h3,h4,h5,h6,blockquote,pre,div";

    /** Tags allowed as a formatBlock target. */
    static FORMAT_BLOCK_TAGS = new Set([
        "p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "div"
    ]);

    /**
     * Returns true when this engine owns the given command.
     * @param {string} command - Command name (any case).
     * @returns {boolean}
     */
    static handles(command) {
        const cmd = (command || "").toLowerCase();
        return cmd === "formatblock" ||
            cmd === "justifyleft" || cmd === "justifycenter" ||
            cmd === "justifyright" || cmd === "justifyfull" ||
            cmd === "createlink" ||
            cmd === "inserthorizontalrule" ||
            cmd === "inserttext";
    }

    /**
     * Executes a block command against the editor's current selection.
     * @param {webexpress.webui.EditorCtrl} editor - The editor instance.
     * @param {string} command - Command name.
     * @param {*} value - Optional value.
     * @returns {boolean} True when handled.
     */
    static exec(editor, command, value) {
        const cmd = (command || "").toLowerCase();
        const root = editor.getEditorElement();
        if (!root) {
            return true;
        }

        if (cmd === "inserthorizontalrule") {
            // insertHtmlAtCursor handles caret, save and sync itself
            editor.insertHtmlAtCursor("<hr><p><br></p>");
            return true;
        }

        const range = webexpress.webui.EditorSelection.getRange(root);
        if (!range) {
            return true;
        }

        if (cmd === "formatblock") {
            this._formatBlock(root, range, value);
        } else if (cmd === "justifyleft") {
            this._align(root, range, "left");
        } else if (cmd === "justifycenter") {
            this._align(root, range, "center");
        } else if (cmd === "justifyright") {
            this._align(root, range, "right");
        } else if (cmd === "justifyfull") {
            this._align(root, range, "justify");
        } else if (cmd === "createlink") {
            this._createLink(root, range, value);
        } else if (cmd === "inserttext") {
            this._insertText(root, range, value);
        } else {
            return true;
        }

        editor._saveCurrentSelection();
        editor._syncValue();
        editor._updateUndoRedoStates();
        return true;
    }

    /**
     * Changes the block type of every block touched by the selection. Accepts
     * both "p" and "<p>" style arguments.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @param {string} value - Target tag.
     * @returns {void}
     */
    static _formatBlock(root, range, value) {
        const tag = (value || "p").replace(/[<>]/g, "").trim().toLowerCase() || "p";
        if (!this.FORMAT_BLOCK_TAGS.has(tag)) {
            return;
        }

        const blocks = this._selectedBlocks(root, range);
        if (!blocks.length) {
            return;
        }

        const collapsed = range.collapsed;
        if (collapsed) {
            range.insertNode(webexpress.webui.EditorSelection.createMarker());
        }

        const newBlocks = [];
        blocks.forEach((b) => {
            const nb = document.createElement(tag);
            const style = b.getAttribute("style");
            if (style) {
                nb.setAttribute("style", style);
            }
            while (b.firstChild) {
                nb.appendChild(b.firstChild);
            }
            if (b.parentNode) {
                b.parentNode.replaceChild(nb, b);
            }
            newBlocks.push(nb);
        });

        if (collapsed) {
            webexpress.webui.EditorSelection.placeCaretAtMarker(root);
        } else if (newBlocks.length) {
            const r = document.createRange();
            r.setStart(newBlocks[0], 0);
            const last = newBlocks[newBlocks.length - 1];
            r.setEnd(last, last.childNodes.length);
            webexpress.webui.EditorSelection.apply(r);
        }
    }

    /**
     * Sets text-align on every block touched by the selection. The formatting
     * plugin already reads alignment from the computed style, so no extra
     * state is needed.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @param {string} value - "left" | "center" | "right" | "justify".
     * @returns {void}
     */
    static _align(root, range, value) {
        this._alignTargets(root, range).forEach((b) => {
            b.style.textAlign = value;
        });
    }

    /**
     * Collects the elements that alignment should target. Unlike _selectedBlocks
     * this also returns list items (<li>) so text in a bullet/numbered list can
     * be aligned, which _nearestBlock deliberately skips for formatBlock.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @returns {HTMLElement[]}
     */
    static _alignTargets(root, range) {
        const set = new Set();
        const add = (node) => {
            let el = node && node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
            if (!el || !el.closest) {
                return;
            }
            if (el.closest('[contenteditable="false"]')) {
                return;
            }
            const li = el.closest("li");
            if (li && root.contains(li)) {
                set.add(li);
                return;
            }
            const b = this._nearestBlock(node, root);
            if (b) {
                set.add(b);
            }
        };
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let n;
        while ((n = walker.nextNode())) {
            if (range.intersectsNode(n)) {
                add(n);
            }
        }
        if (set.size === 0) {
            add(range.startContainer);
        }
        return Array.from(set);
    }

    /**
     * Wraps the selection in an anchor, or inserts the URL as a link at a
     * collapsed caret. Existing anchors in the selection are unwrapped first to
     * avoid nesting.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @param {string} value - The href.
     * @returns {void}
     */
    static _createLink(root, range, value) {
        const url = value == null ? "" : String(value).trim();
        if (!url) {
            return;
        }

        if (range.collapsed) {
            const a = document.createElement("a");
            a.setAttribute("href", url);
            a.textContent = url;
            range.insertNode(a);
            const r = document.createRange();
            r.setStartAfter(a);
            r.collapse(true);
            webexpress.webui.EditorSelection.apply(r);
            return;
        }

        const frag = range.extractContents();
        frag.querySelectorAll("a").forEach((el) => {
            const p = el.parentNode;
            if (!p) {
                return;
            }
            while (el.firstChild) {
                p.insertBefore(el.firstChild, el);
            }
            p.removeChild(el);
        });

        const a = document.createElement("a");
        a.setAttribute("href", url);
        a.appendChild(frag);
        range.insertNode(a);

        const r = document.createRange();
        r.setStartBefore(a);
        r.setEndAfter(a);
        webexpress.webui.EditorSelection.apply(r);
    }

    /**
     * Replaces the selection with a plain text node (used e.g. for emoji).
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @param {string} value - The text to insert.
     * @returns {void}
     */
    static _insertText(root, range, value) {
        const text = value == null ? "" : String(value);
        range.deleteContents();
        const node = document.createTextNode(text);
        range.insertNode(node);
        const r = document.createRange();
        r.setStartAfter(node);
        r.collapse(true);
        webexpress.webui.EditorSelection.apply(r);
    }

    /**
     * Returns the unique blocks that the selection touches.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @returns {HTMLElement[]}
     */
    static _selectedBlocks(root, range) {
        const set = new Set();
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let n;
        while ((n = walker.nextNode())) {
            if (!range.intersectsNode(n)) {
                continue;
            }
            const b = this._nearestBlock(n, root);
            if (b) {
                set.add(b);
            }
        }
        if (set.size === 0) {
            const b = this._nearestBlock(range.startContainer, root);
            if (b) {
                set.add(b);
            }
        }
        return Array.from(set);
    }

    /**
     * Returns the nearest block ancestor of node, or null when it is inside a
     * list item or a non-editable frame (those must not be reformatted).
     * @param {Node} node - Start node.
     * @param {HTMLElement} root - Search boundary.
     * @returns {HTMLElement|null}
     */
    static _nearestBlock(node, root) {
        let el = node && node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        while (el && el !== root) {
            if (el.nodeType === Node.ELEMENT_NODE && el.matches && el.matches(this.BLOCK_SELECTOR)) {
                if (el.closest("li") || el.closest('[contenteditable="false"]')) {
                    return null;
                }
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }
};

/**
 * Per-editor state for collapsed-caret inline formatting. When a toggle/style
 * command runs with no selection, the format is remembered; the next typed
 * text is then wrapped in the remembered formatting. This replaces the native
 * execCommand type-through.
 */
webexpress.webui.EditorPendingFormat = class {

    /** Characters that pass through unwrapped so other plugins keep working. */
    static SKIP_CHARS = new Set([" ", "@", "[", "{", "/"]);

    /**
     * @param {webexpress.webui.EditorCtrl} editor - The owning editor instance.
     */
    constructor(editor) {
        this._editor = editor;
        this._toggles = new Set();   // lower-case command names
        this._styles = new Map();    // CSS property -> value
        this._anchorNode = null;
        this._anchorOffset = 0;
        this._attach();
    }

    /**
     * Binds the input and selectionchange listeners.
     * @returns {void}
     */
    _attach() {
        const el = this._editor.getEditorElement();
        if (!el) {
            return;
        }
        el.addEventListener("input", (e) => this._onInput(e));
        document.addEventListener("selectionchange", () => this._onSelectionChange());
    }

    /**
     * Returns true when any format is pending.
     * @returns {boolean}
     */
    has() {
        return this._toggles.size > 0 || this._styles.size > 0;
    }

    /**
     * Clears the pending state.
     * @returns {void}
     */
    clear() {
        this._toggles.clear();
        this._styles.clear();
        this._anchorNode = null;
    }

    /**
     * Flips a pending toggle command.
     * @param {string} command - Toggle command name.
     * @returns {void}
     */
    toggle(command) {
        const cmd = command.toLowerCase();
        this._captureAnchor();
        if (this._toggles.has(cmd)) {
            this._toggles.delete(cmd);
        } else {
            this._toggles.add(cmd);
        }
    }

    /**
     * Sets a pending style property.
     * @param {string} prop - CSS property (camelCase).
     * @param {string} value - CSS value.
     * @returns {void}
     */
    setStyle(prop, value) {
        this._captureAnchor();
        this._styles.set(prop, value);
    }

    /**
     * Returns whether a toggle command is currently pending (used by queryState
     * for the active button display at a collapsed caret).
     * @param {string} command - Toggle command name.
     * @returns {boolean}
     */
    state(command) {
        return this._toggles.has(command.toLowerCase());
    }

    /**
     * Records the caret position so pending state can be dropped when the caret
     * moves away.
     * @returns {void}
     */
    _captureAnchor() {
        const r = webexpress.webui.EditorSelection.getRange(this._editor.getEditorElement());
        if (r) {
            this._anchorNode = r.startContainer;
            this._anchorOffset = r.startOffset;
        }
    }

    /**
     * Drops pending state when the selection is no longer the collapsed caret
     * it was captured at.
     * @returns {void}
     */
    _onSelectionChange() {
        if (!this.has()) {
            return;
        }
        const root = this._editor.getEditorElement();
        const r = webexpress.webui.EditorSelection.getRange(root);
        if (!r || !r.collapsed) {
            this.clear();
            return;
        }
        if (r.startContainer !== this._anchorNode || r.startOffset !== this._anchorOffset) {
            this.clear();
        }
    }

    /**
     * Wraps the just-typed text in the pending formatting.
     * @param {InputEvent} e - The input event.
     * @returns {void}
     */
    _onInput(e) {
        if (!this.has()) {
            return;
        }
        if (e.inputType !== "insertText") {
            this.clear();
            return;
        }
        const data = e.data;
        if (!data) {
            this.clear();
            return;
        }
        if (data.length === 1 && webexpress.webui.EditorPendingFormat.SKIP_CHARS.has(data)) {
            return; // keep pending; let other plugins handle this character
        }
        this._applyToInserted(data);
    }

    /**
     * Extracts the freshly inserted text, wraps it in the pending formatting and
     * places the caret inside the innermost wrapper so continued typing stays
     * formatted. Pending state is then cleared.
     * @param {string} data - The inserted text.
     * @returns {void}
     */
    _applyToInserted(data) {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) {
            this.clear();
            return;
        }
        const r = sel.getRangeAt(0);
        const node = r.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) {
            this.clear();
            return;
        }
        const end = r.startOffset;
        const start = end - data.length;
        if (start < 0) {
            this.clear();
            return;
        }

        const target = document.createRange();
        target.setStart(node, start);
        target.setEnd(node, end);
        const frag = target.extractContents();
        const wrapper = this._buildWrapper(frag);
        target.insertNode(wrapper);

        const inner = this._innermost(wrapper);
        const cr = document.createRange();
        cr.selectNodeContents(inner);
        cr.collapse(false);
        webexpress.webui.EditorSelection.apply(cr);

        this._editor._saveCurrentSelection();
        this._editor._syncValue();
        this.clear();
    }

    /**
     * Builds the nested wrapper element chain for the pending formats and puts
     * the fragment inside the innermost one.
     * @param {DocumentFragment} frag - The text fragment to wrap.
     * @returns {HTMLElement} The outermost wrapper.
     */
    _buildWrapper(frag) {
        const els = [];
        this._toggles.forEach((cmd) => {
            const spec = webexpress.webui.EditorFormat._spec(cmd);
            if (spec && spec.tag) {
                els.push(document.createElement(spec.tag));
            }
        });
        if (this._styles.size) {
            const span = document.createElement("span");
            this._styles.forEach((v, p) => {
                span.style[p] = v;
            });
            els.push(span);
        }
        if (els.length === 0) {
            els.push(document.createElement("span"));
        }
        for (let i = 1; i < els.length; i++) {
            els[i - 1].appendChild(els[i]);
        }
        els[els.length - 1].appendChild(frag);
        return els[0];
    }

    /**
     * Returns the innermost element of a wrapper chain.
     * @param {HTMLElement} el - The outermost wrapper.
     * @returns {HTMLElement}
     */
    _innermost(el) {
        let cur = el;
        while (cur.firstElementChild) {
            cur = cur.firstElementChild;
        }
        return cur;
    }
};

/**
 * Format painter ("apply formatting of a selection"). Captures the inline
 * formatting at the current selection when armed and applies it to the next
 * selection made in the editor. A plain source selection (no formatting)
 * makes the painter act like removeFormat, mirroring Word's behaviour.
 */
webexpress.webui.EditorPainter = class {

    /** Css class set on the content element while the painter is armed. */
    static ACTIVE_CLASS = "wx-editor-painting";

    /**
     * @param {webexpress.webui.EditorCtrl} editor - The owning editor instance.
     */
    constructor(editor) {
        this._editor = editor;
        this._chain = null; // captured wrapper descriptors, outermost first
        this._onMouseUp = (e) => this._handleMouseUp(e);
        this._onKeyDown = (e) => this._handleKeyDown(e);
    }

    /**
     * Returns whether the painter is armed.
     * @returns {boolean}
     */
    isActive() {
        return this._chain !== null;
    }

    /**
     * Arms the painter with the formatting of the current selection, or
     * disarms it when already armed.
     * @returns {void}
     */
    toggle() {
        if (this.isActive()) {
            this.cancel();
        } else {
            this.capture();
        }
    }

    /**
     * Captures the inline formatting at the current selection and arms the
     * painter.
     * @returns {boolean} True when a selection was available.
     */
    capture() {
        const root = this._editor.getEditorElement();
        const range = webexpress.webui.EditorSelection.getRange(root);
        if (!root || !range) {
            return false;
        }
        const Format = webexpress.webui.EditorFormat;
        let node = range.startContainer;
        if (!range.collapsed) {
            // prefer the first real text node so a boundary that starts just
            // outside a wrapper still captures the visible formatting
            const texts = Format._textNodesInRange(range, root, true);
            if (texts.length) {
                node = texts[0];
            }
        }
        this._chain = this._collectChain(node, root);
        this._setActive(true);
        return true;
    }

    /**
     * Disarms the painter and discards the captured formatting.
     * @returns {void}
     */
    cancel() {
        this._chain = null;
        this._setActive(false);
    }

    /**
     * Collects the inline format wrappers around node, outermost first,
     * stopping at the surrounding block.
     * @param {Node} node - The capture position.
     * @param {HTMLElement} root - The editor content element.
     * @returns {{tag:string, style:string}[]}
     */
    _collectChain(node, root) {
        const Format = webexpress.webui.EditorFormat;
        const chain = [];
        let el = node && node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        while (el && el !== root) {
            if (el.matches && el.matches(webexpress.webui.EditorBlocks.BLOCK_SELECTOR + ",li,td,th")) {
                break;
            }
            if (Format._isInlineFormatEl(el)) {
                chain.unshift({
                    tag: el.tagName.toLowerCase(),
                    style: el.getAttribute("style") || ""
                });
            }
            el = el.parentElement;
        }
        return chain;
    }

    /**
     * Toggles the armed state: visual feedback on the content element, the
     * apply/cancel listeners and the toolbar button highlight.
     * @param {boolean} active - The new state.
     * @returns {void}
     */
    _setActive(active) {
        const root = this._editor.getEditorElement();
        if (root) {
            root.classList.toggle(webexpress.webui.EditorPainter.ACTIVE_CLASS, active);
        }
        if (active) {
            document.addEventListener("mouseup", this._onMouseUp, true);
            document.addEventListener("keydown", this._onKeyDown, true);
        } else {
            document.removeEventListener("mouseup", this._onMouseUp, true);
            document.removeEventListener("keydown", this._onKeyDown, true);
        }
        this._refreshButton(active);
    }

    /**
     * Reflects the armed state on the toolbar button.
     * @param {boolean} active - The armed state.
     * @returns {void}
     */
    _refreshButton(active) {
        const host = this._editor._uiContainer;
        const btn = host && host.querySelector('button[data-command="formatpainter"]');
        if (btn) {
            btn.classList.toggle("active", active);
        }
    }

    /**
     * Applies the captured formatting once a selection is finished inside the
     * editor content. Mouseups elsewhere (toolbar, dialogs) are ignored so the
     * armed state survives them.
     * @param {MouseEvent} e - The mouseup event.
     * @returns {void}
     */
    _handleMouseUp(e) {
        const root = this._editor.getEditorElement();
        if (!root || !root.contains(e.target)) {
            return;
        }
        // defer until the browser has finalized the selection for this mouseup
        setTimeout(() => this._applyToCurrentSelection(), 0);
    }

    /**
     * Disarms the painter on Escape.
     * @param {KeyboardEvent} e - The keydown event.
     * @returns {void}
     */
    _handleKeyDown(e) {
        if (e.key === "Escape") {
            this.cancel();
        }
    }

    /**
     * Applies the captured chain to the current selection and disarms the
     * painter. A simple click (collapsed selection) consumes the painter
     * without applying anything.
     * @returns {void}
     */
    _applyToCurrentSelection() {
        if (!this.isActive()) {
            return;
        }
        const root = this._editor.getEditorElement();
        const range = webexpress.webui.EditorSelection.getRange(root);
        const chain = this._chain;
        this.cancel();
        if (!range || range.collapsed) {
            return;
        }
        webexpress.webui.EditorFormat.applyChain(this._editor, range, chain);
    }
};

/**
 * List and indentation command engine. Stateless: every method takes the
 * owning editor and reads the live selection itself.
 */
webexpress.webui.EditorList = class {

    /** Blocks that can become list items or carry an indent margin. */
    static BLOCK_SELECTOR = "p,h1,h2,h3,h4,h5,h6,blockquote,pre,div";

    /** Indent step (px) applied to plain blocks. */
    static INDENT_STEP = 40;

    /**
     * Returns true when this engine owns the given command.
     * @param {string} command - Command name (any case).
     * @returns {boolean}
     */
    static handles(command) {
        const c = (command || "").toLowerCase();
        return c === "insertunorderedlist" || c === "insertorderedlist" ||
            c === "indent" || c === "outdent";
    }

    /**
     * Executes a list/indent command against the editor's current selection.
     * @param {webexpress.webui.EditorCtrl} editor - The editor instance.
     * @param {string} command - Command name.
     * @param {*} value - Unused.
     * @returns {boolean} True when handled.
     */
    static exec(editor, command, value) {
        const cmd = (command || "").toLowerCase();
        const root = editor.getEditorElement();
        if (!root) {
            return true;
        }
        const range = webexpress.webui.EditorSelection.getRange(root);
        if (!range) {
            return true;
        }

        if (cmd === "insertunorderedlist") {
            this._toggleList(root, range, "ul");
        } else if (cmd === "insertorderedlist") {
            this._toggleList(root, range, "ol");
        } else if (cmd === "indent") {
            this._indent(root, range);
        } else if (cmd === "outdent") {
            this._outdent(root, range);
        } else {
            return true;
        }

        editor._saveCurrentSelection();
        editor._syncValue();
        editor._updateUndoRedoStates();
        return true;
    }

    /**
     * Returns whether the caret sits in a list of the requested type.
     * indent/outdent have no active state.
     * @param {webexpress.webui.EditorCtrl} editor - The editor instance.
     * @param {string} command - Command name.
     * @returns {boolean}
     */
    static queryState(editor, command) {
        const cmd = (command || "").toLowerCase();
        const tag = cmd === "insertunorderedlist" ? "UL"
            : cmd === "insertorderedlist" ? "OL" : null;
        if (!tag) {
            return false;
        }
        const root = editor.getEditorElement();
        const range = webexpress.webui.EditorSelection.getRange(root);
        if (!range) {
            return false;
        }
        let el = range.startContainer;
        el = el.nodeType === Node.TEXT_NODE ? el.parentElement : el;
        if (!el || !root.contains(el)) {
            return false;
        }
        const li = el.closest("li");
        if (!li || !root.contains(li)) {
            return false;
        }
        const list = li.parentElement;
        return !!list && list.tagName === tag;
    }

    /**
     * Toggles the list state of the selection: create, remove (same type) or
     * switch type (other type).
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @param {string} listTag - "ul" or "ol".
     * @returns {void}
     */
    static _toggleList(root, range, listTag) {
        const units = this._collectUnits(root, range);
        if (!units.length) {
            return;
        }

        const marked = webexpress.webui.EditorSelection.markRange(range);

        const allLi = units.every((u) => u.tagName === "LI");
        if (allLi) {
            const sameType = units.every((u) =>
                u.parentElement && u.parentElement.tagName.toLowerCase() === listTag);
            if (sameType) {
                this._unlist(units);
            } else {
                this._switchType(units, listTag);
            }
        } else {
            this._makeList(units, listTag);
        }

        if (marked) {
            webexpress.webui.EditorSelection.restoreRange(root);
        }
    }

    /**
     * Converts plain blocks of the selection into list items.
     * @param {HTMLElement[]} units - Selected units.
     * @param {string} listTag - "ul" or "ol".
     * @returns {void}
     */
    static _makeList(units, listTag) {
        const blocks = units.filter((u) => u.tagName !== "LI");
        if (!blocks.length) {
            return;
        }
        this._groupConsecutive(blocks).forEach((run) => this._listifyRun(run, listTag));
    }

    /**
     * Wraps a run of adjacent blocks into a single list, reusing/merging with
     * adjacent same-type lists.
     * @param {HTMLElement[]} run - Adjacent sibling blocks.
     * @param {string} listTag - "ul" or "ol".
     * @returns {void}
     */
    static _listifyRun(run, listTag) {
        const first = run[0];
        const parent = first.parentElement;
        if (!parent) {
            return;
        }

        let list;
        const before = first.previousElementSibling;
        if (before && before.tagName.toLowerCase() === listTag) {
            list = before;
        } else {
            list = document.createElement(listTag);
            parent.insertBefore(list, first);
        }

        run.forEach((block) => {
            const li = document.createElement("li");
            const style = block.getAttribute("style");
            if (style) {
                li.setAttribute("style", style);
            }
            while (block.firstChild) {
                li.appendChild(block.firstChild);
            }
            list.appendChild(li);
            block.remove();
        });

        const after = list.nextElementSibling;
        if (after && after.tagName.toLowerCase() === listTag) {
            while (after.firstChild) {
                list.appendChild(after.firstChild);
            }
            after.remove();
        }
    }

    /**
     * Converts selected list items back into paragraphs, splitting their list.
     * @param {HTMLElement[]} units - Selected list items.
     * @returns {void}
     */
    static _unlist(units) {
        this._groupConsecutive(units).forEach((run) => this._unlistRun(run));
    }

    /**
     * Lifts a contiguous run of list items out of its list as paragraphs.
     * @param {HTMLElement[]} run - Adjacent list items in one list.
     * @returns {void}
     */
    static _unlistRun(run) {
        const list = run[0].parentElement;
        const parent = list.parentElement;
        if (!parent) {
            return;
        }

        const tail = this._siblingsAfter(run[run.length - 1]);
        const paras = run.map((li) => {
            const p = document.createElement("p");
            const style = li.getAttribute("style");
            if (style) {
                p.setAttribute("style", style);
            }
            while (li.firstChild) {
                p.appendChild(li.firstChild);
            }
            return p;
        });

        let tailList = null;
        if (tail.length) {
            tailList = document.createElement(list.tagName.toLowerCase());
            tail.forEach((it) => tailList.appendChild(it));
        }

        run.forEach((li) => li.remove());

        const ref = list.nextSibling;
        paras.forEach((p) => parent.insertBefore(p, ref));
        if (tailList) {
            parent.insertBefore(tailList, ref);
        }
        if (list.children.length === 0) {
            list.remove();
        }
    }

    /**
     * Switches the type (ul/ol) of selected list items.
     * @param {HTMLElement[]} units - Selected list items.
     * @param {string} listTag - Target list tag.
     * @returns {void}
     */
    static _switchType(units, listTag) {
        this._groupConsecutive(units).forEach((run) => this._switchRun(run, listTag));
    }

    /**
     * Switches the type of a contiguous run, splitting the list when only part
     * of it is selected.
     * @param {HTMLElement[]} run - Adjacent list items in one list.
     * @param {string} listTag - Target list tag.
     * @returns {void}
     */
    static _switchRun(run, listTag) {
        const list = run[0].parentElement;
        const parent = list.parentElement;
        if (!parent) {
            return;
        }

        if (run.length === list.children.length) {
            const nl = document.createElement(listTag);
            const style = list.getAttribute("style");
            if (style) {
                nl.setAttribute("style", style);
            }
            while (list.firstChild) {
                nl.appendChild(list.firstChild);
            }
            parent.replaceChild(nl, list);
            return;
        }

        const tail = this._siblingsAfter(run[run.length - 1]);
        const midList = document.createElement(listTag);
        run.forEach((li) => midList.appendChild(li));

        let tailList = null;
        if (tail.length) {
            tailList = document.createElement(list.tagName.toLowerCase());
            tail.forEach((it) => tailList.appendChild(it));
        }

        const ref = list.nextSibling;
        parent.insertBefore(midList, ref);
        if (tailList) {
            parent.insertBefore(tailList, ref);
        }
        if (list.children.length === 0) {
            list.remove();
        }
    }

    /**
     * Indents the selection: nests list items, steps the margin of plain blocks.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @returns {void}
     */
    static _indent(root, range) {
        const units = this._collectUnits(root, range);
        if (!units.length) {
            return;
        }
        const marked = webexpress.webui.EditorSelection.markRange(range);

        const items = units.filter((u) => u.tagName === "LI");
        const blocks = units.filter((u) => u.tagName !== "LI");
        this._groupConsecutive(items).forEach((run) => this._indentRun(run));
        blocks.forEach((b) => this._adjustIndent(b, 1));

        if (marked) {
            webexpress.webui.EditorSelection.restoreRange(root);
        }
    }

    /**
     * Outdents the selection: denests list items (or unlists top-level ones),
     * steps the margin of plain blocks back.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @returns {void}
     */
    static _outdent(root, range) {
        const units = this._collectUnits(root, range);
        if (!units.length) {
            return;
        }
        const marked = webexpress.webui.EditorSelection.markRange(range);

        const items = units.filter((u) => u.tagName === "LI");
        const blocks = units.filter((u) => u.tagName !== "LI");
        this._groupConsecutive(items).forEach((run) => this._outdentRun(run));
        blocks.forEach((b) => this._adjustIndent(b, -1));

        if (marked) {
            webexpress.webui.EditorSelection.restoreRange(root);
        }
    }

    /**
     * Nests a run of items under the preceding sibling item's sublist.
     * @param {HTMLElement[]} run - Adjacent list items.
     * @returns {void}
     */
    static _indentRun(run) {
        const first = run[0];
        const prev = first.previousElementSibling;
        if (!prev || prev.tagName !== "LI") {
            // nesting is impossible (no preceding item, e.g. the first/only
            // item) - indent the item(s) via a left margin instead so the
            // indent command still does something visible.
            run.forEach((li) => this._adjustIndent(li, 1));
            return;
        }
        const listTag = first.parentElement.tagName.toLowerCase();
        let sub = prev.lastElementChild;
        if (!sub || (sub.tagName !== "UL" && sub.tagName !== "OL")) {
            sub = document.createElement(listTag);
            prev.appendChild(sub);
        }
        run.forEach((li) => sub.appendChild(li));
    }

    /**
     * Denests a run of items one level, or unlists it when already at top level.
     * @param {HTMLElement[]} run - Adjacent list items.
     * @returns {void}
     */
    static _outdentRun(run) {
        // step a margin indent back first (mirrors the _indentRun fallback)
        const firstMargin = parseInt(run[0].style.marginLeft, 10) || 0;
        if (firstMargin > 0) {
            run.forEach((li) => this._adjustIndent(li, -1));
            return;
        }

        const list = run[0].parentElement;
        const parentLi = list.parentElement && list.parentElement.tagName === "LI"
            ? list.parentElement : null;

        if (!parentLi) {
            this._unlistRun(run);
            return;
        }

        const grandList = parentLi.parentElement;
        const tail = this._siblingsAfter(run[run.length - 1]);
        const ref = parentLi.nextSibling;
        run.forEach((li) => grandList.insertBefore(li, ref));

        if (tail.length) {
            const sub = document.createElement(list.tagName.toLowerCase());
            tail.forEach((it) => sub.appendChild(it));
            run[run.length - 1].appendChild(sub);
        }
        if (list.children.length === 0) {
            list.remove();
        }
    }

    /**
     * Steps a block's left margin by INDENT_STEP in the given direction.
     * @param {HTMLElement} block - Block element.
     * @param {number} dir - +1 to indent, -1 to outdent.
     * @returns {void}
     */
    static _adjustIndent(block, dir) {
        const cur = parseInt(block.style.marginLeft, 10) || 0;
        let next = cur + dir * this.INDENT_STEP;
        if (next < 0) {
            next = 0;
        }
        block.style.marginLeft = next === 0 ? "" : next + "px";
    }

    /**
     * Collects the unique units the selection touches, in document order. A
     * unit is the nearest list item, or the nearest plain block.
     * @param {HTMLElement} root - The editor content element.
     * @param {Range} range - The selection range.
     * @returns {HTMLElement[]}
     */
    static _collectUnits(root, range) {
        const set = new Set();
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let n;
        while ((n = walker.nextNode())) {
            if (!range.intersectsNode(n)) {
                continue;
            }
            const u = this._unitOf(n, root);
            if (u) {
                set.add(u);
            }
        }
        if (set.size === 0) {
            const u = this._unitOf(range.startContainer, root);
            if (u) {
                set.add(u);
            }
        }
        return this._inDocOrder(Array.from(set));
    }

    /**
     * Resolves the unit for a node: its list item, or its nearest block.
     * Returns null inside non-editable frames.
     * @param {Node} node - Start node.
     * @param {HTMLElement} root - Search boundary.
     * @returns {HTMLElement|null}
     */
    static _unitOf(node, root) {
        let el = node && node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        if (!el) {
            return null;
        }
        if (el.closest && el.closest('[contenteditable="false"]')) {
            return null;
        }
        const li = el.closest ? el.closest("li") : null;
        if (li && root.contains(li)) {
            return li;
        }
        let cur = el;
        while (cur && cur !== root) {
            if (cur.nodeType === Node.ELEMENT_NODE && cur.matches && cur.matches(this.BLOCK_SELECTOR)) {
                return cur;
            }
            cur = cur.parentElement;
        }
        return null;
    }

    /**
     * Sorts elements in document order.
     * @param {HTMLElement[]} els - Elements.
     * @returns {HTMLElement[]}
     */
    static _inDocOrder(els) {
        return els.sort((a, b) => {
            if (a === b) {
                return 0;
            }
            const pos = a.compareDocumentPosition(b);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
                return -1;
            }
            if (pos & Node.DOCUMENT_POSITION_PRECEDING) {
                return 1;
            }
            return 0;
        });
    }

    /**
     * Groups elements into runs of adjacent siblings sharing one parent.
     * @param {HTMLElement[]} els - Elements in document order.
     * @returns {HTMLElement[][]}
     */
    static _groupConsecutive(els) {
        const runs = [];
        let cur = [];
        els.forEach((el) => {
            const last = cur.length ? cur[cur.length - 1] : null;
            if (last && last.parentElement === el.parentElement && last.nextElementSibling === el) {
                cur.push(el);
            } else {
                if (cur.length) {
                    runs.push(cur);
                }
                cur = [el];
            }
        });
        if (cur.length) {
            runs.push(cur);
        }
        return runs;
    }

    /**
     * Returns all element siblings after the given element.
     * @param {HTMLElement} el - Reference element.
     * @returns {HTMLElement[]}
     */
    static _siblingsAfter(el) {
        const out = [];
        let s = el.nextElementSibling;
        while (s) {
            out.push(s);
            s = s.nextElementSibling;
        }
        return out;
    }

};

/**
 * Snapshot-based undo/redo for one editor instance.
 */
webexpress.webui.EditorHistory = class {

    /** Maximum number of retained snapshots. */
    static MAX = 200;

    /** Idle time (ms) after which a typing burst is committed. */
    static TYPING_DELAY = 500;

    /**
     * @param {webexpress.webui.EditorCtrl} editor - The owning editor instance.
     */
    constructor(editor) {
        this._editor = editor;
        this._entries = [];
        this._index = -1;
        this._typingOpen = false;
        this._typingTimer = null;
        this._restoring = false;
        this._suppressBeforeInput = false;
        this._attach();
        this.reset();
    }

    /**
     * Returns the editor content element.
     * @returns {HTMLElement|null}
     */
    _el() {
        return this._editor.getEditorElement();
    }

    /**
     * Binds the undo/redo interceptors.
     * @returns {void}
     */
    _attach() {
        const el = this._el();
        if (!el) {
            return;
        }
        el.addEventListener("keydown", (e) => this._onKeyDown(e));
        el.addEventListener("beforeinput", (e) => this._onBeforeInput(e));
    }

    /**
     * Intercepts Ctrl/Cmd+Z and Ctrl/Cmd+Y / Ctrl+Shift+Z.
     * @param {KeyboardEvent} e - The keydown event.
     * @returns {void}
     */
    _onKeyDown(e) {
        if (!(e.ctrlKey || e.metaKey)) {
            return;
        }
        const k = (e.key || "").toLowerCase();
        let action = null;
        if (k === "z" && !e.shiftKey) {
            action = "undo";
        } else if (k === "y" || (k === "z" && e.shiftKey)) {
            action = "redo";
        }
        if (!action) {
            return;
        }
        e.preventDefault();
        // a prevented keydown usually stops the matching beforeinput, but guard
        // against browsers that still emit it
        this._suppressBeforeInput = true;
        setTimeout(() => {
            this._suppressBeforeInput = false;
        }, 0);
        this._run(action);
    }

    /**
     * Intercepts the native history input types (e.g. from the Edit menu).
     * @param {InputEvent} e - The beforeinput event.
     * @returns {void}
     */
    _onBeforeInput(e) {
        const t = e.inputType;
        if (t !== "historyUndo" && t !== "historyRedo") {
            return;
        }
        e.preventDefault();
        if (this._suppressBeforeInput) {
            return;
        }
        this._run(t === "historyUndo" ? "undo" : "redo");
    }

    /**
     * Runs an undo or redo and refreshes the button states.
     * @param {"undo"|"redo"} action - The action.
     * @returns {void}
     */
    _run(action) {
        if (action === "undo") {
            this.undo();
        } else {
            this.redo();
        }
        this._editor._updateUndoRedoStates();
    }

    /**
     * Resets the history to a single baseline snapshot of the current content.
     * Call once the editor's initial content is fully built.
     * @returns {void}
     */
    reset() {
        this._clearTimer();
        this._typingOpen = false;
        this._entries = [this._snapshot()];
        this._index = 0;
    }

    /**
     * Records a change. Typing is coalesced; structural changes commit at once.
     * @param {boolean} isTyping - True when the change came from native typing.
     * @returns {void}
     */
    notify(isTyping) {
        if (this._restoring) {
            return;
        }
        if (isTyping) {
            this._typingOpen = true;
            this._restartTimer();
        } else {
            this._flushTyping();
            this._commit();
        }
    }

    /**
     * @returns {boolean} Whether an undo is possible.
     */
    canUndo() {
        return this._index > 0 || this._typingOpen;
    }

    /**
     * @returns {boolean} Whether a redo is possible.
     */
    canRedo() {
        return !this._typingOpen && this._index < this._entries.length - 1;
    }

    /**
     * Undoes the last committed step.
     * @returns {void}
     */
    undo() {
        this._flushTyping();
        if (this._index <= 0) {
            return;
        }
        this._index--;
        this._restore(this._entries[this._index]);
    }

    /**
     * Redoes the next step.
     * @returns {void}
     */
    redo() {
        if (this._index >= this._entries.length - 1) {
            return;
        }
        this._index++;
        this._restore(this._entries[this._index]);
    }

    /**
     * Commits any open typing burst as its own step.
     * @returns {void}
     */
    _flushTyping() {
        this._clearTimer();
        if (this._typingOpen) {
            this._typingOpen = false;
            this._commit();
        }
    }

    /**
     * Pushes the current state as a new step, dropping any redo tail and
     * collapsing no-op changes.
     * @returns {void}
     */
    _commit() {
        const snap = this._snapshot();
        if (this._index < this._entries.length - 1) {
            this._entries.length = this._index + 1;
        }
        const top = this._entries[this._index];
        if (top && top.html === snap.html) {
            top.bookmark = snap.bookmark;
            return;
        }
        this._entries.push(snap);
        this._index++;

        const max = webexpress.webui.EditorHistory.MAX;
        if (this._entries.length > max) {
            const overflow = this._entries.length - max;
            this._entries.splice(0, overflow);
            this._index -= overflow;
        }
    }

    /**
     * Captures the current content and selection.
     * @returns {{html:string, bookmark:object|null}}
     */
    _snapshot() {
        const el = this._el();
        return {
            html: el ? el.innerHTML : "",
            bookmark: this._serializeSelection()
        };
    }

    /**
     * Restores a snapshot's content and selection and rewires plugin DOM.
     * @param {{html:string, bookmark:object|null}} entry - The snapshot.
     * @returns {void}
     */
    _restore(entry) {
        const el = this._el();
        if (!el || !entry) {
            return;
        }
        this._restoring = true;
        try {
            el.innerHTML = entry.html;
            el.focus({ preventScroll: true });
            // structure matches the snapshot, so the selection resolves exactly;
            // the live selection then survives the plugin rewiring below
            this._restoreSelection(entry.bookmark);
            if (typeof this._editor._notifyPluginsContentChanged === "function") {
                this._editor._notifyPluginsContentChanged();
            }
            this._editor._syncValue();
        } finally {
            this._restoring = false;
        }
    }

    /**
     * (Re)starts the typing idle timer.
     * @returns {void}
     */
    _restartTimer() {
        this._clearTimer();
        this._typingTimer = setTimeout(() => {
            this._typingTimer = null;
            this._flushTyping();
            // a coalesced typing burst just became its own committed step, so
            // the undo/redo availability changed - refresh the button states.
            this._editor._updateUndoRedoStates();
        }, webexpress.webui.EditorHistory.TYPING_DELAY);
    }

    /**
     * Clears the typing idle timer.
     * @returns {void}
     */
    _clearTimer() {
        if (this._typingTimer) {
            clearTimeout(this._typingTimer);
            this._typingTimer = null;
        }
    }

    /**
     * Serializes the current selection relative to the editor root.
     * @returns {{start:object, end:object, collapsed:boolean}|null}
     */
    _serializeSelection() {
        const el = this._el();
        const range = webexpress.webui.EditorSelection.getRange(el);
        if (!range) {
            return null;
        }
        const start = this._serializePoint(range.startContainer, range.startOffset, el);
        if (!start) {
            return null;
        }
        const end = range.collapsed
            ? start
            : this._serializePoint(range.endContainer, range.endOffset, el);
        if (!end) {
            return null;
        }
        return { start, end, collapsed: range.collapsed };
    }

    /**
     * Serializes a (container, offset) point as a child-index path + offset.
     * @param {Node} container - Boundary container.
     * @param {number} offset - Boundary offset.
     * @param {HTMLElement} root - The editor root.
     * @returns {{path:number[], offset:number}|null}
     */
    _serializePoint(container, offset, root) {
        const path = [];
        let n = container;
        while (n && n !== root) {
            const parent = n.parentNode;
            if (!parent) {
                return null;
            }
            path.unshift(Array.prototype.indexOf.call(parent.childNodes, n));
            n = parent;
        }
        if (n !== root) {
            return null;
        }
        return { path, offset };
    }

    /**
     * Restores a selection from a bookmark.
     * @param {{start:object, end:object, collapsed:boolean}|null} bookmark
     * @returns {void}
     */
    _restoreSelection(bookmark) {
        if (!bookmark) {
            return;
        }
        const el = this._el();
        const start = this._resolvePoint(bookmark.start, el);
        const end = bookmark.collapsed ? start : this._resolvePoint(bookmark.end, el);
        if (!start || !end) {
            return;
        }
        try {
            const range = document.createRange();
            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);
            webexpress.webui.EditorSelection.apply(range);
        } catch (e) {
            /* noop */
        }
    }

    /**
     * Resolves a serialized point back to a live (node, offset).
     * @param {{path:number[], offset:number}} point - Serialized point.
     * @param {HTMLElement} root - The editor root.
     * @returns {{node:Node, offset:number}|null}
     */
    _resolvePoint(point, root) {
        if (!point) {
            return null;
        }
        let n = root;
        for (const idx of point.path) {
            if (!n.childNodes || idx < 0 || idx >= n.childNodes.length) {
                return null;
            }
            n = n.childNodes[idx];
        }
        const max = n.nodeType === Node.TEXT_NODE
            ? (n.textContent || "").length
            : n.childNodes.length;
        return { node: n, offset: Math.min(point.offset, max) };
    }
};

/**
 * Core WYSIWYG editor control.
 * Initializes the editor frame, manages undo/redo functionality, and loads all
 * registered editor plugins from the js/editor directory. Provides context menu
 * handling and integrates plugin‑specific behaviors.
 */
webexpress.webui.EditorCtrl = class extends webexpress.webui.Ctrl {
    _formFieldName = null;
    _formInput = null;
    _editorElement = null;
    _uiContainer = null;
    _savedRange = null;
    _contextMenu = null;
    _documentClickHandler = null;
    _historyTyping = false;

    // public configuration properties
    imageUploadUri = "";
    imageBaseUri = "";

    /**
     * Creates a new instance of the class.
     * @param {HTMLElement} element - The host element for the editor (always a div).
     */
    constructor(element) {
        super(element);

        // read content preferably from value attribute (form-item behavior), fallback to innerhtml
        const content = element.getAttribute("value") || element.innerHTML || "";
        this._formFieldName = element.getAttribute("name") || element.dataset.name || null;

        this._uiContainer = element;

        // clean up container
        element.removeAttribute("name");
        element.removeAttribute("value");
        element.innerHTML = "";
        element.classList.add("wx-editor");

        // create hidden input field directly inside the container
        if (this._formFieldName) {
            this._formInput = document.createElement("input");
            this._formInput.type = "hidden";
            this._formInput.name = this._formFieldName;
            this._uiContainer.appendChild(this._formInput);
        }

        this.imageUploadUri = element.dataset.imageUploadUri || "";
        this.imageBaseUri = element.dataset.imageBaseUri || "";

        // ensure the container has an id
        if (!this._uiContainer.id) {
            this._uiContainer.id = "wx-editor-" + Math.floor(Math.random() * 100000);
        }

        this._createToolbar(this._uiContainer);
        this._createEditorArea(this._uiContainer, content);
        this._createStatusBar(this._uiContainer);
        this._initContextMenu();

        if (this._formInput) {
            this._syncValue();
            this._setupFormIntegration();
        }

        this._attachEventHandlers();
        this._deletion = new webexpress.webui.EditorDeletion(this);
        this._pendingFormat = new webexpress.webui.EditorPendingFormat(this);
        this._painter = new webexpress.webui.EditorPainter(this);
        this._history = new webexpress.webui.EditorHistory(this);
        this._initializePlugins();
        this._updateUndoRedoStates();

        // notify plugins first so tables are wrapped in frames
        this._notifyPluginsContentChanged();

        // ensure typing space is available after initialization and upgrades
        this._ensureTypingSpace();

        // notify plugins again so anything that depends on the final block
        // structure (placeholder hint, etc.) sees the post-typing-space dom
        this._notifyPluginsContentChanged();

        this._history.reset();
        // reflect the clean baseline on the buttons (undo and redo disabled)
        this._updateUndoRedoStates();
    }

    /**
     * Notifies all plugins that the content has been loaded or programmatically changed.
     */
    _notifyPluginsContentChanged() {
        const plugins = webexpress.webui.EditorPlugins.getAll();
        plugins.forEach((plugin) => {
            if (typeof plugin.onContentChange === "function") {
                plugin.onContentChange(this);
            }
        });
    }

    /**
     * Returns true when the element is an inline, non-editable atomic that must
     * remain part of the surrounding text flow (instruction text, mentions,
     * inline add-ons, inline date controls, images).
     * @param {Node} el - The element to test.
     * @returns {boolean}
     */
    _isInlineAtomic(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }
        if (el.tagName === "IMG") {
            return true;
        }
        return !!(el.matches && el.matches(
            ".wx-editor-instruction, .wx-addon-inline-frame, .wx-mention, .wx-webui-date, .wx-date, .wx-editor-date"
        ));
    }

    /**
     * Wraps stray inline or text content that sits directly inside the editor
     * root into a paragraph, so block level commands (lists, indentation,
     * alignment, block format) always have a block element to operate on.
     * Existing block elements and block level non-editable frames are left
     * untouched.
     * @returns {boolean} True when the dom was modified.
     */
    _ensureBlockStructure() {
        const editor = this._editorElement;
        if (!editor) {
            return false;
        }

        const BLOCK_TAGS = new Set([
            "P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "BLOCKQUOTE",
            "PRE", "DIV", "TABLE", "HR", "FIGURE", "SECTION", "ARTICLE", "FORM", "DL"
        ]);

        const isBlock = (node) => {
            if (!node || node.nodeType !== Node.ELEMENT_NODE) {
                return false;
            }
            if (BLOCK_TAGS.has(node.tagName)) {
                return true;
            }
            // block level non-editable frame (block add-on, table frame)
            if (node.getAttribute && node.getAttribute("contenteditable") === "false" &&
                !this._isInlineAtomic(node)) {
                return true;
            }
            return false;
        };

        let modified = false;
        let run = [];

        const flush = () => {
            if (!run.length) {
                return;
            }
            const onlyWhitespace = run.every((n) =>
                n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim() === "");
            if (onlyWhitespace) {
                run = [];
                return;
            }
            const p = document.createElement("p");
            run[0].parentNode.insertBefore(p, run[0]);
            run.forEach((n) => p.appendChild(n));
            run = [];
            modified = true;
        };

        let child = editor.firstChild;
        while (child) {
            const next = child.nextSibling;
            if (isBlock(child)) {
                flush();
            } else {
                run.push(child);
            }
            child = next;
        }
        flush();

        return modified;
    }

    /**
     * Ensures there is always an empty paragraph before, after, and between non-editable elements.
     * This totally prevents the cursor trap issue.
     */
    _ensureTypingSpace() {
        if (!this._editorElement) {
            return;
        }
 
        const MARKER = webexpress.webui.EditorSelection.MARKER_ATTR;
        const editor = this._editorElement;

        // make sure stray inline / text content always lives inside a block so
        // list, indent and alignment commands can find a block to act on (this
        // is what made the very first line / loaded plain text un-formattable).
        let modified = this._ensureBlockStructure();

        const nonEditables = Array.from(editor.querySelectorAll('[contenteditable="false"]'));

        nonEditables.forEach((el) => {
            if (el.parentElement && el.parentElement.closest('[contenteditable="false"]')) {
                return;
            }

            // inline atomics (instruction text, mentions, inline add-ons, inline
            // date controls) stay in the text flow and must not be pushed onto
            // their own line by surrounding guard paragraphs.
            if (this._isInlineAtomic(el)) {
                return;
            }

            const parentP = el.closest("p");
            if (parentP && parentP.parentElement === editor) {
                editor.insertBefore(el, parentP.nextSibling);
                modified = true;
 
                if (
                    parentP.textContent.trim() === "" &&
                    parentP.querySelectorAll("img, table, [contenteditable='false']").length === 0 &&
                    !parentP.querySelector("[" + MARKER + "]")
                ) {
                    parentP.remove();
                }
            }
 
            if (el.parentElement === editor) {
                const prev = el.previousElementSibling;
                if (!prev || (prev.tagName !== "P" && prev.getAttribute("contenteditable") === "false")) {
                    const pBefore = document.createElement("p");
                    pBefore.innerHTML = "<br>";
                    editor.insertBefore(pBefore, el);
                    modified = true;
                }
 
                const next = el.nextElementSibling;
                if (!next || (next.tagName !== "P" && next.getAttribute("contenteditable") === "false")) {
                    const pAfter = document.createElement("p");
                    pAfter.innerHTML = "<br>";
                    if (el.nextSibling) {
                        editor.insertBefore(pAfter, el.nextSibling);
                    } else {
                        editor.appendChild(pAfter);
                    }
                    modified = true;
                }
            }
        });
 
        const html = editor.innerHTML.trim();
        if (!html || html === "<br>") {
            editor.innerHTML = "<p><br></p>";
            modified = true;
        }
 
        if (modified) {
            this._syncValue();
        }
    }

    /**
     * Attaches all necessary event handlers to the editor and toolbar.
     */
    _attachEventHandlers() {
        const toolbar = this._uiContainer.querySelector(".wx-editor-toolbar");
        if (toolbar) {
            toolbar.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                this._saveRangeOnFocusLost();
                // keep the caret alive in the editor when a command button is
                // pressed. Without this the editor blurs and the (collapsed)
                // selection is lost, which is why inline formatting only worked
                // with an explicit selection. Inputs/search fields inside the
                // toolbar (e.g. the emoji search) must still be focusable, so we
                // only suppress the default focus shift for plain buttons.
                const target = e.target;
                if (target && target.closest && target.closest("button") &&
                    !target.closest("input, textarea, select, [contenteditable='true']")) {
                    e.preventDefault();
                }
            }, true);
        }

        // save current range when editor loses focus
        this._editorElement.addEventListener("blur", () => {
            this._saveRangeOnFocusLost();
        });

        // restore current range when editor gets focus back
        this._editorElement.addEventListener("focus", () => {
            this._restoreRangeOnFocusReceived();
        });

        this._editorElement.addEventListener("mouseup", () => {
            this._saveRangeOnFocusLost();
        });

        this._editorElement.addEventListener("keyup", () => {
            this._saveRangeOnFocusLost();
        });

        this._editorElement.addEventListener("input", () => {
            this._historyTyping = true;
            this._syncValue();
            this._historyTyping = false;
            this._updateUndoRedoStates();
        });
    }

    /**
     * Stores the current selection (constrained to the editor) in _savedRange.
     * This is the method every plugin (media, addons, bubble, instruction,
     * table) expects. It was missing before, which is why the selection was
     * silently not captured at click time.
     * @returns {void}
     */
    _saveCurrentSelection() {
        const range = webexpress.webui.EditorSelection.getRange(this._editorElement);
        if (range) {
            this._savedRange = range.cloneRange();
        }
    }
 
    /**
     * Restores the stored selection. When it is no longer valid, the caret is
     * moved to the end of the editor.
     * @returns {boolean} True when the stored range was restored.
     */
    restoreSavedRange() {
        const sel = window.getSelection();
        if (!sel) {
            return false;
        }
        if (
            this._savedRange &&
            this._editorElement &&
            this._editorElement.contains(this._savedRange.startContainer) &&
            this._editorElement.contains(this._savedRange.endContainer)
        ) {
            sel.removeAllRanges();
            sel.addRange(this._savedRange);
            return true;
        }
        const range = document.createRange();
        range.selectNodeContents(this._editorElement);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        this._savedRange = range.cloneRange();
        return false;
    }
 
    /**
     * Saves the current selection on focus loss. Kept as a backward-compatible
     * delegation so _attachEventHandlers and the toolbar handler stay unchanged.
     * @returns {void}
     */
    _saveRangeOnFocusLost() {
        this._saveCurrentSelection();
    }

    /**
     * Restores the saved selection when focus is received. Kept as a
     * backward-compatible delegation.
     * @returns {void}
     */
    _restoreRangeOnFocusReceived() {
        this.restoreSavedRange();
    }

    /**
     * Initializes all registered plugins.
     */
    _initializePlugins() {
        const plugins = webexpress.webui.EditorPlugins.getAll();
        plugins.forEach((plugin) => {
            if (typeof plugin.init === "function") {
                plugin.init(this);
            }
        });
    }

    /**
     * Creates the toolbar containing plugin buttons and undo/redo controls.
     * @param {HTMLElement} element - The parent element (ui container).
     */
    _createToolbar(element) {
        const toolbar = document.createElement("div");
        toolbar.classList.add("wx-editor-toolbar");

        const plugins = webexpress.webui.EditorPlugins.getAll();
        plugins.forEach((plugin) => {
            if (typeof plugin.createToolbar === "function") {
                const group = plugin.createToolbar(this);
                if (group) {
                    toolbar.appendChild(group);
                }
            }
        });

        const historyGroup = this._createHistoryGroup();
        toolbar.appendChild(historyGroup);
        element.appendChild(toolbar);
    }

    /**
     * Creates the undo/redo button group including the fullscreen toggle.
     * @returns {HTMLElement} The history button group.
     */
    _createHistoryGroup() {
        const historyGroup = document.createElement("div");
        historyGroup.className = "wx-editor-btn-group";
        historyGroup.style.marginLeft = "auto";

        const undoBtn = this._createHistoryButton("undo", webexpress.webui.I18N.translate("webexpress.webui:editor.undo"), "fas fa-undo");
        const redoBtn = this._createHistoryButton("redo", webexpress.webui.I18N.translate("webexpress.webui:editor.redo"), "fas fa-redo");

        historyGroup.appendChild(undoBtn);
        historyGroup.appendChild(redoBtn);

        historyGroup.appendChild(this._createSeparator());
        historyGroup.appendChild(this._createFullscreenButton());

        return historyGroup;
    }

    /**
     * Creates a visual separator element for the toolbar.
     * @returns {HTMLElement} The separator element.
     */
    _createSeparator() {
        const sep = document.createElement("span");
        sep.className = "wx-editor-separator";
        return sep;
    }

    /**
     * Creates the fullscreen toggle button. It reuses the framework's CSS based
     * fullscreen mechanism (data-wx-primary-action="fullscreen"), targeting the
     * editor host, so the controller toggles the wx-fullscreen-active class and
     * swaps the icon automatically.
     * @returns {HTMLElement} The fullscreen toggle button.
     */
    _createFullscreenButton() {
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.type = "button";
        btn.title = webexpress.webui.I18N.translate("webexpress.webui:fullscreen.toggle");
        btn.setAttribute("aria-label", btn.title);
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("data-wx-primary-action", "fullscreen");
        btn.setAttribute("data-wx-primary-target", "#" + this._uiContainer.id);
        btn.innerHTML = '<i class="fas fa-expand"></i>';
        return btn;
    }

    /**
     * Creates a single history button (undo or redo).
     * @param {string} command - The command name.
     * @param {string} title - The button tooltip.
     * @param {string} iconClass - The icon css class.
     * @returns {HTMLElement} The button element.
     */
    _createHistoryButton(command, title, iconClass) {
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.title = title;
        btn.setAttribute("aria-label", title);
        btn.dataset.command = command;
        btn.innerHTML = `<i class="${webexpress.webui.IconTheme.resolveFa(iconClass)}"></i>`;
        btn.type = "button";

        btn.addEventListener("click", () => {
            this.execCommand(command);
            this._updateUndoRedoStates();
        });

        return btn;
    }

    /**
     * Updates the enabled/disabled state of undo and redo buttons.
     */
    _updateUndoRedoStates() {
        const undoBtn = this._uiContainer.querySelector('button[data-command="undo"]');
        const redoBtn = this._uiContainer.querySelector('button[data-command="redo"]');

        const canUndo = this._history ? this._history.canUndo() : false;
        const canRedo = this._history ? this._history.canRedo() : false;

        if (undoBtn) {
            undoBtn.disabled = !canUndo;
        }
        if (redoBtn) {
            redoBtn.disabled = !canRedo;
        }
    }

    /**
     * Creates the editable content area.
     * @param {HTMLElement} element - The parent element.
     * @param {string} content - The initial content.
     */
    _createEditorArea(element, content) {
        const container = document.createElement("div");
        container.classList.add("wx-editor-container");

        this._editorElement = document.createElement("div");
        this._editorElement.classList.add("wx-editor-content");
        this._editorElement.setAttribute("contenteditable", "true");
        this._editorElement.style.minHeight = "200px";

        if (content) {
            const clean = this._sanitizeHtml(content);
            this._editorElement.innerHTML = clean;
        }

        container.appendChild(this._editorElement);
        element.appendChild(container);
    }

    /**
     * Creates the status bar at the bottom of the editor.
     * @param {HTMLElement} element - The parent element.
     */
    _createStatusBar(element) {
        const statusBar = document.createElement("div");
        statusBar.classList.add("wx-editor-status");

        // "done" button to leave fullscreen; only visible while the editor is in
        // (css) fullscreen via the .wx-editor-status visibility rules.
        const finishBtn = document.createElement("button");
        finishBtn.type = "button";
        finishBtn.className = "btn btn-primary btn-sm wx-editor-finish";
        finishBtn.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.done");
        finishBtn.setAttribute("data-wx-dismiss", "fullscreen");
        finishBtn.setAttribute("data-wx-target", "#" + this._uiContainer.id);
        statusBar.appendChild(finishBtn);

        element.appendChild(statusBar);
    }

    /**
     * Initializes the context menu and its event handlers.
     */
    _initContextMenu() {
        this._contextMenu = document.createElement("div");
        this._contextMenu.className = "dropdown-menu shadow";
        this._contextMenu.style.position = "fixed";
        this._contextMenu.style.display = "none";
        document.body.appendChild(this._contextMenu);

        this._documentClickHandler = () => {
            if (this._contextMenu.style.display === "block") {
                this._contextMenu.style.display = "none";
            }
        };
        document.addEventListener("click", this._documentClickHandler);
    }

    /**
     * Sanitizes an html string by removing unsafe tags and attributes.
     * @param {string} html - Raw html input.
     * @returns {string} Sanitized html.
     */
    _sanitizeHtml(html) {
        return html || "";
    }

    /**
     * Synchronizes the editor content with the hidden form input.
     */
    _syncValue() {
        if (this._formInput) {
            this._formInput.value = this._editorElement.innerHTML;
        }
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._editorElement.innerHTML });
        if (this._history) {
            this._history.notify(this._historyTyping === true);
        }
    }

    /**
     * Ensures form synchronization events are established.
     */
    _setupFormIntegration() {
        const form = this._uiContainer.closest("form");
        if (form) {
            form.addEventListener("submit", () => {
                this._syncValue();
            });
        }
    }

    /**
     * Executes a document command on the editor content.
     * @param {string} command - The command to execute.
     * @param {*} value - The command value.
     */
    execCommand(command, value = null) {
        const cmd = (command || "").toLowerCase();

        if (cmd === "undo" || cmd === "redo") {
            if (this._history) {
                if (cmd === "undo") {
                    this._history.undo();
                } else {
                    this._history.redo();
                }
            }
            this._updateUndoRedoStates();
            return;
        }

        // preventScroll keeps the document/editor at its current scroll position
        // instead of jumping to the caret when a toolbar action is triggered.
        this._editorElement.focus({ preventScroll: true });
        this.restoreSavedRange();

        if (cmd === "formatpainter") {
            if (this._painter) {
                this._painter.toggle();
            }
            return;
        }
        if (webexpress.webui.EditorFormat.handles(command)) {
            webexpress.webui.EditorFormat.exec(this, command, value);
            return;
        }
        if (webexpress.webui.EditorBlocks.handles(command)) {
            webexpress.webui.EditorBlocks.exec(this, command, value);
            return;
        }
        if (webexpress.webui.EditorList.handles(command)) {
            webexpress.webui.EditorList.exec(this, command, value);
            return;
        }

        document.execCommand(command, false, value);
        this._saveCurrentSelection();
        this._syncValue();
        this._updateUndoRedoStates();
    }

    /**
     * Returns the active state of a command for the current selection. Inline
     * commands are answered by the engine; others fall back to the browser.
     * @param {string} command - The command name.
     * @returns {boolean}
     */
    queryCommandState(command) {
        if ((command || "").toLowerCase() === "formatpainter") {
            return !!(this._painter && this._painter.isActive());
        }
        if (webexpress.webui.EditorFormat.handles(command)) {
            return webexpress.webui.EditorFormat.queryState(this, command);
        }
        if (webexpress.webui.EditorList.handles(command)) {
            return webexpress.webui.EditorList.queryState(this, command);
        }
        try {
            return document.queryCommandState(command);
        } catch (e) {
            return false;
        }
    }

    /**
     * Inserts html at the current cursor position.
     * @param {string} html - The html to insert.
     */
    insertHtmlAtCursor(html) {
        const cleanHtml = this._sanitizeHtml(html || "");
        const editor = this._editorElement;
        const Sel = webexpress.webui.EditorSelection;
 
        if (!editor) {
            return;
        }

        editor.focus({ preventScroll: true });
        this.restoreSavedRange();

        let range = Sel.getRange(editor);
        if (!range) {
            // Never fall back to innerHTML += - place the caret at the end instead.
            range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
            Sel.apply(range);
        }
 
        range.deleteContents();
 
        // Build the fragment to insert.
        const tmp = document.createElement("div");
        tmp.innerHTML = cleanHtml;
        const fragment = document.createDocumentFragment();
        let lastNode = null;
        while (tmp.firstChild) {
            lastNode = fragment.appendChild(tmp.firstChild);
        }
 
        range.insertNode(fragment);
 
        // Place a marker after the inserted content so the caret can be found
        // again after normalization.
        Sel.insertMarker(range, lastNode);
 
        // Normalization - may relocate nodes (table frame) or remove them.
        this._notifyPluginsContentChanged();
        this._ensureTypingSpace();
 
        // Restore the caret at the recorded position.
        Sel.placeCaretAtMarker(editor);
        this._saveCurrentSelection();
 
        this._syncValue();
        this._updateUndoRedoStates();
    }

    /**
     * Getter for the editor content (html).
     * @returns {string} Current editor html content.
     */
    get value() {
        if (!this._editorElement) {
            return "";
        }
        return this._editorElement.innerHTML;
    }

    /**
     * Setter for the editor content.
     * @param {string} v - Html string to set.
     */
    set value(v) {
        if (!this._editorElement) {
            return;
        }
        const clean = this._sanitizeHtml(v || "");
        this._editorElement.innerHTML = clean;
        // normalize the same way the constructor does so programmatic content
        // gets framed tables, block structure and typing space too
        this._notifyPluginsContentChanged();
        this._ensureTypingSpace();
        this._notifyPluginsContentChanged();
        this._syncValue();
        if (this._history) {
            this._history.reset();
        }
        this._updateUndoRedoStates();
    }

    /**
     * Returns the editor content element.
     * @returns {HTMLElement} The editor content element.
     */
    getEditorElement() {
        return this._editorElement;
    }

    /**
     * Cleans up resources when the control is destroyed.
     */
    destroy() {
        if (this._painter) {
            this._painter.cancel();
        }

        if (this._documentClickHandler) {
            document.removeEventListener("click", this._documentClickHandler);
        }

        if (this._contextMenu && this._contextMenu.parentElement) {
            this._contextMenu.parentElement.removeChild(this._contextMenu);
        }

        super.destroy();
    }
};

// register the class in the controller system
webexpress.webui.Controller.registerClass("wx-webui-editor", webexpress.webui.EditorCtrl);