/**
 * Headless contract and behavior tests for the BoxCtrl control (wx-webui-box).
 * The shared contract (controls.contract.mjs) covers registration and the
 * construct / teardown lifecycle.
 *
 * The behavior tests below cover what the box is for: turning a host element
 * and a handful of data attributes into a label row over a body, drawing the
 * one frame the layout names around both, and keeping that frame in step with
 * the editor's box add-on. The last group reads the stylesheet directly,
 * because a frame is a claim about declarations - which layouts exist, that the
 * editor preview shares them, that the framework's shadow variable is not
 * shadowed - that no dom stub has a cascade to answer.
 */
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

const FILE = "webexpress.webui.box.js";

const CSS_PATH = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..", "..", "WebExpress.WebUI", "Assets", "css", "webexpress.webui.box.css"
);

/**
 * Returns the stylesheet without its comments.
 * @returns {string} The css text.
 */
function css() {
    return fs.readFileSync(CSS_PATH, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Returns the declarations of every rule whose selector list contains the selector.
 * @param {string} selector - One selector of the list, as authored.
 * @returns {string[]} The declaration blocks.
 */
function rulesFor(selector) {
    const found = [];

    for (const rule of css().matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        const selectors = rule[1].split(",").map((s) => s.trim().replace(/\s*\n\s*/g, " "));
        if (selectors.includes(selector)) {
            found.push(rule[2]);
        }
    }

    return found;
}

contract({
    file: FILE,
    selector: "wx-webui-box",
    ctrl: "BoxCtrl"
});

/**
 * Loads a runtime with the box control.
 * @returns {object} The loaded runtime.
 */
function loadRuntime() {
    return loadWebUi({ browser: true, extraFiles: [FILE] });
}

/**
 * Builds a connected host element carrying the marker class and the supplied
 * configuration, and lets the controller adopt it.
 *
 * The dom stub does not reflect setAttribute into dataset, so the configuration
 * is written to dataset directly - which is the side the control reads.
 * @param {object} rt - The loaded runtime.
 * @param {object} [data] - The data attribute values, without the "data-" prefix.
 * @param {Array} [children] - Elements placed in the host before it is adopted.
 * @returns {object} The host element.
 */
function box(rt, data = {}, children = []) {
    const host = rt.createElement("div");

    if (data.id) {
        host.id = data.id;
        delete data.id;
    }

    Object.assign(host.dataset, data);
    children.forEach((child) => host.appendChild(child));

    host.classList.add("wx-webui-box");
    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);

    return host;
}

/**
 * Returns the controller instance the runtime tracks for the host.
 * @param {object} rt - The loaded runtime.
 * @param {object} host - The host element.
 * @returns {object} The instance.
 */
function instance(rt, host) {
    return rt.wx.Controller.instanceMap.get(host);
}

/**
 * Returns the first descendant carrying the class.
 * @param {object} host - The element to search.
 * @param {string} name - The class name.
 * @returns {object|null} The element, or null.
 */
function byClass(host, name) {
    return host.querySelector("." + name);
}

// ------------------------------------------------------------------ structure

test("the box builds a label row over the content it adopted", () => {
    const rt = loadRuntime();
    const payload = rt.createElement("p");
    payload.id = "payload";

    const host = box(rt, { id: "b1", header: "Details" }, [payload]);

    const header = byClass(host, "wx-box-header");
    const body = byClass(host, "wx-box-body");

    assert.ok(header, "the label row is built");
    assert.ok(body, "the body is built");
    assert.equal(byClass(host, "wx-box-title").textContent, "Details", "the label carries the header text");
    assert.equal(payload.parentNode, body, "the adopted content sits in the body");
    assert.equal(host.classList.contains("wx-box"), true, "the host is marked as a box");
    assert.equal(host.classList.contains("wx-box-labelled"), true, "and as a labelled one");
});

test("the configuration leaves the host once it has been read", () => {
    const rt = loadRuntime();
    const host = rt.createElement("div");

    ["data-layout", "data-header", "data-header-icon-css", "data-color-class"].forEach((name) => {
        host.setAttribute(name, "x");
    });
    host.classList.add("wx-webui-box");
    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);

    ["data-layout", "data-header", "data-header-icon-css", "data-color-class"].forEach((name) => {
        assert.equal(host.hasAttribute(name), false, `${name} is consumed`);
    });
});

test("a box without a label is a plain frame, and a label set later brings the row back", () => {
    const rt = loadRuntime();
    const host = box(rt, { id: "b2" });

    assert.equal(byClass(host, "wx-box-header").classList.contains("hide"), true, "no label, no row");
    assert.equal(host.classList.contains("wx-box-labelled"), false);

    instance(rt, host).header = "Attachments";

    assert.equal(byClass(host, "wx-box-header").classList.contains("hide"), false, "the row is shown");
    assert.equal(byClass(host, "wx-box-title").textContent, "Attachments");
    assert.equal(host.classList.contains("wx-box-labelled"), true);
    assert.equal(instance(rt, host).header, "Attachments", "and the accessor answers with it");
});

test("the header icon renders as a glyph or as an image, and keeps the row without a label", () => {
    const rt = loadRuntime();

    const glyph = box(rt, { id: "b3", headerIconCss: "wx-icon-light wx-icon-light-align-left" });
    assert.equal(byClass(glyph, "wx-box-icon").tagName, "I");
    assert.equal(byClass(glyph, "wx-box-icon").className, "wx-box-icon wx-icon-light wx-icon-light-align-left");
    assert.equal(byClass(glyph, "wx-box-header").classList.contains("hide"), false, "an icon alone labels the box");

    const image = box(rt, { id: "b4", header: "H", headerIconImage: "/assets/img/x.svg" });
    assert.equal(byClass(image, "wx-box-icon").tagName, "IMG");
    assert.equal(byClass(image, "wx-box-icon").src, "/assets/img/x.svg");

    const none = box(rt, { id: "b5", header: "H" });
    assert.equal(byClass(none, "wx-box-icon"), null, "no icon is declared, so none is built");
});

