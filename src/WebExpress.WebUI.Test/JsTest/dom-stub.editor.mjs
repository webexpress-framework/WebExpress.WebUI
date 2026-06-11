/**
 * Rich DOM stub for the headless editor engine tests.
 *
 * The editor engines (EditorSelection, EditorFormat, EditorList,
 * EditorPainter) are built on Range surgery, so unlike dom-stub.mjs this stub
 * implements the DOM surface those engines actually exercise: a node tree
 * with text splitting, a selector engine for the selectors used in
 * webexpress.webui.editor.js, TreeWalker, Selection and - most importantly -
 * live Ranges whose boundaries follow insertions, removals, text splits and
 * data replacements, plus a spec-compliant extractContents. The live-update
 * and extraction semantics follow the DOM standard closely, because the
 * editor bugs under test (empty <li> shells from cross-block extraction)
 * only reproduce with faithful behaviour. It is not a browser and not jsdom.
 */

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const DOCUMENT_FRAGMENT_NODE = 11;

const VOID_TAGS = new Set(["BR", "HR", "IMG", "INPUT"]);

/**
 * Converts a camelCase css property name to its kebab-case form.
 * @param {string} name - The property name.
 * @returns {string} The kebab-case name.
 */
function toKebab(name) {
    return String(name).replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

/**
 * Creates the style object of an element: a Proxy over a kebab-case map so
 * the editor can read and write arbitrary camelCase properties and cssText.
 * @param {EditorElement} owner - The owning element.
 * @returns {object} The style proxy.
 */
function createStyle(owner) {
    const target = {
        _map: new Map(),
        get cssText() {
            return serializeStyle(this._map);
        },
        set cssText(value) {
            this._map = parseStyle(value);
        }
    };
    return new Proxy(target, {
        get(t, prop) {
            if (prop === "cssText" || prop === "_map") {
                return t[prop];
            }
            if (typeof prop !== "string") {
                return undefined;
            }
            return t._map.get(toKebab(prop)) || "";
        },
        set(t, prop, value) {
            if (prop === "cssText" || prop === "_map") {
                t[prop] = value;
                return true;
            }
            const key = toKebab(prop);
            if (value === "" || value == null) {
                t._map.delete(key);
            } else {
                t._map.set(key, String(value));
            }
            return true;
        }
    });
}

/**
 * Parses a css text into a kebab-case property map.
 * @param {string} text - The css text.
 * @returns {Map<string,string>} The property map.
 */
function parseStyle(text) {
    const map = new Map();
    String(text || "").split(";").forEach((part) => {
        const idx = part.indexOf(":");
        if (idx === -1) {
            return;
        }
        const key = part.slice(0, idx).trim();
        const value = part.slice(idx + 1).trim();
        if (key && value) {
            map.set(key, value);
        }
    });
    return map;
}

/**
 * Serializes a style property map back into css text.
 * @param {Map<string,string>} map - The property map.
 * @returns {string} The css text.
 */
function serializeStyle(map) {
    return Array.from(map.entries()).map(([k, v]) => `${k}: ${v};`).join(" ");
}

/**
 * Base node of the stub tree.
 */
class EditorNode {
    constructor(doc, nodeType) {
        this.ownerDocument = doc;
        this.nodeType = nodeType;
        this.parentNode = null;
        this.childNodes = [];
    }

    get parentElement() {
        return this.parentNode && this.parentNode.nodeType === ELEMENT_NODE
            ? this.parentNode : null;
    }

    get firstChild() { return this.childNodes[0] || null; }
    get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }

    get nextSibling() {
        if (!this.parentNode) {
            return null;
        }
        const i = this.parentNode.childNodes.indexOf(this);
        return this.parentNode.childNodes[i + 1] || null;
    }

    get previousSibling() {
        if (!this.parentNode) {
            return null;
        }
        const i = this.parentNode.childNodes.indexOf(this);
        return i > 0 ? this.parentNode.childNodes[i - 1] : null;
    }

    get firstElementChild() {
        return this.childNodes.find((n) => n.nodeType === ELEMENT_NODE) || null;
    }

    get lastElementChild() {
        for (let i = this.childNodes.length - 1; i >= 0; i--) {
            if (this.childNodes[i].nodeType === ELEMENT_NODE) {
                return this.childNodes[i];
            }
        }
        return null;
    }

    get nextElementSibling() {
        let n = this.nextSibling;
        while (n && n.nodeType !== ELEMENT_NODE) {
            n = n.nextSibling;
        }
        return n;
    }

    get previousElementSibling() {
        let n = this.previousSibling;
        while (n && n.nodeType !== ELEMENT_NODE) {
            n = n.previousSibling;
        }
        return n;
    }

    get children() {
        return this.childNodes.filter((n) => n.nodeType === ELEMENT_NODE);
    }

    contains(node) {
        let n = node;
        while (n) {
            if (n === this) {
                return true;
            }
            n = n.parentNode;
        }
        return false;
    }

    /**
     * Returns the bit mask describing where other sits relative to this node,
     * implementing the subset (FOLLOWING, PRECEDING, CONTAINS, CONTAINED_BY)
     * the editor relies on.
     * @param {EditorNode} other - The other node.
     * @returns {number} The position mask.
     */
    compareDocumentPosition(other) {
        if (other === this) {
            return 0;
        }
        if (this.contains(other)) {
            return 16 | 4; // contained by this, treated as following
        }
        if (other.contains(this)) {
            return 8 | 2; // contains this, treated as preceding
        }
        const cmp = comparePoints(pointBefore(this).node, pointBefore(this).offset,
            pointBefore(other).node, pointBefore(other).offset);
        if (cmp === null) {
            return 1; // disconnected
        }
        return cmp < 0 ? 4 : 2;
    }

    appendChild(node) {
        return this.insertBefore(node, null);
    }

    insertBefore(node, reference) {
        if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
            const items = node.childNodes.slice();
            items.forEach((child) => this.insertBefore(child, reference));
            return node;
        }
        if (node.parentNode) {
            removeNode(node);
        }
        const index = reference == null
            ? this.childNodes.length
            : this.childNodes.indexOf(reference);
        insertNodeAt(this, node, index === -1 ? this.childNodes.length : index);
        return node;
    }

    removeChild(node) {
        if (node.parentNode !== this) {
            throw new Error("removeChild: node is not a child");
        }
        removeNode(node);
        return node;
    }

    replaceChild(newNode, oldNode) {
        const index = this.childNodes.indexOf(oldNode);
        if (index === -1) {
            throw new Error("replaceChild: node is not a child");
        }
        removeNode(oldNode);
        if (newNode.parentNode) {
            removeNode(newNode);
        }
        insertNodeAt(this, newNode, index);
        return oldNode;
    }

    remove() {
        if (this.parentNode) {
            removeNode(this);
        }
    }
}

