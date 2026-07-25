/**
 * Headless test harness for the WebExpress.WebUI client runtime.
 *
 * It loads the real webexpress.webui.js into an isolated vm context that
 * carries the host globals the module needs at load time: a minimal document
 * with a body, a documentElement and a cookie, a MutationObserver stub, a
 * navigator and a CustomEvent. The MutationObserver never fires on its own;
 * tests drive the controller deterministically by calling handleMutations
 * with synthetic mutation records. Each call to loadWebUi returns a fresh,
 * isolated runtime, so tests do not share state.
 */

import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDocument, Element, SvgElement } from "./dom-stub.mjs";

// the harness lives in WebExpress.WebUI/src/WebExpress.WebUI.Test/JsTest and
// loads the shipped sources from the sibling WebExpress.WebUI project
const here = path.dirname(fileURLToPath(import.meta.url));
const assetsJs = path.resolve(here, "..", "..", "WebExpress.WebUI", "Assets", "js");

/**
 * Resolves the absolute path of a WebExpress.WebUI asset by file name.
 * @param {string} name - The asset file name, for example "bind/default.js".
 * @returns {string} The absolute path.
 */
export function webuiAsset(name) {
    return path.join(assetsJs, name);
}

/**
 * Detaches a timer handle from the event loop so a control that schedules a
 * timeout or interval at construction time cannot keep the Node test runner
 * alive after the synchronous tests finished. The callbacks still fire while
 * the loop runs; they just no longer hold the process open.
 * @param {*} handle - The handle returned by setTimeout/setInterval.
 * @returns {*} The same handle.
 */
function detach(handle) {
    if (handle && typeof handle.unref === "function") { handle.unref(); }
    return handle;
}

const safeSetTimeout = (callback, delay, ...args) => detach(setTimeout(callback, delay, ...args));
const safeSetInterval = (callback, delay, ...args) => detach(setInterval(callback, delay, ...args));

/**
 * Builds a stand-in for one of the per-tag SVG interfaces. The stub models
 * every SVG tag with a single class, so the interface identity a control tests
 * with instanceof is reconstructed from the tag name.
 * @param {string} tagName - The upper case tag name the interface stands for.
 * @returns {Function} The constructor usable on the right-hand side of instanceof.
 */
function svgTagClass(tagName) {
    const constructor = function () { };
    Object.defineProperty(constructor, "name", { value: `SVG${tagName}Element` });
    Object.defineProperty(constructor, Symbol.hasInstance, {
        value: (value) => value instanceof SvgElement && String(value.tagName).toUpperCase() === tagName
    });
    return constructor;
}

/**
 * Builds the browser-shaped globals that many controls touch at construction
 * time (window, animation frames, observers, the Popper layout helper). They
 * are deliberately inert stubs: timers resolve, observers never fire, and the
 * layout helper reports an empty state. The set is opt-in through
 * loadWebUi({ browser: true }) so the lean default runtime stays unchanged.
 * @param {object} document - The document stub the window should expose.
 * @returns {object} The browser globals.
 */
function createBrowserGlobals(document) {
    // window listeners are tracked rather than dropped: a control that registers
    // a global key or pointer handler has to be able to prove, in a test, both
    // that the handler runs and that its teardown removed it again
    const listeners = {};
    const windowEvents = {
        _listeners: listeners,
        addEventListener(type, handler) {
            (listeners[type] || (listeners[type] = new Set())).add(handler);
        },
        removeEventListener(type, handler) {
            if (listeners[type]) { listeners[type].delete(handler); }
        },
        dispatchEvent(event) {
            const set = listeners[event.type];
            if (set) { Array.from(set).forEach((handler) => handler(event)); }
            return !event.defaultPrevented;
        }
    };

    const matchMedia = (query) => ({
        matches: false,
        media: query || "",
        onchange: null,
        addEventListener() { },
        removeEventListener() { },
        addListener() { },
        removeListener() { }
    });

    const window = {
        ...windowEvents,
        document,
        name: "",
        innerWidth: 1024,
        innerHeight: 768,
        devicePixelRatio: 1,
        scrollX: 0,
        scrollY: 0,
        pageXOffset: 0,
        pageYOffset: 0,
        location: { href: "http://localhost/", origin: "http://localhost", pathname: "/", search: "", hash: "" },
        history: { pushState() { }, replaceState() { }, back() { }, forward() { } },
        matchMedia,
        getComputedStyle: () => new Proxy({}, { get: () => "", has: () => true }),
        requestAnimationFrame: (callback) => safeSetTimeout(() => callback(Date.now()), 0),
        cancelAnimationFrame: (handle) => clearTimeout(handle),
        getSelection: () => ({ rangeCount: 0, isCollapsed: true, removeAllRanges() { }, addRange() { }, getRangeAt() { return null; } }),
        scrollTo() { },
        scrollBy() { },
        setTimeout: safeSetTimeout,
        clearTimeout,
        setInterval: safeSetInterval,
        clearInterval
    };
    window.window = window;
    window.self = window;
    document.defaultView = window;

    const storage = () => {
        const map = new Map();
        return {
            getItem: (key) => (map.has(key) ? map.get(key) : null),
            setItem: (key, value) => { map.set(key, String(value)); },
            removeItem: (key) => { map.delete(key); },
            clear: () => { map.clear(); },
            key: (index) => Array.from(map.keys())[index] ?? null,
            get length() { return map.size; }
        };
    };

    return {
        window,
        requestAnimationFrame: window.requestAnimationFrame,
        cancelAnimationFrame: window.cancelAnimationFrame,
        getComputedStyle: window.getComputedStyle,
        getSelection: window.getSelection,
        matchMedia,
        localStorage: storage(),
        sessionStorage: storage(),
        // the graph editor narrows a drag target with an instanceof check, so
        // the SVG constructors have to exist and have to accept the stub's SVG
        // elements; the stub has one element class for every SVG tag, so the
        // distinction is drawn on the tag name
        SVGElement: SvgElement,
        SVGSVGElement: svgTagClass("SVG"),
        SVGGElement: svgTagClass("G"),
        SVGCircleElement: svgTagClass("CIRCLE"),
        SVGPathElement: svgTagClass("PATH"),
        SVGRectElement: svgTagClass("RECT"),
        SVGTextElement: svgTagClass("TEXT"),
        ResizeObserver: class { observe() { } unobserve() { } disconnect() { } },
        IntersectionObserver: class { constructor() { this.root = null; } observe() { } unobserve() { } disconnect() { } takeRecords() { return []; } },
        Event: class { constructor(type, init) { init = init || {}; this.type = type; this.bubbles = !!init.bubbles; this.cancelable = !!init.cancelable; this.defaultPrevented = false; } preventDefault() { this.defaultPrevented = true; } stopPropagation() { } },
        // a Popper that resolves immediately and reports an empty layout state
        Popper: {
            createPopper: () => ({
                update: async () => { },
                forceUpdate: () => { },
                setOptions: async () => { },
                destroy: () => { },
                state: { elements: {}, modifiersData: {}, rects: {} }
            })
        }
    };
}

