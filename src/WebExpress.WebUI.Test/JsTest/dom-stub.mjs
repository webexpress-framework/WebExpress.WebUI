/**
 * Minimal DOM stub for the headless WebUI controller tests.
 *
 * It implements only the surface that webexpress.webui.js touches during load
 * and during the controller lifecycle: element creation, child manipulation,
 * attributes, class list, dataset, event listeners, isConnected, and a
 * document with a body, a documentElement, a cookie and working listeners.
 * It is not a browser and it is not jsdom.
 */

class TextNode {
    constructor(text) {
        this.nodeType = 3;
        this.parentNode = null;
        this._text = String(text);
    }
    get textContent() { return this._text; }
    set textContent(value) { this._text = String(value); }
}

class ClassList {
    constructor(owner) { this._owner = owner; }
    add(name) { this._owner._classes.add(name); }
    remove(name) { this._owner._classes.delete(name); }
    contains(name) { return this._owner._classes.has(name); }
    toggle(name, force) {
        const has = this._owner._classes.has(name);
        const shouldHave = force === undefined ? !has : !!force;
        if (shouldHave) { this._owner._classes.add(name); } else { this._owner._classes.delete(name); }
        return shouldHave;
    }
}

class Element {
    constructor(tag) {
        this.nodeType = 1;
        this.tagName = String(tag).toUpperCase();
        this.childNodes = [];
        this.parentNode = null;
        this._attrs = new Map();
        this._classes = new Set();
        this._listeners = {};
        this._id = null;
        this.dataset = {};
        this.style = {};
        this.value = "";
        this.checked = false;
    }

    get id() { return this._id; }
    set id(value) { this._id = value == null ? null : String(value); }

    get className() { return Array.from(this._classes).join(" "); }
    set className(value) { this._classes = new Set(String(value || "").split(/\s+/).filter(Boolean)); }

    get classList() { return new ClassList(this); }

    get children() { return this.childNodes.filter((n) => n.nodeType === 1); }

    /**
     * An element is connected when its ancestor chain reaches the document
     * body, which the stub marks as the root.
     */
    get isConnected() {
        let current = this;
        while (current) {
            if (current._isRoot) { return true; }
            current = current.parentNode;
        }
        return false;
    }

    appendChild(node) {
        if (node.parentNode) { node.parentNode.removeChild(node); }
        this.childNodes.push(node);
        node.parentNode = this;
        return node;
    }

    insertBefore(node, reference) {
        if (node.parentNode) { node.parentNode.removeChild(node); }
        if (reference == null) {
            this.childNodes.push(node);
            node.parentNode = this;
            return node;
        }
        const index = this.childNodes.indexOf(reference);
        if (index === -1) { this.childNodes.push(node); } else { this.childNodes.splice(index, 0, node); }
        node.parentNode = this;
        return node;
    }

    prepend(node) {
        this.insertBefore(node, this.childNodes[0] || null);
    }

    removeChild(node) {
        const index = this.childNodes.indexOf(node);
        if (index !== -1) { this.childNodes.splice(index, 1); }
        node.parentNode = null;
        return node;
    }

    setAttribute(name, value) {
        if (name === "id") { this._id = String(value); return; }
        this._attrs.set(name, String(value));
    }
    getAttribute(name) {
        if (name === "id") { return this._id; }
        if (name === "class") { return this.className; }
        return this._attrs.has(name) ? this._attrs.get(name) : null;
    }
    hasAttribute(name) {
        if (name === "id") { return this._id != null; }
        return this._attrs.has(name);
    }
    removeAttribute(name) {
        if (name === "id") { this._id = null; return; }
        this._attrs.delete(name);
    }

    matches() { return false; }
    closest() { return null; }
    querySelector() { return null; }

    /**
     * Returns all descendant elements; selector filtering is not implemented,
     * which matches how the controller uses it (the '*' selector).
     */
    querySelectorAll() {
        const result = [];
        const walk = (node) => {
            for (const child of node.childNodes) {
                if (child.nodeType === 1) {
                    result.push(child);
                    walk(child);
                }
            }
        };
        walk(this);
        return result;
    }

    get textContent() {
        return this.childNodes.map((n) => (n.nodeType === 3 ? n._text : n.textContent)).join("");
    }
    set textContent(value) {
        this.childNodes.forEach((n) => { n.parentNode = null; });
        this.childNodes = [];
        if (value != null && value !== "") { this.appendChild(new TextNode(String(value))); }
    }

    addEventListener(type, handler) {
        (this._listeners[type] || (this._listeners[type] = new Set())).add(handler);
    }
    removeEventListener(type, handler) {
        if (this._listeners[type]) { this._listeners[type].delete(handler); }
    }
    dispatchEvent(event) {
        const set = this._listeners[event.type];
        if (set) { Array.from(set).forEach((fn) => fn(event)); }
        return true;
    }
}

/**
 * Finds an element with the given id in a subtree.
 * @param {Element} node - The subtree root.
 * @param {string} id - The id to find.
 * @returns {Element|null} The element or null.
 */
function findById(node, id) {
    if (node.nodeType === 1 && node.id === id) {
        return node;
    }
    for (const child of node.childNodes || []) {
        const found = findById(child, id);
        if (found) {
            return found;
        }
    }
    return null;
}

/**
 * Creates a fresh document stub for the WebUI controller.
 * @returns {object} The document stub.
 */
export function createDocument() {
    const body = new Element("body");
    body._isRoot = true;
    const documentElement = new Element("html");
    const listeners = {};

    return {
        baseURI: "http://localhost/",
        readyState: "complete",
        cookie: "",
        body,
        documentElement,
        createElement(tag) { return new Element(tag); },
        createElementNS(namespace, tag) { return new Element(tag); },
        createDocumentFragment() { return new Element("#document-fragment"); },
        createTextNode(text) { return new TextNode(text); },
        getElementById(id) { return findById(body, String(id)); },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        addEventListener(type, handler) {
            (listeners[type] || (listeners[type] = new Set())).add(handler);
        },
        removeEventListener(type, handler) {
            if (listeners[type]) { listeners[type].delete(handler); }
        },
        dispatchEvent(event) {
            const set = listeners[event.type];
            if (set) { Array.from(set).forEach((fn) => fn(event)); }
            return true;
        }
    };
}

export { Element, TextNode };