// --------------------------------------------------------------------- layouts

test("the layout is the one class the host carries for its frame", () => {
    const rt = loadRuntime();

    const plain = box(rt, { id: "l1" });
    assert.equal(plain.classList.contains("wx-box-solid"), true, "the default frame is the hairline");
    assert.equal(instance(rt, plain).layout, "solid");

    const dashed = box(rt, { id: "l2", layout: "dashed" });
    assert.equal(dashed.classList.contains("wx-box-dashed"), true);
    assert.equal(dashed.classList.contains("wx-box-solid"), false, "one frame at a time");
});

test("every declared layout is accepted and an unknown one falls back to the default", () => {
    const rt = loadRuntime();

    rt.wx.BoxCtrl.LAYOUTS.forEach((layout) => {
        const host = box(rt, { id: "l-" + layout, layout });
        assert.equal(host.classList.contains("wx-box-" + layout), true, `${layout} is drawn`);
    });

    const unknown = box(rt, { id: "l3", layout: "zigzag" });
    assert.equal(unknown.classList.contains("wx-box-solid"), true, "a value the stylesheet does not know is not left frameless");

    const shouted = box(rt, { id: "l4", layout: "DASHED" });
    assert.equal(shouted.classList.contains("wx-box-dashed"), true, "the value is not case sensitive");
});

test("changing the layout swaps the frame class in place", () => {
    const rt = loadRuntime();
    const host = box(rt, { id: "l5", layout: "solid" });

    instance(rt, host).layout = "raised";

    assert.equal(host.classList.contains("wx-box-raised"), true);
    assert.equal(host.classList.contains("wx-box-solid"), false);
    assert.equal(instance(rt, host).layout, "raised");
});

// ---------------------------------------------------------------------- accent

test("the accent is applied to the host so the frame and the label inherit it", () => {
    const rt = loadRuntime();

    const system = box(rt, { id: "a1", header: "H", colorClass: "text-danger" });
    assert.equal(system.classList.contains("wx-box-accented"), true);
    assert.equal(system.classList.contains("text-danger"), true);

    const user = box(rt, { id: "a2", header: "H", colorStyle: "color:gold;" });
    assert.equal(user.classList.contains("wx-box-accented"), true);
    assert.match(user.style.cssText, /color:\s*gold/);

    const plain = box(rt, { id: "a3", header: "H" });
    assert.equal(plain.classList.contains("wx-box-accented"), false, "no color, no accent");
});

// ------------------------------------------------------------------------- api

test("a host control reaches the header, the label and the body through the public api", () => {
    const rt = loadRuntime();
    const payload = rt.createElement("p");

    const host = box(rt, { id: "api1", header: "Group" }, [payload]);
    const ctrl = instance(rt, host);

    assert.equal(ctrl.headerElement, byClass(host, "wx-box-header"));
    assert.equal(ctrl.titleElement, byClass(host, "wx-box-title"));
    assert.equal(ctrl.bodyElement, byClass(host, "wx-box-body"));
    assert.equal(payload.parentNode, ctrl.bodyElement);

    const affordance = rt.createElement("button");
    affordance.classList.add("host-affordance");
    ctrl.headerElement.appendChild(affordance);
    assert.ok(byClass(host, "host-affordance"), "the host affordance sits in the label row");
});

// ------------------------------------------------------------------ stylesheet

test("every layout the controller offers is a frame the stylesheet draws", () => {
    const rt = loadRuntime();

    rt.wx.BoxCtrl.LAYOUTS.forEach((layout) => {
        // the default frame is the base rule itself; every other one is a rule of its own
        const selector = layout === "solid" ? ".wx-box" : ".wx-box-" + layout;
        assert.ok(rulesFor(selector).length > 0, `${selector} has a rule`);
    });
});

test("the editor preview shares every frame rule, so the author sees what the reader gets", () => {
    const rt = loadRuntime();
    const body = (layout) => `.wx-addon-frame[data-addon-id="box"][data-layout="${layout}"] > .wx-addon-body-container`;

    assert.deepEqual(
        rulesFor(".wx-box"),
        rulesFor('.wx-addon-frame[data-addon-id="box"] > .wx-addon-body-container'),
        "the base frame is one rule for both"
    );

    rt.wx.BoxCtrl.LAYOUTS.filter((layout) => layout !== "solid").forEach((layout) => {
        assert.deepEqual(rulesFor(".wx-box-" + layout), rulesFor(body(layout)), `${layout} is one rule for both`);
    });
});

test("the box never redefines the framework's shadow variable", () => {
    // --wx-box-shadow is the elevation every dropdown and popover takes; a box that declared a
    // value under that name would take the shadow off everything inside it
    assert.equal(/--wx-box-shadow\s*:/.test(css()), false);
    assert.match(rulesFor(".wx-box-raised")[0], /var\(--wx-box-shadow\)/, "the raised frame reads it instead");
});

test("the accent recolors the line through currentColor and gives the body its color back", () => {
    assert.match(rulesFor(".wx-box-accented")[0], /--wx-box-line-color:\s*currentColor/);
    assert.match(rulesFor(".wx-box-accented > .wx-box-body")[0], /color:\s*var\(--wx-body-color\)/);
});