/**
 * Loads a fresh, isolated WebUI runtime.
 * @param {object} [options] - Optional overrides: fetch, extraFiles, browser, globals.
 * @returns {object} An object with the webui namespace, the document and helpers.
 */
export function loadWebUi(options = {}) {
    const document = createDocument();

    const sandbox = {
        console,
        queueMicrotask,
        setTimeout: safeSetTimeout,
        clearTimeout,
        setInterval: safeSetInterval,
        clearInterval,
        URL,
        URLSearchParams,
        AbortController,
        document,
        navigator: { language: "en-US", languages: ["en-US"], userAgent: "node", platform: "node", clipboard: { writeText: async () => { }, readText: async () => "" } },
        Node: { ELEMENT_NODE: 1, TEXT_NODE: 3, DOCUMENT_FRAGMENT_NODE: 11 },
        // the stub element doubles as HTMLElement, so the Ctrl base accepts it
        HTMLElement: Element,
        MutationObserver: class {
            constructor(callback) { this.callback = callback; }
            observe() { }
            disconnect() { }
            takeRecords() { return []; }
        },
        CustomEvent: class {
            constructor(type, init) {
                init = init || {};
                this.type = type;
                this.detail = init.detail;
                this.bubbles = !!init.bubbles;
            }
        },
        fetch: options.fetch || (async () => { throw new Error("fetch is not stubbed for this test"); }),
        ...(options.browser ? createBrowserGlobals(document) : {}),
        ...(options.globals || {})
    };

    vm.createContext(sandbox);

    const files = ["webexpress.webui.js", ...(options.extraFiles || [])];

    for (const file of files) {
        const full = path.isAbsolute(file) ? file : path.join(assetsJs, file);
        const code = fs.readFileSync(full, "utf8");
        vm.runInContext(code, sandbox, { filename: full });
    }

    return {
        wx: sandbox.webexpress.webui,
        document,
        sandbox,
        createElement(tag) { return document.createElement(tag); }
    };
}

/**
 * Counts the handlers currently registered on the window for an event type.
 * A teardown test asserts against this rather than against the control's own
 * bookkeeping, so a handler that is dropped without being unregistered still
 * shows up as a leak.
 * @param {object} rt - The loaded runtime.
 * @param {string} type - The event type, for example "keydown".
 * @returns {number} The handler count.
 */
export function windowListenerCount(rt, type) {
    const set = rt.sandbox.window._listeners[type];
    return set ? set.size : 0;
}

/**
 * Counts the handlers a stub element carries for an event type.
 * @param {object} element - The stub element.
 * @param {string} type - The event type.
 * @returns {number} The handler count.
 */
export function elementListenerCount(element, type) {
    const set = element._listeners[type];
    return set ? set.size : 0;
}

/**
 * Builds a synthetic pointer event carrying the fields the graph controls read.
 * @param {object} [init] - Overrides for the event fields.
 * @returns {object} The event.
 */
export function pointerEvent(init = {}) {
    return {
        type: init.type || "pointerdown",
        button: init.button === undefined ? 0 : init.button,
        pointerId: init.pointerId === undefined ? 1 : init.pointerId,
        clientX: init.clientX || 0,
        clientY: init.clientY || 0,
        ctrlKey: !!init.ctrlKey,
        metaKey: !!init.metaKey,
        shiftKey: !!init.shiftKey,
        altKey: !!init.altKey,
        target: init.target || null,
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        stopPropagation() { this.propagationStopped = true; }
    };
}

/**
 * Builds a synthetic keyboard event carrying the fields the graph controls read.
 * @param {string} key - The key value, for example "Delete".
 * @param {object} [init] - Overrides for the remaining event fields.
 * @returns {object} The event.
 */
export function keyEvent(key, init = {}) {
    return {
        type: init.type || "keydown",
        key,
        ctrlKey: !!init.ctrlKey,
        metaKey: !!init.metaKey,
        shiftKey: !!init.shiftKey,
        altKey: !!init.altKey,
        target: init.target || null,
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        stopPropagation() { this.propagationStopped = true; }
    };
}

/**
 * Builds a synthetic childList mutation record for handleMutations.
 * @param {object} changes - { added, removed } node arrays.
 * @returns {object} The mutation record.
 */
export function childListMutation(changes = {}) {
    return {
        type: "childList",
        addedNodes: changes.added || [],
        removedNodes: changes.removed || []
    };
}
