/**
 * Owns document validation and editing without depending on a browser or DOM.
 * Positions count UTF-16 code units, one unit per atom and one per text-block end.
 */
webexpress.webui.EditorModel = class {
    static VERSION = 1;
    static MAX_DEPTH = 40;
    static MAX_NODES = 50000;
    static MAX_TEXT = 2000000;
    static _nextId = 0;
    static TEXT_BLOCKS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "pre"]);
    static CONTAINERS = new Set(["doc", "row", "region", "blockquote", "ul", "ol", "li", "table", "thead", "tbody", "tfoot", "tr", "td", "th", "addon"]);
    static MARKS = new Set(["bold", "italic", "underline", "strikethrough", "superscript", "subscript", "code", "color", "background", "font", "size", "link"]);

    /** Keeps caller-owned objects out of transactions and published values. */
    static clone(value) { return JSON.parse(JSON.stringify(value)); }

    /** Produces keys for node-targeted actions that survive a complete render. */
    static node(type, children = [], attrs = {}) {
        return { type, id: "n" + (++this._nextId), attrs, children };
    }

    /** Rejects executable and obfuscated URL schemes at every input boundary. */
    static url(value, image = false) {
        const text = String(value ?? "").trim();
        if (!text || /[\u0000-\u0020\u007f-\u009f\\]/.test(text)) return "";
        if (/^(?:https?:)/i.test(text)) return text;
        if (!image && /^(?:mailto:|tel:)/i.test(text)) return text;
        return !/^[^/?#]*:/.test(text) && !text.startsWith("//") ? text : "";
    }

    /** Restricts CSS values to inert values supported by the document schema. */
    static style(name, value) {
        const text = String(value ?? "").trim();
        if (name === "color" || name === "background") {
            return /^(?:#[\da-f]{3,8}|[a-z]{1,24}|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+-]+\))$/i.test(text) ? text : "";
        }
        if (name === "font") return /^[\w ,'-]{1,100}$/.test(text) ? text : "";
        if (name === "size") return /^(?:\d+(?:\.\d+)?)(?:px|pt|em|rem|%)$/.test(text) ? text : "";
        return "";
    }

    /** Canonical marks make equality and mixed-selection checks deterministic. */
    static marks(value) {
        const result = {};
        for (const name of [...this.MARKS].sort()) {
            const raw = value?.[name];
            if (name === "link") {
                const href = this.url(raw?.href ?? raw);
                if (href) result.link = { href, target: raw?.target === "_blank" ? "_blank" : "" };
            } else if (["color", "background", "font", "size"].includes(name)) {
                const valid = this.style(name, raw);
                if (valid) result[name] = valid;
            } else if (raw === true) result[name] = true;
        }
        if (result.subscript) delete result.superscript;
        return result;
    }

    /** Whitelists structural data before it can become renderable state. */
    static attributes(type, raw = {}) {
        const a = {};
        if (type === "region") a.weight = Math.max(1, Math.min(12, Number(raw.weight) || 1));
        if (["left", "right", "center", "justify", "start", "end"].includes(raw.align)) a.align = raw.align;
        if (["ltr", "rtl"].includes(raw.dir)) a.dir = raw.dir;
        if (Number.isInteger(raw.indent)) a.indent = Math.max(0, Math.min(12, raw.indent));
        if (raw.background && this.style("background", raw.background)) a.background = this.style("background", raw.background);
        if (["td", "th"].includes(type)) {
            for (const key of ["colspan", "rowspan"]) a[key] = Math.max(1, Math.min(100, Math.floor(Number(raw[key]) || 1)));
            if (["row", "col"].includes(raw.scope)) a.scope = raw.scope;
        }
        if (type === "table" && Array.isArray(raw.widths)) a.widths = raw.widths.slice(0, 100).map(w => Math.max(30, Math.min(2000, Number(w) || 100)));
        if (type === "ol") a.start = Math.max(1, Math.min(100000, Math.floor(Number(raw.start) || 1)));
        if (type === "image") {
            a.src = this.url(raw.src, true);
            a.alt = String(raw.alt ?? "").slice(0, 10000);
            for (const key of ["width", "height"]) {
                const v = String(raw[key] ?? "");
                if (/^(?:\d+(?:\.\d+)?|\.\d+)(?:px|%)?$/.test(v) && parseFloat(v) > 0) a[key] = /(?:px|%)$/.test(v) ? v : v + "px";
            }
            if (raw.align === "inline") a.align = "inline";
            const link = this.marks({ link: raw.link }).link;
            if (link) a.link = link;
        }
        if (type === "atom") {
            a.kind = ["instruction", "mention", "date"].includes(raw.kind) ? raw.kind : "instruction";
            for (const key of ["text", "value", "format"]) a[key] = String(raw[key] ?? "").slice(0, 10000);
        }
        if (type === "addon") {
            a.name = /^[\w.-]{1,100}$/.test(raw.name) ? raw.name : "";
            a.inline = raw.inline === true;
            a.container = raw.container === true && !a.inline;
            a.data = {};
            for (const [key, value] of Object.entries(raw.data ?? {}).slice(0, 100)) {
                if (/^[a-z][\w-]{0,80}$/i.test(key) && !["constructor", "prototype", "__proto__"].includes(key) && ["string", "number", "boolean"].includes(typeof value)) a.data[key] = String(value).slice(0, 10000);
            }
        }
        return a;
    }

    /** Normalizes imported JSON once; invalid versions fail without replacing a document. */
    static validate(input) {
        if (!input || input.version !== this.VERSION || input.doc?.type !== "doc") throw new TypeError("Invalid editor state or unsupported version.");
        let count = 0, textSize = 0;
        const ids = new Set();
        const read = (raw, depth) => {
            if (++count > this.MAX_NODES || depth > this.MAX_DEPTH) throw new RangeError("Editor document exceeds its structural limit.");
            if (!raw || typeof raw !== "object") return null;
            if (raw.type === "text") {
                if (typeof raw.text !== "string") return null;
                textSize += raw.text.length;
                if (textSize > this.MAX_TEXT) throw new RangeError("Editor document exceeds its text limit.");
                return { type: "text", text: raw.text, marks: this.marks(raw.marks) };
            }
            if (!this.TEXT_BLOCKS.has(raw.type) && !this.CONTAINERS.has(raw.type) && !["image", "atom", "br", "hr"].includes(raw.type)) return null;
            let id = typeof raw.id === "string" && /^n\d+$/.test(raw.id) && !ids.has(raw.id) ? raw.id : "n" + (++this._nextId);
            while (ids.has(id)) id = "n" + (++this._nextId);
            this._nextId = Math.max(this._nextId, Number(id.slice(1)));
            ids.add(id);
            const attrs = this.attributes(raw.type, raw.attrs);
            if (raw.type === "image" && !attrs.src) return null;
            return { type: raw.type, id, attrs, children: this.atomic({ type: raw.type, attrs }) ? [] : (Array.isArray(raw.children) ? raw.children : []).map(n => read(n, depth + 1)).filter(Boolean) };
        };
        const doc = read(input.doc, 0);
        this.normalize(doc);
        const max = this.size(doc);
        const clamp = n => Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
        return { version: this.VERSION, doc, selection: { anchor: clamp(input.selection?.anchor), focus: clamp(input.selection?.focus) }, storedMarks: input.storedMarks == null ? null : this.marks(input.storedMarks) };
    }

    /** Supplies a reachable caret even when all document content has been removed. */
    static empty() { return this.validate({ version: this.VERSION, doc: this.node("doc", [this.node("p")]) }); }

    /** Atom descendants belong to their control, never to the text editor. */
    static atomic(node) { return ["image", "atom", "br", "hr"].includes(node.type) || node.type === "addon" && !node.attrs.container; }
    static inline(node) { return ["text", "image", "atom", "br"].includes(node.type) || node.type === "addon" && node.attrs.inline; }
    static size(node) { return node.type === "text" ? node.text.length : this.atomic(node) ? 1 : (node.children ?? []).reduce((sum, child) => sum + this.size(child), 0) + (this.TEXT_BLOCKS.has(node.type) ? 1 : 0); }

    /** Enforces legal parent/child shapes and merges equivalent adjacent text runs. */
    static normalize(node) {
        if (node.type === "text" || this.atomic(node)) return;
        node.children.forEach(n => this.normalize(n));
        let children = node.children;
        if (node.type === "doc") {
            const rows = [], pending = [];
            const flush = () => {
                if (pending.length) { rows.push(this.node("row", [this.node("region", pending.splice(0), { weight: 1 })])); }
            };
            children.forEach(child => { if (child.type === "row") { flush(); rows.push(child); } else pending.push(child); });
            flush();
            node.children = rows.length ? rows : [this.node("row", [this.node("region", [this.node("p")], { weight: 1 })])];
            node.children.forEach(child => this.normalize(child));
            return;
        }
        if (node.type === "row") {
            node.children = children.filter(child => child.type === "region");
            if (!node.children.length) node.children.push(this.node("region", [this.node("p")], { weight: 1 }));
            node.children.forEach(child => this.normalize(child));
            return;
        }
        if (this.TEXT_BLOCKS.has(node.type)) children = children.flatMap(n => this.inline(n) ? [n] : this.leaves(n));
        if (["region", "li", "blockquote", "td", "th"].includes(node.type) || node.type === "addon" && node.attrs.container) {
            const blocks = [];
            let run = [];
            const flush = () => { if (run.length) { blocks.push(this.node("p", run)); run = []; } };
            children.forEach(n => { if (this.inline(n)) run.push(n); else { flush(); blocks.push(n); } });
            flush();
            children = blocks.length ? blocks : [this.node("p")];
        }
        const expected = { ul: ["li"], ol: ["li"], table: ["thead", "tbody", "tfoot"], thead: ["tr"], tbody: ["tr"], tfoot: ["tr"], tr: ["td", "th"] }[node.type];
        if (expected) children = children.filter(n => expected.includes(n.type));
        if (["ul", "ol"].includes(node.type) && !children.length) children = [this.node("li", [this.node("p")])];
        const merged = [];
        for (const child of children) {
            if (child.type === "text" && !child.text) continue;
            const last = merged[merged.length - 1];
            if (last?.type === "text" && child.type === "text" && JSON.stringify(last.marks) === JSON.stringify(child.marks)) last.text += child.text;
            else merged.push(child);
        }
        node.children = merged;
    }

    static leaves(node) { return node.type === "text" || this.atomic(node) ? [node] : node.children.flatMap(n => this.leaves(n)); }

    /** Builds an index from model nodes only; no DOM paths enter edit operations. */
    static entries(doc) {
        const out = [];
        const walk = (node, start, parent, index, ancestors) => {
            const entry = { node, start, end: start + this.size(node), parent, index, ancestors };
            out.push(entry);
            let pos = start;
            if (!this.atomic(node)) for (let i = 0; i < (node.children ?? []).length; i++) {
                walk(node.children[i], pos, node, i, [...ancestors, node]);
                pos += this.size(node.children[i]);
            }
        };
        walk(doc, 0, null, 0, []);
        return out;
    }

    static block(doc, position) { return this.entries(doc).find(e => this.TEXT_BLOCKS.has(e.node.type) && position >= e.start && position < e.end); }
    static region(doc, position) { return this.entries(doc).find(e => e.node.type === "region" && position >= e.start && position < e.end); }
    static find(doc, id) { return this.entries(doc).find(e => e.node.id === id); }
    static bounds(state) { return [Math.min(state.selection.anchor, state.selection.focus), Math.max(state.selection.anchor, state.selection.focus)]; }

    /** Reads insertion marks from the text on the caret's left within its block. */
    static activeMarks(state) {
        if (state.storedMarks !== null) return this.clone(state.storedMarks);
        const pos = state.selection.focus, block = this.block(state.doc, pos);
        const texts = this.entries(state.doc).filter(e => e.node.type === "text" && e.start >= (block?.start ?? 0) && e.end <= (block?.end ?? 0));
        return this.clone((texts.find(e => e.start < pos && e.end >= pos) ?? texts.find(e => e.start === pos))?.node.marks ?? {});
    }

    /** Splits text runs without splitting atom nodes or losing their metadata. */
    static slice(children, from, to) {
        const result = [];
        let pos = 0;
        for (const child of children) {
            const end = pos + this.size(child);
            if (end > from && pos < to) {
                if (child.type === "text") result.push({ ...child, marks: { ...child.marks }, text: child.text.slice(Math.max(0, from - pos), Math.min(child.text.length, to - pos)) });
                else result.push(this.clone(child));
            }
            pos = end;
        }
        return result;
    }

    /** Replaces a selection in the model, merging paragraphs only within one text flow. */
    static replace(state, nodes) {
        const [from, to] = this.bounds(state);
        const all = this.entries(state.doc);
        const first = this.block(state.doc, from), last = this.block(state.doc, to);
        const firstId = first?.node.id;
        const lastId = last?.node.id;
        const sameFlow = first && last && first.parent === last.parent;
        const prune = (node, start) => {
            if (node.type === "text") {
                const a = Math.max(0, from - start), b = Math.min(node.text.length, to - start);
                if (a < b) node.text = node.text.slice(0, a) + node.text.slice(b);
                return !!node.text;
            }
            const end = start + this.size(node);
            if (this.atomic(node)) return !(start >= from && end <= to && from < to);
            if (!["doc", "row", "region"].includes(node.type) && start >= from && end <= to && node.id !== firstId && node.id !== lastId) return false;
            let pos = start;
            node.children = node.children.filter(child => { const childStart = pos; pos += this.size(child); return prune(child, childStart); });
            return true;
        };
        if (from < to) prune(state.doc, 0);
        if (sameFlow && first.node !== last.node && first.parent.children.includes(last.node)) {
            first.node.children.push(...last.node.children);
            first.parent.children.splice(first.parent.children.indexOf(last.node), 1);
        }
        let entry = firstId && this.find(state.doc, firstId);
        if (!entry) {
            entry = this.block(state.doc, Math.min(from, this.size(state.doc) - 1));
            if (!entry) {
                const p = this.node("p");
                const region = this.region(state.doc, from)?.node ?? state.doc.children[0].children[0];
                region.children.push(p);
                entry = this.find(state.doc, p.id);
            }
        }
        const offset = Math.max(0, Math.min(from - entry.start, this.size(entry.node) - 1));
        const left = this.slice(entry.node.children, 0, offset), right = this.slice(entry.node.children, offset, Infinity);
        let caret = entry.start + offset;
        if (nodes.every(n => this.inline(n))) {
            entry.node.children = [...left, ...nodes, ...right];
            caret += nodes.reduce((sum, n) => sum + this.size(n), 0);
        } else {
            const blocks = [];
            let run = [];
            const flush = () => { if (run.length) { blocks.push(this.node("p", run)); run = []; } };
            nodes.forEach(n => { if (this.inline(n)) run.push(n); else { flush(); blocks.push(n); } });
            flush();
            const replacement = [];
            if (left.length) replacement.push({ ...entry.node, children: left });
            replacement.push(...blocks);
            const tail = this.node("p", right);
            replacement.push(tail);
            entry.parent.children.splice(entry.index, 1, ...replacement);
            caret = this.find(state.doc, tail.id).start;
        }
        this.normalize(state.doc);
        state.selection = { anchor: caret, focus: caret };
    }

    /** Deletes complete grapheme clusters, keeping combining marks and emoji intact. */
    static delete(state, direction, unit = "grapheme") {
        let [from, to] = this.bounds(state);
        if (from !== to) { this.replace(state, []); return; }
        const block = this.block(state.doc, from);
        if (!block) return;
        const offset = from - block.start;
        const length = this.size(block.node) - 1;
        if (direction < 0 && offset === 0 || direction > 0 && offset === length) {
            const sibling = block.parent.children[block.index + direction];
            if (sibling && this.TEXT_BLOCKS.has(sibling.type)) {
                const caret = direction < 0 ? block.start - 1 : from;
                if (direction < 0) sibling.children.push(...block.node.children);
                else block.node.children.push(...sibling.children);
                block.parent.children.splice(block.index + (direction < 0 ? 0 : 1), 1);
                this.normalize(state.doc);
                state.selection = { anchor: caret, focus: caret };
            } else if (sibling && this.atomic(sibling)) {
                block.parent.children.splice(block.index + direction, 1);
                const caret = direction < 0 ? from - 1 : from;
                state.selection = { anchor: caret, focus: caret };
            } else if (direction < 0 && block.parent.type === "li") this.list(state, "outdent");
            return;
        }
        const content = block.node.children.map(n => n.type === "text" ? n.text : "\ufffc").join("");
        let edge;
        if (unit === "line") edge = direction < 0 ? 0 : content.length;
        else {
            const segments = Array.from(new Intl.Segmenter(undefined, { granularity: unit === "word" ? "word" : "grapheme" }).segment(content));
            if (direction < 0) {
                const candidates = segments.filter(s => s.index < offset);
                edge = candidates.pop()?.index ?? 0;
                if (unit === "word" && /^\s*$/.test(content.slice(edge, offset))) edge = candidates.pop()?.index ?? edge;
            } else {
                const candidates = segments.filter(s => s.index + s.segment.length > offset);
                let next = candidates.shift();
                edge = next ? next.index + next.segment.length : content.length;
                if (unit === "word" && /^\s*$/.test(content.slice(offset, edge))) { next = candidates.shift(); if (next) edge = next.index + next.segment.length; }
            }
        }
        state.selection = { anchor: from, focus: block.start + edge };
        this.replace(state, []);
    }

    /** Paragraph breaks split lists and headings using model structure. */
    static split(state) {
        this.replace(state, []);
        const entry = this.block(state.doc, state.selection.focus);
        if (!entry) return;
        if (entry.parent.type === "li" && !this.leaves(entry.node).length) { this.list(state, "outdent"); return; }
        const offset = state.selection.focus - entry.start;
        const right = this.slice(entry.node.children, offset, Infinity);
        entry.node.children = this.slice(entry.node.children, 0, offset);
        const next = this.node(offset === this.size(entry.node) - 1 && !right.length ? "p" : entry.node.type, right, { ...entry.node.attrs });
        if (entry.parent.type === "li") {
            const item = this.find(state.doc, entry.parent.id);
            const trailing = entry.parent.children.splice(entry.index + 1);
            item.parent.children.splice(item.index + 1, 0, this.node("li", [next, ...trailing]));
        } else entry.parent.children.splice(entry.index + 1, 0, next);
        const pos = this.find(state.doc, next.id).start;
        state.selection = { anchor: pos, focus: pos };
    }

    /** Formatting changes selected text runs; collapsed selections set insertion marks. */
    static format(state, name, value) {
        const [from, to] = this.bounds(state);
        const clear = name === "removeformat", unlink = name === "unlink";
        if (!clear && !unlink && !this.MARKS.has(name)) return;
        const toggle = value == null && !clear && !unlink;
        const enabled = toggle ? !this.query(state, name) : value;
        const change = marks => {
            let result = { ...marks };
            if (clear) result = result.link ? { link: result.link } : {};
            else if (unlink) delete result.link;
            else if (!enabled) delete result[name];
            else result[name] = enabled;
            if (name === "subscript" && enabled) delete result.superscript;
            if (name === "superscript" && enabled) delete result.subscript;
            return this.marks(result);
        };
        if (from === to) { state.storedMarks = change(this.activeMarks(state)); return; }
        const entries = this.entries(state.doc).filter(e => e.node.type === "text" && e.end > from && e.start < to).reverse();
        for (const e of entries) {
            const a = Math.max(0, from - e.start), b = Math.min(e.node.text.length, to - e.start);
            const text = e.node.text, marks = e.node.marks;
            e.parent.children.splice(e.index, 1, { type: "text", text: text.slice(0, a), marks }, { type: "text", text: text.slice(a, b), marks: change(marks) }, { type: "text", text: text.slice(b), marks });
        }
        state.storedMarks = null;
        this.normalize(state.doc);
    }

    static query(state, name) {
        const [from, to] = this.bounds(state);
        if (from === to) return !!this.activeMarks(state)[name];
        const texts = this.entries(state.doc).filter(e => e.node.type === "text" && e.end > from && e.start < to);
        return texts.length > 0 && texts.every(e => !!e.node.marks[name]);
    }

    static selectedBlocks(state) {
        const [from, to] = this.bounds(state);
        return this.entries(state.doc).filter(e => this.TEXT_BLOCKS.has(e.node.type) && (from === to ? from >= e.start && from < e.end : e.end > from && e.start < to));
    }

    /** Preserves the caret's block identity across operations that add delimiters. */
    static preserve(state, change) {
        const points = [state.selection.anchor, state.selection.focus].map(pos => {
            const entry = this.block(state.doc, pos);
            return { id: entry?.node.id, offset: pos - (entry?.start ?? 0), pos };
        });
        change();
        this.normalize(state.doc);
        const positions = points.map(p => { const e = this.find(state.doc, p.id); return e ? e.start + Math.min(p.offset, this.size(e.node) - 1) : Math.min(p.pos, this.size(state.doc) - 1); });
        state.selection = { anchor: positions[0], focus: positions[1] };
    }

    /** Lists are tree operations so nested lists never depend on browser commands. */
    static list(state, command) {
        this.preserve(state, () => {
            const blocks = this.selectedBlocks(state);
            if (["indent", "outdent"].includes(command)) {
                const ids = [...new Set(blocks.map(e => e.ancestors.findLast(n => n.type === "li")?.id).filter(Boolean))];
                if (!ids.length) { blocks.forEach(e => { e.node.attrs.indent = Math.max(0, Math.min(12, (e.node.attrs.indent || 0) + (command === "indent" ? 1 : -1))); }); return; }
                for (const id of ids) {
                    const item = this.find(state.doc, id), list = item && this.find(state.doc, item.parent.id);
                    if (!item || !list) continue;
                    if (command === "indent") {
                        const previous = item.parent.children[item.index - 1];
                        if (!previous) continue;
                        let nested = previous.children.findLast(n => n.type === item.parent.type);
                        if (!nested) { nested = this.node(item.parent.type); previous.children.push(nested); }
                        item.parent.children.splice(item.index, 1);
                        nested.children.push(item.node);
                    } else if (list.parent.type === "li") {
                        const parentItem = this.find(state.doc, list.parent.id);
                        item.parent.children.splice(item.index, 1);
                        parentItem.parent.children.splice(parentItem.index + 1, 0, item.node);
                        if (!list.node.children.length) list.parent.children.splice(list.index, 1);
                    } else {
                        const before = list.node.children.slice(0, item.index), after = list.node.children.slice(item.index + 1);
                        list.parent.children.splice(list.index, 1, ...(before.length ? [{ ...list.node, children: before }] : []), ...item.node.children, ...(after.length ? [this.node(list.node.type, after, { ...list.node.attrs })] : []));
                    }
                }
                return;
            }
            const type = command === "insertorderedlist" ? "ol" : "ul";
            const lists = [...new Set(blocks.map(e => e.ancestors.findLast(n => ["ul", "ol"].includes(n.type))).filter(Boolean))];
            if (lists.length && blocks.every(e => e.ancestors.some(n => ["ul", "ol"].includes(n.type)))) {
                if (lists.every(n => n.type === type)) { this.list(state, "outdent"); return; }
                lists.forEach(n => { n.type = type; });
                return;
            }
            for (const e of blocks.reverse()) {
                if (e.ancestors.some(n => n.type === "li")) continue;
                const index = e.parent.children.indexOf(e.node);
                e.parent.children.splice(index, 1, this.node(type, [this.node("li", [e.node])]));
            }
            const merge = n => {
                if (!n.children) return;
                for (let i = n.children.length - 1; i > 0; i--) {
                    const a = n.children[i - 1], b = n.children[i];
                    if (["ul", "ol"].includes(a.type) && a.type === b.type) { a.children.push(...b.children); n.children.splice(i, 1); }
                }
                n.children.forEach(merge);
            };
            merge(state.doc);
        });
    }

    /** Each reducer invocation describes exactly one undoable user intention. */
    static reduce(previous, action) {
        const state = this.clone(previous);
        if (action.selection) state.selection = this.clone(action.selection);
        const [from, to] = this.bounds(state);
        const region = this.region(state.doc, from), endRegion = this.region(state.doc, Math.max(from, to - 1));
        if (action.type !== "layout" && region && endRegion && region.node !== endRegion.node) return previous;
        if (action.type === "batch") {
            if (!Array.isArray(action.actions) || action.actions.length > 100 || action.actions.some(a => a.type === "batch")) throw new TypeError("Invalid editor action batch.");
            return action.actions.reduce((current, next) => this.reduce(current, next), state);
        }
        switch (action.type) {
            case "insertText": this.replace(state, [{ type: "text", text: String(action.text ?? ""), marks: this.activeMarks(state) }]); break;
            case "insertNodes": this.replace(state, this.clone(action.nodes ?? [])); state.storedMarks = null; break;
            case "delete": this.delete(state, action.direction ?? -1, action.unit); break;
            case "split": this.split(state); break;
            case "format": this.format(state, action.mark, action.value); break;
            case "list": this.list(state, action.command); break;
            case "block":
                if (action.block === "blockquote") {
                    this.selectedBlocks(state).reverse().forEach(e => e.parent.children.splice(e.index, 1, this.node("blockquote", [e.node])));
                    break;
                }
                this.selectedBlocks(state).forEach(e => {
                if (this.TEXT_BLOCKS.has(action.block)) e.node.type = action.block;
                e.node.attrs = this.attributes(e.node.type, { ...e.node.attrs, ...action.attrs });
            }); break;
            case "removeNode": {
                const e = this.find(state.doc, action.id);
                if (e?.parent) { e.parent.children.splice(e.index, 1); state.selection = { anchor: e.start, focus: e.start }; }
                break;
            }
            case "updateNode": {
                const e = this.find(state.doc, action.id);
                if (e) {
                    e.node.attrs = this.attributes(e.node.type, { ...e.node.attrs, ...action.attrs });
                    if (action.children) e.node.children = this.clone(action.children);
                }
                break;
            }
            case "moveNode": {
                const e = this.find(state.doc, action.id);
                if (e?.parent && (action.position < e.start || action.position > e.end)) {
                    const pos = action.position > e.end ? action.position - this.size(e.node) : action.position;
                    e.parent.children.splice(e.index, 1);
                    state.selection = { anchor: pos, focus: pos };
                    this.replace(state, [e.node]);
                }
                break;
            }
            case "table": this.table(state, action); break;
            case "layout": this.layout(state, action); break;
            default: return previous;
        }
        return this.validate(state);
    }

    /** Layout edits keep structural chrome outside the editable document regions. */
    static layout(state, action) {
        const region = action.regionId ? this.find(state.doc, action.regionId) : this.region(state.doc, state.selection.focus);
        if (!region || region.node.type !== "region") return;
        const row = this.find(state.doc, region.parent.id);
        let target = region.node;
        if (action.command === "addRow") {
            if (state.doc.children.length >= 100) return;
            target = this.node("region", [this.node("p")], { weight: 1 });
            state.doc.children.splice(row.index + 1, 0, this.node("row", [target]));
        } else if (action.command === "addColumn") {
            if (row.node.children.length >= 6) return;
            target = this.node("region", [this.node("p")], { weight: 1 });
            row.node.children.splice(region.index + 1, 0, target);
        } else if (action.command === "removeRegion") {
            if (state.doc.children.length === 1 && row.node.children.length === 1) return;
            row.node.children.splice(region.index, 1);
            if (!row.node.children.length) state.doc.children.splice(row.index, 1);
            target = row.node.children[Math.min(region.index, row.node.children.length - 1)] ?? state.doc.children[Math.min(row.index, state.doc.children.length - 1)].children[0];
        } else if (action.command === "resizeRegion") {
            target.attrs.weight = Math.max(1, Math.min(12, Number(action.weight) || 1));
        } else return;
        const position = this.find(state.doc, target.id).start;
        state.selection = { anchor: position, focus: position };
        state.storedMarks = null;
    }

    /** Computes a logical table grid including occupied rowspan/colspan positions. */
    static tableGrid(table) {
        const rows = table.children.flatMap(section => section.children.map(row => ({ row, section })));
        const grid = [], positions = new Map();
        rows.forEach(({ row, section }, r) => {
            grid[r] ??= [];
            let c = 0;
            for (const cell of row.children) {
                while (grid[r][c]) c++;
                const height = Math.min(cell.attrs.rowspan || 1, rows.filter((x, i) => i >= r && x.section === section).length);
                const width = cell.attrs.colspan || 1;
                positions.set(cell.id, { top: r, bottom: r + height - 1, left: c, right: c + width - 1, cell, row, section });
                for (let y = r; y < r + height; y++) for (let x = c; x < c + width; x++) { grid[y] ??= []; grid[y][x] = cell; }
                c += width;
            }
        });
        return { rows, grid, positions, width: Math.max(0, ...grid.map(r => r.length)) };
    }

    /** Table commands operate on logical cells so spans remain meaningful after edits. */
    static table(state, action) {
        const entries = this.entries(state.doc), selected = (action.ids ?? []).map(id => entries.find(e => e.node.id === id)).filter(Boolean);
        const table = selected[0]?.ancestors.findLast(n => n.type === "table");
        if (!table || selected.some(e => !e.ancestors.includes(table))) return;
        const { rows, grid, positions, width } = this.tableGrid(table);
        const cells = selected.map(e => positions.get(e.node.id)).filter(Boolean);
        if (!cells.length) return;
        const first = cells[0], command = action.command;
        const fresh = type => this.node(type, [this.node("p")], { colspan: 1, rowspan: 1 });
        if (command === "background") cells.forEach(p => { p.cell.attrs.background = this.style("background", action.color); });
        else if (command === "deleteTable") { const e = this.find(state.doc, table.id); e.parent.children.splice(e.index, 1); }
        else if (command === "mergeCells") {
            if (cells.length < 2 || cells.some(p => p.section !== first.section)) return;
            const top = Math.min(...cells.map(p => p.top)), bottom = Math.max(...cells.map(p => p.bottom));
            const left = Math.min(...cells.map(p => p.left)), right = Math.max(...cells.map(p => p.right));
            const ids = new Set(cells.map(p => p.cell.id));
            for (let r = top; r <= bottom; r++) for (let c = left; c <= right; c++) if (!ids.has(grid[r]?.[c]?.id)) return;
            const ordered = cells.sort((a, b) => a.top - b.top || a.left - b.left), target = ordered[0].cell;
            target.children = ordered.flatMap(p => p.cell.children);
            target.attrs.colspan = right - left + 1; target.attrs.rowspan = bottom - top + 1;
            ordered.slice(1).forEach(p => p.row.children.splice(p.row.children.indexOf(p.cell), 1));
        } else if (command === "splitCell") {
            first.cell.attrs.colspan = 1; first.cell.attrs.rowspan = 1;
            for (let r = first.top; r <= first.bottom; r++) {
                const row = rows[r].row;
                const after = row.children.findIndex(n => positions.get(n.id)?.left > first.right);
                const newCells = [];
                for (let c = first.left; c <= first.right; c++) if (r !== first.top || c !== first.left) newCells.push(fresh(first.cell.type));
                row.children.splice(after < 0 ? row.children.length : after, 0, ...newCells);
            }
        } else if (["insertRowAbove", "insertRowBelow", "insertIntermediateHeader"].includes(command)) {
            const at = command === "insertRowBelow" ? first.bottom + 1 : first.top;
            const section = first.section, row = this.node("tr");
            const occupied = new Set();
            for (const p of positions.values()) if (p.top < at && p.bottom >= at && p.section === section) { p.cell.attrs.rowspan++; for (let c = p.left; c <= p.right; c++) occupied.add(c); }
            for (let c = 0; c < width; c++) if (!occupied.has(c)) row.children.push(fresh(section.type === "thead" || grid[first.top]?.[c]?.attrs.scope === "row" ? "th" : "td"));
            if (command === "insertIntermediateHeader" && !occupied.size) row.children = [this.node("th", [this.node("p", [{ type: "text", text: String(action.text ?? ""), marks: {} }])], { colspan: width, rowspan: 1 })];
            const local = rows.slice(0, at).filter(x => x.section === section).length;
            section.children.splice(local, 0, row);
        } else if (command === "deleteRow") {
            const at = first.top;
            for (const p of positions.values()) {
                if (p.top < at && p.bottom >= at) p.cell.attrs.rowspan--;
                else if (p.top === at && p.bottom > at && rows[at + 1]?.section === p.section) {
                    p.cell.attrs.rowspan--;
                    const next = rows[at + 1].row, ref = next.children.findIndex(n => positions.get(n.id).left > p.left);
                    next.children.splice(ref < 0 ? next.children.length : ref, 0, p.cell);
                }
            }
            first.section.children.splice(first.section.children.indexOf(first.row), 1);
        } else if (["insertColumnLeft", "insertColumnRight", "deleteColumn"].includes(command)) {
            const at = command === "insertColumnRight" ? first.right + 1 : first.left, deleting = command === "deleteColumn";
            const processed = new Set();
            rows.forEach(({ row, section }, r) => {
                const crossing = grid[r]?.[at];
                const p = crossing && positions.get(crossing.id);
                if (p && (deleting || p.left < at)) {
                    if (processed.has(crossing.id)) return;
                    processed.add(crossing.id);
                    if (deleting && (crossing.attrs.colspan || 1) === 1) p.row.children.splice(p.row.children.indexOf(crossing), 1);
                    else crossing.attrs.colspan = (crossing.attrs.colspan || 1) + (deleting ? -1 : 1);
                } else if (!deleting) {
                    const ref = row.children.findIndex(n => positions.get(n.id).left >= at);
                    row.children.splice(ref < 0 ? row.children.length : ref, 0, fresh(section.type === "thead" ? "th" : "td"));
                }
            });
            if (table.attrs.widths) table.attrs.widths.splice(at, deleting ? 1 : 0, ...(deleting ? [] : [100]));
        } else if (command === "toggleLeftHeader") {
            const body = rows.filter(r => r.section.type !== "thead");
            const enabled = body[0]?.row.children[0]?.type === "th";
            body.forEach(({ row }) => { const cell = row.children[0]; if (cell && (cell.attrs.colspan || 1) === 1) { cell.type = enabled ? "td" : "th"; cell.attrs.scope = enabled ? "" : "row"; } });
        }
        if (!table.children.some(s => s.children.some(r => r.children.length))) {
            const e = this.find(state.doc, table.id);
            if (e?.parent) e.parent.children.splice(e.index, 1);
        }
        this.normalize(state.doc);
        const survivor = this.find(state.doc, first.cell.id) ?? this.entries(state.doc).find(e => e.ancestors.includes(table) && this.TEXT_BLOCKS.has(e.node.type));
        const pos = survivor?.start ?? Math.min(state.selection.focus, this.size(state.doc) - 1);
        state.selection = { anchor: pos, focus: pos };
    }
};
