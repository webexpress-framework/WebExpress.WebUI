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
import { createDocument, Element } from "./dom-stub.mjs";

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
 * Loads a fresh, isolated WebUI runtime.
 * @param {object} [options] - Optional overrides: fetch, extraFiles.
 * @returns {object} An object with the webui namespace, the document and helpers.
 */
export function loadWebUi(options = {}) {
    const document = createDocument();

    const sandbox = {
        console,
        queueMicrotask,
        setTimeout,
        clearTimeout,
        URL,
        URLSearchParams,
        AbortController,
        document,
        navigator: { language: "en-US", languages: ["en-US"] },
        Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 },
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
        fetch: options.fetch || (async () => { throw new Error("fetch is not stubbed for this test"); })
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