/**
 * Text node with the splitText semantics Range.insertNode depends on.
 */
class EditorText extends EditorNode {
    constructor(doc, data) {
        super(doc, TEXT_NODE);
        this._data = String(data);
    }

    get textContent() { return this._data; }
    set textContent(value) { this._data = String(value); }

    get data() { return this._data; }
    set data(value) { this._data = String(value); }

    get length() { return this._data.length; }

    cloneNode() {
        return new EditorText(this.ownerDocument, this._data);
    }

    /**
     * Splits the text at offset, inserts the tail as a new sibling and applies
     * the standard live-range adjustments for a split: the generic insertion
     * shift first (boundaries past the insertion index), then the
     * split-specific moves into the tail and past the original node.
     * @param {number} offset - The split offset.
     * @returns {EditorText} The new node carrying the tail.
     */
    splitText(offset) {
        const tail = new EditorText(this.ownerDocument, this._data.slice(offset));
        this._data = this._data.slice(0, offset);
        const parent = this.parentNode;
        if (parent) {
            const index = parent.childNodes.indexOf(this);
            insertNodeAt(parent, tail, index + 1);
            forEachBoundary(this.ownerDocument, (range, side, node, off) => {
                if (node === this && off > offset) {
                    range[side] = { node: tail, offset: off - offset };
                } else if (node === parent && off === index + 1) {
                    range[side] = { node: parent, offset: off + 1 };
                }
            });
        }
        return tail;
    }
}

/**
 * Element node with the attribute, class, style and selector surface used by
 * the editor engines.
 */
class EditorElement extends EditorNode {
    constructor(doc, tag) {
        super(doc, ELEMENT_NODE);
        this.tagName = String(tag).toUpperCase();
        this._attrs = new Map();
        this._classes = new Set();
        this.style = createStyle(this);
        this._listeners = {};
    }

    get className() { return Array.from(this._classes).join(" "); }
    set className(value) {
        this._classes = new Set(String(value || "").split(/\s+/).filter(Boolean));
    }

    get classList() {
        const owner = this;
        return {
            add(name) { owner._classes.add(name); },
            remove(name) { owner._classes.delete(name); },
            contains(name) { return owner._classes.has(name); },
            toggle(name, force) {
                const has = owner._classes.has(name);
                const should = force === undefined ? !has : !!force;
                if (should) { owner._classes.add(name); } else { owner._classes.delete(name); }
                return should;
            }
        };
    }

    setAttribute(name, value) {
        if (name === "class") {
            this.className = value;
            return;
        }
        if (name === "style") {
            this.style._map = parseStyle(value);
            return;
        }
        this._attrs.set(name, String(value));
    }

    getAttribute(name) {
        if (name === "class") {
            return this._classes.size ? this.className : null;
        }
        if (name === "style") {
            return this.style._map.size ? serializeStyle(this.style._map) : null;
        }
        return this._attrs.has(name) ? this._attrs.get(name) : null;
    }

    hasAttribute(name) {
        return this.getAttribute(name) != null;
    }

    removeAttribute(name) {
        if (name === "class") {
            this._classes.clear();
            return;
        }
        if (name === "style") {
            this.style._map.clear();
            return;
        }
        this._attrs.delete(name);
    }

    /** Attribute view for EditorFormat._copyAttributes. */
    get attributes() {
        const out = [];
        this._attrs.forEach((value, name) => out.push({ name, value }));
        if (this._classes.size) {
            out.push({ name: "class", value: this.className });
        }
        if (this.style._map.size) {
            out.push({ name: "style", value: serializeStyle(this.style._map) });
        }
        return out;
    }

    cloneNode(deep) {
        const clone = new EditorElement(this.ownerDocument, this.tagName);
        this._attrs.forEach((value, name) => clone._attrs.set(name, value));
        clone._classes = new Set(this._classes);
        clone.style._map = new Map(this.style._map);
        if (deep) {
            this.childNodes.forEach((c) => clone.appendChild(c.cloneNode(true)));
        }
        return clone;
    }

    get textContent() {
        return this.childNodes.map((n) => n.textContent).join("");
    }

    set textContent(value) {
        this.childNodes.slice().forEach((n) => removeNode(n));
        if (value != null && value !== "") {
            this.appendChild(new EditorText(this.ownerDocument, value));
        }
    }

    get innerHTML() {
        return this.childNodes.map(serializeNode).join("");
    }

    set innerHTML(value) {
        this.childNodes.slice().forEach((n) => removeNode(n));
        parseHtmlInto(this, value == null ? "" : String(value), this.ownerDocument);
    }

    matches(selector) {
        return matchesSelector(this, selector);
    }

    closest(selector) {
        let el = this;
        while (el && el.nodeType === ELEMENT_NODE) {
            if (matchesSelector(el, selector)) {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    querySelector(selector) {
        return queryAll(this, selector)[0] || null;
    }

    querySelectorAll(selector) {
        return queryAll(this, selector);
    }

    addEventListener(type, handler) {
        (this._listeners[type] || (this._listeners[type] = new Set())).add(handler);
    }

    removeEventListener(type, handler) {
        if (this._listeners[type]) {
            this._listeners[type].delete(handler);
        }
    }

    focus() { }
}

/**
 * Document fragment; shares the element traversal and query surface.
 */
class EditorFragment extends EditorNode {
    constructor(doc) {
        super(doc, DOCUMENT_FRAGMENT_NODE);
    }

    get textContent() {
        return this.childNodes.map((n) => n.textContent).join("");
    }

    querySelector(selector) {
        return queryAll(this, selector)[0] || null;
    }

    querySelectorAll(selector) {
        return queryAll(this, selector);
    }
}

/**
 * Decodes the minimal entity set the serializer and the editor sources use.
 * @param {string} text - The encoded text.
 * @returns {string} The decoded text.
 */
function decodeEntities(text) {
    return text
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
}

/**
 * Minimal html parser backing the innerHTML setter. It understands the
 * markup the editor sources emit: elements with double/single quoted or
 * bare attributes, self-closing and void tags, and text. No comments,
 * CDATA or entity tables beyond the basic set.
 * @param {EditorNode} parent - The node receiving the parsed children.
 * @param {string} html - The markup.
 * @param {object} doc - The owning document stub.
 */
function parseHtmlInto(parent, html, doc) {
    const tokenRe = /<\/\s*([a-zA-Z][\w-]*)\s*>|<\s*([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)\s*>|([^<]+)/g;
    const attrRe = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    const stack = [parent];
    let m;
    while ((m = tokenRe.exec(html)) !== null) {
        if (m[5] !== undefined) {
            const text = decodeEntities(m[5]);
            if (text !== "") {
                stack[stack.length - 1].appendChild(new EditorText(doc, text));
            }
            continue;
        }
        if (m[1]) {
            const tag = m[1].toUpperCase();
            for (let i = stack.length - 1; i > 0; i--) {
                if (stack[i].tagName === tag) {
                    stack.length = i;
                    break;
                }
            }
            continue;
        }
        const el = new EditorElement(doc, m[2]);
        attrRe.lastIndex = 0;
        let a;
        while ((a = attrRe.exec(m[3] || "")) !== null) {
            const value = a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : a[4] !== undefined ? a[4] : "";
            el.setAttribute(a[1], decodeEntities(value));
        }
        stack[stack.length - 1].appendChild(el);
        if (!m[4] && !VOID_TAGS.has(el.tagName)) {
            stack.push(el);
        }
    }
}

/**
 * Serializes a node to html for test assertions. Attribute order is
 * deterministic: explicit attributes in insertion order, then class, then
 * style.
 * @param {EditorNode} node - The node to serialize.
 * @returns {string} The html string.
 */
function serializeNode(node) {
    if (node.nodeType === TEXT_NODE) {
        return node.textContent;
    }
    if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
        return node.childNodes.map(serializeNode).join("");
    }
    const tag = node.tagName.toLowerCase();
    let attrs = "";
    node.attributes.forEach((a) => {
        attrs += ` ${a.name}="${a.value}"`;
    });
    if (VOID_TAGS.has(node.tagName)) {
        return `<${tag}${attrs}>`;
    }
    return `<${tag}${attrs}>${node.childNodes.map(serializeNode).join("")}</${tag}>`;
}

// ---------------------------------------------------------------------------
// selector engine: supports "*", tag names, .class, [attr], [attr="value"],
// compound selectors and comma lists - the grammar the editor sources use
// ---------------------------------------------------------------------------

/**
 * Parses a simple (compound) selector into matchable parts.
 * @param {string} selector - The simple selector.
 * @returns {{tag:string|null, classes:string[], attrs:{name:string, value:string|null}[]}}
 */
function parseSimpleSelector(selector) {
    const spec = { tag: null, classes: [], attrs: [] };
    let rest = selector.trim();
    const tagMatch = /^(\*|[a-zA-Z][a-zA-Z0-9-]*)/.exec(rest);
    if (tagMatch) {
        spec.tag = tagMatch[1] === "*" ? null : tagMatch[1].toUpperCase();
        rest = rest.slice(tagMatch[1].length);
    }
    const partRe = /\.([\w-]+)|\[([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\]/g;
    let m;
    while ((m = partRe.exec(rest)) !== null) {
        if (m[1]) {
            spec.classes.push(m[1]);
        } else {
            const value = m[3] !== undefined ? m[3]
                : m[4] !== undefined ? m[4]
                    : m[5] !== undefined ? m[5] : null;
            spec.attrs.push({ name: m[2], value });
        }
    }
    return spec;
}

/**
 * Returns whether an element matches a selector list.
 * @param {EditorElement} el - The element.
 * @param {string} selector - The selector list.
 * @returns {boolean}
 */
function matchesSelector(el, selector) {
    return String(selector).split(",").some((simple) => {
        const spec = parseSimpleSelector(simple);
        if (spec.tag && el.tagName !== spec.tag) {
            return false;
        }
        if (spec.classes.some((c) => !el._classes.has(c))) {
            return false;
        }
        return spec.attrs.every((a) => {
            const actual = el.getAttribute(a.name);
            return a.value == null ? actual != null : actual === a.value;
        });
    });
}

/**
 * Collects descendant elements matching a selector, in document order.
 * @param {EditorNode} root - The subtree root.
 * @param {string} selector - The selector list.
 * @returns {EditorElement[]}
 */
function queryAll(root, selector) {
    const out = [];
    const walk = (node) => {
        node.childNodes.forEach((child) => {
            if (child.nodeType === ELEMENT_NODE) {
                if (matchesSelector(child, selector)) {
                    out.push(child);
                }
                walk(child);
            }
        });
    };
    walk(root);
    return out;
}

// ---------------------------------------------------------------------------
// boundary points and live range bookkeeping
// ---------------------------------------------------------------------------

/**
 * Returns the boundary point immediately before a node.
 * @param {EditorNode} node - The node.
 * @returns {{node:EditorNode, offset:number}}
 */
function pointBefore(node) {
    const parent = node.parentNode;
    if (!parent) {
        return { node, offset: 0 };
    }
    return { node: parent, offset: parent.childNodes.indexOf(node) };
}

/**
 * Returns the length of a node in boundary units (characters for text,
 * children otherwise).
 * @param {EditorNode} node - The node.
 * @returns {number}
 */
function nodeLength(node) {
    return node.nodeType === TEXT_NODE ? node.length : node.childNodes.length;
}

/**
 * Compares two boundary points in tree order. Boundaries are compared as
 * root paths extended by the offset; a path that is a prefix of the other
 * sorts first, which matches the DOM ordering of (parent, index) versus a
 * point inside the child.
 * @returns {number|null} -1, 0, 1 or null when disconnected.
 */
function comparePoints(nodeA, offsetA, nodeB, offsetB) {
    const pathTo = (node) => {
        const path = [];
        let n = node;
        while (n.parentNode) {
            path.unshift(n.parentNode.childNodes.indexOf(n));
            n = n.parentNode;
        }
        return { root: n, path };
    };
    const a = pathTo(nodeA);
    const b = pathTo(nodeB);
    if (a.root !== b.root) {
        return null;
    }
    const pa = [...a.path, offsetA];
    const pb = [...b.path, offsetB];
    const len = Math.min(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        if (pa[i] !== pb[i]) {
            return pa[i] < pb[i] ? -1 : 1;
        }
    }
    return pa.length === pb.length ? 0 : (pa.length < pb.length ? -1 : 1);
}

/**
 * Iterates every boundary (start and end) of every live range of a document.
 * @param {object} doc - The stub document.
 * @param {function} fn - Callback (range, sideKey, node, offset).
 */
function forEachBoundary(doc, fn) {
    doc._ranges.forEach((range) => {
        fn(range, "_start", range._start.node, range._start.offset);
        fn(range, "_end", range._end.node, range._end.offset);
    });
}

/**
 * Inserts node into parent at index and applies the standard live-range
 * insertion adjustment (boundaries in parent past the index move right).
 */
function insertNodeAt(parent, node, index) {
    parent.childNodes.splice(index, 0, node);
    node.parentNode = parent;
    forEachBoundary(parent.ownerDocument, (range, side, bNode, bOffset) => {
        if (bNode === parent && bOffset > index) {
            range[side] = { node: parent, offset: bOffset + 1 };
        }
    });
}

/**
 * Removes node from its parent and applies the standard live-range removal
 * adjustments: boundaries inside the node collapse to its old position,
 * boundaries in the parent past it move left.
 */
function removeNode(node) {
    const parent = node.parentNode;
    const index = parent.childNodes.indexOf(node);
    forEachBoundary(node.ownerDocument, (range, side, bNode, bOffset) => {
        if (node.contains(bNode)) {
            range[side] = { node: parent, offset: index };
        } else if (bNode === parent && bOffset > index) {
            range[side] = { node: parent, offset: bOffset - 1 };
        }
    });
    parent.childNodes.splice(index, 1);
    node.parentNode = null;
}

/**
 * Deletes count characters of a text node at offset and applies the standard
 * live-range replace-data adjustments.
 */
function deleteData(node, offset, count) {
    node._data = node._data.slice(0, offset) + node._data.slice(offset + count);
    forEachBoundary(node.ownerDocument, (range, side, bNode, bOffset) => {
        if (bNode !== node) {
            return;
        }
        if (bOffset > offset && bOffset <= offset + count) {
            range[side] = { node, offset };
        } else if (bOffset > offset + count) {
            range[side] = { node, offset: bOffset - count };
        }
    });
}

// ---------------------------------------------------------------------------
// Range
// ---------------------------------------------------------------------------

class EditorRange {
    static START_TO_START = 0;
    static START_TO_END = 1;
    static END_TO_END = 2;
    static END_TO_START = 3;

    constructor(doc) {
        this._doc = doc;
        this._start = { node: doc.body, offset: 0 };
        this._end = { node: doc.body, offset: 0 };
        doc._ranges.add(this);
    }

    get startContainer() { return this._start.node; }
    get startOffset() { return this._start.offset; }
    get endContainer() { return this._end.node; }
    get endOffset() { return this._end.offset; }

    get collapsed() {
        return this._start.node === this._end.node && this._start.offset === this._end.offset;
    }

    get commonAncestorContainer() {
        let n = this._start.node;
        while (n) {
            if (n.contains(this._end.node)) {
                return n;
            }
            n = n.parentNode;
        }
        return null;
    }

    setStart(node, offset) {
        this._start = { node, offset };
        if (comparePoints(node, offset, this._end.node, this._end.offset) > 0) {
            this._end = { node, offset };
        }
    }

    setEnd(node, offset) {
        this._end = { node, offset };
        if (comparePoints(this._start.node, this._start.offset, node, offset) > 0) {
            this._start = { node, offset };
        }
    }

    setStartBefore(node) { this.setStart(node.parentNode, pointBefore(node).offset); }
    setStartAfter(node) { this.setStart(node.parentNode, pointBefore(node).offset + 1); }
    setEndBefore(node) { this.setEnd(node.parentNode, pointBefore(node).offset); }
    setEndAfter(node) { this.setEnd(node.parentNode, pointBefore(node).offset + 1); }

    selectNode(node) {
        const p = pointBefore(node);
        this._start = { node: p.node, offset: p.offset };
        this._end = { node: p.node, offset: p.offset + 1 };
    }

    selectNodeContents(node) {
        this._start = { node, offset: 0 };
        this._end = { node, offset: nodeLength(node) };
    }

    collapse(toStart) {
        if (toStart) {
            this._end = { ...this._start };
        } else {
            this._start = { ...this._end };
        }
    }

    cloneRange() {
        const clone = new EditorRange(this._doc);
        clone._start = { ...this._start };
        clone._end = { ...this._end };
        return clone;
    }

    compareBoundaryPoints(how, sourceRange) {
        const own = (how === EditorRange.START_TO_START || how === EditorRange.START_TO_END)
            ? this._start : this._end;
        const other = (how === EditorRange.START_TO_START || how === EditorRange.END_TO_START)
            ? sourceRange._start : sourceRange._end;
        return comparePoints(own.node, own.offset, other.node, other.offset) || 0;
    }

    /**
     * Inserts a node at the start boundary, splitting a text container the
     * way the DOM standard prescribes.
     */
    insertNode(node) {
        const { node: container, offset } = this._start;
        if (container.nodeType === TEXT_NODE) {
            const tail = container.splitText(offset);
            container.parentNode.insertBefore(node, tail);
        } else {
            container.insertBefore(node, container.childNodes[offset] || null);
        }
    }

    /**
     * Returns whether a node intersects the range, following the standard
     * boundary formulation.
     */
    intersectsNode(node) {
        const parent = node.parentNode;
        if (!parent) {
            return true;
        }
        const offset = parent.childNodes.indexOf(node);
        const startsBeforeNodeEnd =
            comparePoints(this._start.node, this._start.offset, parent, offset + 1) < 0;
        const endsAfterNodeStart =
            comparePoints(this._end.node, this._end.offset, parent, offset) > 0;
        return startsBeforeNodeEnd && endsAfterNodeStart;
    }

    /**
     * Extracts the range contents into a fragment, implementing the DOM
     * standard extraction algorithm including the cloning of partially
     * contained ancestors. The faithful cloning is essential: the editor bug
     * around clear-format on lists only reproduces with it.
     * @returns {EditorFragment}
     */
    extractContents() {
        const doc = this._doc;
        const frag = new EditorFragment(doc);
        if (this.collapsed) {
            return frag;
        }

        const osn = this._start.node;
        const oso = this._start.offset;
        const oen = this._end.node;
        const oeo = this._end.offset;

        if (osn === oen && osn.nodeType === TEXT_NODE) {
            const clone = new EditorText(doc, osn.data.slice(oso, oeo));
            frag.appendChild(clone);
            deleteData(osn, oso, oeo - oso);
            return frag;
        }

        const commonAncestor = this.commonAncestorContainer;

        let firstPartial = null;
        if (!osn.contains(oen)) {
            firstPartial = commonAncestor.childNodes.find((c) => c.contains(osn)) || null;
        }
        let lastPartial = null;
        if (!oen.contains(osn)) {
            lastPartial = commonAncestor.childNodes.find((c) => c.contains(oen)) || null;
        }

        const contained = commonAncestor.childNodes.filter((c) =>
            comparePoints(c.parentNode, pointBefore(c).offset, osn, oso) >= 0 &&
            comparePoints(c.parentNode, pointBefore(c).offset + 1, oen, oeo) <= 0 &&
            c !== firstPartial && c !== lastPartial);

        // the collapse point is computed before any mutation, per the standard
        let newNode;
        let newOffset;
        if (osn.contains(oen)) {
            newNode = osn;
            newOffset = oso;
        } else {
            let ref = osn;
            while (ref.parentNode && !ref.parentNode.contains(oen)) {
                ref = ref.parentNode;
            }
            newNode = ref.parentNode;
            newOffset = pointBefore(ref).offset + 1;
        }

        if (firstPartial && firstPartial.nodeType === TEXT_NODE) {
            const clone = new EditorText(doc, osn.data.slice(oso));
            frag.appendChild(clone);
            deleteData(osn, oso, osn.length - oso);
        } else if (firstPartial) {
            const clone = firstPartial.cloneNode(false);
            frag.appendChild(clone);
            const sub = new EditorRange(doc);
            sub._start = { node: osn, offset: oso };
            sub._end = { node: firstPartial, offset: nodeLength(firstPartial) };
            const subFrag = sub.extractContents();
            doc._ranges.delete(sub);
            subFrag.childNodes.slice().forEach((c) => clone.appendChild(c));
        }

        contained.forEach((c) => frag.appendChild(c));

        if (lastPartial && lastPartial.nodeType === TEXT_NODE) {
            const clone = new EditorText(doc, oen.data.slice(0, oeo));
            frag.appendChild(clone);
            deleteData(oen, 0, oeo);
        } else if (lastPartial) {
            const clone = lastPartial.cloneNode(false);
            frag.appendChild(clone);
            const sub = new EditorRange(doc);
            sub._start = { node: lastPartial, offset: 0 };
            sub._end = { node: oen, offset: oeo };
            const subFrag = sub.extractContents();
            doc._ranges.delete(sub);
            subFrag.childNodes.slice().forEach((c) => clone.appendChild(c));
        }

        this._start = { node: newNode, offset: newOffset };
        this._end = { node: newNode, offset: newOffset };
        return frag;
    }

    deleteContents() {
        this.extractContents();
    }

    /**
     * Returns the concatenated text content between the boundaries.
     */
    toString() {
        if (this.collapsed) {
            return "";
        }
        const root = this.commonAncestorContainer;
        if (!root) {
            return "";
        }
        if (root.nodeType === TEXT_NODE) {
            return root.data.slice(this._start.offset, this._end.offset);
        }
        let out = "";
        const visit = (node) => {
            if (node.nodeType === TEXT_NODE) {
                const from = node === this._start.node ? this._start.offset
                    : comparePoints(node, 0, this._start.node, this._start.offset) < 0 ? node.length : 0;
                const to = node === this._end.node ? this._end.offset
                    : comparePoints(node, node.length, this._end.node, this._end.offset) > 0 ? 0 : node.length;
                if (to > from) {
                    out += node.data.slice(from, to);
                }
                return;
            }
            node.childNodes.forEach(visit);
        };
        visit(root);
        return out;
    }
}

// ---------------------------------------------------------------------------
// TreeWalker and Selection
// ---------------------------------------------------------------------------

/**
 * Minimal SHOW_TEXT TreeWalker: nextNode() yields the text nodes of the
 * subtree in document order, evaluated against the live tree.
 */
class TextWalker {
    constructor(root) {
        this._root = root;
        this._current = root;
    }

    nextNode() {
        let n = this._next(this._current);
        while (n && n.nodeType !== TEXT_NODE) {
            n = this._next(n);
        }
        if (n) {
            this._current = n;
        }
        return n;
    }

    _next(node) {
        if (node.firstChild) {
            return node.firstChild;
        }
        let n = node;
        while (n && n !== this._root) {
            if (n.nextSibling) {
                return n.nextSibling;
            }
            n = n.parentNode;
        }
        return null;
    }
}

class EditorSelectionStub {
    constructor() {
        this._ranges = [];
    }

    get rangeCount() { return this._ranges.length; }

    get anchorNode() {
        return this._ranges.length ? this._ranges[0].startContainer : null;
    }

    getRangeAt(index) { return this._ranges[index]; }

    addRange(range) { this._ranges.push(range); }

    removeAllRanges() { this._ranges = []; }
}

// ---------------------------------------------------------------------------
// document factory
// ---------------------------------------------------------------------------

/**
 * Creates a fresh document stub for the editor engine tests, including the
 * window and the global constants the editor sources expect.
 * @returns {{document:object, window:object, globals:object}}
 */
export function createEditorDocument() {
    const listeners = {};
    const selection = new EditorSelectionStub();

    const doc = {
        _ranges: new Set(),
        createElement(tag) { return new EditorElement(doc, tag); },
        createTextNode(text) { return new EditorText(doc, text); },
        createDocumentFragment() { return new EditorFragment(doc); },
        createRange() { return new EditorRange(doc); },
        createTreeWalker(root) { return new TextWalker(root); },
        getSelection() { return selection; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        addEventListener(type, handler) {
            (listeners[type] || (listeners[type] = new Set())).add(handler);
        },
        removeEventListener(type, handler) {
            if (listeners[type]) { listeners[type].delete(handler); }
        },
        execCommand() { return false; },
        queryCommandState() { return false; }
    };
    doc.body = new EditorElement(doc, "body");
    doc.documentElement = new EditorElement(doc, "html");

    const window = {
        getSelection() { return selection; },
        getComputedStyle(el) { return el.style; }
    };

    const globals = {
        document: doc,
        window,
        getComputedStyle: window.getComputedStyle,
        Node: {
            ELEMENT_NODE,
            TEXT_NODE,
            DOCUMENT_POSITION_PRECEDING: 2,
            DOCUMENT_POSITION_FOLLOWING: 4,
            DOCUMENT_POSITION_CONTAINS: 8,
            DOCUMENT_POSITION_CONTAINED_BY: 16
        },
        NodeFilter: { SHOW_TEXT: 4 },
        Range: EditorRange
    };

    return { document: doc, window, selection, globals };
}

export { serializeNode };
