/**
 * Headless contract and behavior tests for the SectionCtrl control
 * (wx-webui-section). The shared contract (controls.contract.mjs) covers
 * registration and the construct / teardown lifecycle.
 *
 * The behavior tests below cover what the section is for: turning a host element
 * and a handful of data attributes into a label row over a collapsible body,
 * folding that body away and remembering the choice, and doing all of it without
 * the frame a card would draw. The last group reads the stylesheet directly,
 * because the flat look is a claim about declarations - no border, no background,
 * a guide line on the body - that no dom stub has a cascade to answer.
 */
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

const FILE = "webexpress.webui.section.js";

const CSS_PATH = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..", "..", "WebExpress.WebUI", "Assets", "css", "webexpress.webui.section.css"
);

/**
 * Returns the declarations of the rule carrying exactly the given selector list.
 * @param {string} selector - The selector list as authored, whitespace-normalized.
 * @returns {string|null} The declaration block, or null when no rule matches.
 */
function cssRule(selector) {
    const css = fs.readFileSync(CSS_PATH, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

    for (const rule of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        if (rule[1].trim().replace(/\s*\n\s*/g, " ") === selector) {
            return rule[2];
        }
    }

    return null;
}

contract({
    file: FILE,
    selector: "wx-webui-section",
    ctrl: "SectionCtrl"
});

/**
 * Loads a runtime with the section control.
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
function section(rt, data = {}, children = []) {
    const host = rt.createElement("section");

    if (data.id) {
        host.id = data.id;
        delete data.id;
    }

    Object.assign(host.dataset, data);
    children.forEach((child) => host.appendChild(child));

    host.classList.add("wx-webui-section");
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

test("the section builds a label row over the content it adopted", () => {
    const rt = loadRuntime();
    const payload = rt.createElement("p");
    payload.id = "payload";

    const host = section(rt, { id: "s1", header: "Description" }, [payload]);

    const header = byClass(host, "wx-section-header");
    const body = byClass(host, "wx-section-body");

    assert.ok(header, "the header row is built");
    assert.ok(body, "the body is built");
    assert.equal(byClass(host, "wx-section-title").textContent, "Description", "the label carries the header text");
    assert.equal(payload.parentNode, body, "the adopted content sits in the body");
    assert.equal(host.classList.contains("wx-section"), true, "the host is marked as a section");
});

test("a collapsible section gets a button and a chevron, a fixed one does not", () => {
    const rt = loadRuntime();

    const collapsible = section(rt, { id: "s2", header: "Details" });
    assert.equal(byClass(collapsible, "wx-section-header").tagName, "BUTTON", "the label row is operable");
    assert.ok(byClass(collapsible, "wx-section-chevron"), "the chevron announces that it folds");
    assert.equal(collapsible.classList.contains("wx-section-collapsible"), true);

    const fixed = section(rt, { id: "s3", header: "Details", collapsible: "false" });
    assert.equal(byClass(fixed, "wx-section-header").tagName, "DIV", "a fixed section is not a control");
    assert.equal(byClass(fixed, "wx-section-chevron"), null, "and offers no chevron");
    assert.equal(fixed.classList.contains("wx-section-collapsible"), false);
    assert.equal(fixed.classList.contains("wx-section-collapsed"), false, "a fixed section is always open");
});

test("the header icon renders as a glyph or as an image", () => {
    const rt = loadRuntime();

    const glyph = section(rt, { id: "s4", header: "H", headerIconCss: "wx-icon-light wx-icon-light-align-left" });
    assert.equal(byClass(glyph, "wx-section-icon").tagName, "I");
    assert.equal(
        byClass(glyph, "wx-section-icon").className,
        "wx-section-icon wx-icon-light wx-icon-light-align-left"
    );

    const image = section(rt, { id: "s5", header: "H", headerIconImage: "/assets/img/x.svg" });
    assert.equal(byClass(image, "wx-section-icon").tagName, "IMG");
    assert.equal(byClass(image, "wx-section-icon").src, "/assets/img/x.svg");

    const none = section(rt, { id: "s6", header: "H" });
    assert.equal(byClass(none, "wx-section-icon"), null, "no icon is declared, so none is built");
});

test("the note is shown beside the label and hidden while it is empty", () => {
    const rt = loadRuntime();

    const withNote = section(rt, { id: "s7", header: "Comments", note: "12" });
    assert.equal(byClass(withNote, "wx-section-note").textContent, "12");
    assert.equal(byClass(withNote, "wx-section-note").classList.contains("hide"), false);

    const without = section(rt, { id: "s8", header: "Comments" });
    assert.equal(byClass(without, "wx-section-note").classList.contains("hide"), true);

    // a folded section still reports what is inside it, so the note is settable
    instance(rt, without).note = "3";
    assert.equal(byClass(without, "wx-section-note").textContent, "3");
    assert.equal(byClass(without, "wx-section-note").classList.contains("hide"), false);
});

test("the badge is shown beside the label and hidden while it is empty", () => {
    const rt = loadRuntime();

    const withBadge = section(rt, { id: "b1", header: "Status", badge: "3 open" });
    const badge = byClass(withBadge, "wx-section-badge");

    assert.equal(badge.textContent, "3 open");
    assert.equal(badge.classList.contains("hide"), false);
    assert.equal(badge.classList.contains("badge"), true, "it takes the badge shape");
    assert.equal(badge.classList.contains("rounded-pill"), true);

    const without = section(rt, { id: "b2", header: "Status" });
    assert.equal(byClass(without, "wx-section-badge").classList.contains("hide"), true);

    // a badge that only becomes true later - a count arriving from a service - can be set
    instance(rt, without).badge = "1 overdue";
    assert.equal(byClass(without, "wx-section-badge").textContent, "1 overdue");
    assert.equal(byClass(without, "wx-section-badge").classList.contains("hide"), false);
});

test("the badge takes the declared color as a class or as a style", () => {
    const rt = loadRuntime();

    const system = section(rt, { id: "b3", header: "H", badge: "9", badgeBgClass: "text-bg-danger" });
    assert.equal(byClass(system, "wx-section-badge").classList.contains("text-bg-danger"), true);

    const user = section(rt, { id: "b4", header: "H", badge: "9", badgeBgStyle: "background:gold;" });
    assert.match(byClass(user, "wx-section-badge").style.cssText, /background:\s*gold/);
});

test("the accent is applied to the host so the label row and the guide inherit it", () => {
    const rt = loadRuntime();

    const system = section(rt, { id: "a1", header: "H", colorClass: "text-danger" });
    assert.equal(system.classList.contains("wx-section-accented"), true);
    assert.equal(system.classList.contains("text-danger"), true);

    const user = section(rt, { id: "a2", header: "H", colorStyle: "color:gold;" });
    assert.equal(user.classList.contains("wx-section-accented"), true);
    assert.match(user.style.cssText, /color:\s*gold/);

    const plain = section(rt, { id: "a3", header: "H" });
    assert.equal(plain.classList.contains("wx-section-accented"), false, "no color, no accent");
});

test("a host control reaches the header, the label and the body through the public api", () => {
    const rt = loadRuntime();
    const payload = rt.createElement("p");
    payload.id = "adopted";

    const host = section(rt, { id: "api1", header: "Lane" }, [payload]);
    const ctrl = instance(rt, host);

    // the three surfaces a control building a section from javascript needs - the kanban hangs
    // a badge and a menu off the header, recolors the label and reads the body
    assert.equal(ctrl.headerElement, byClass(host, "wx-section-header"));
    assert.equal(ctrl.titleElement, byClass(host, "wx-section-title"));
    assert.equal(ctrl.bodyElement, byClass(host, "wx-section-body"));
    assert.equal(payload.parentNode, ctrl.bodyElement);

    // appending to the header is what replaces the reach into private fields
    const badge = rt.createElement("span");
    badge.classList.add("host-badge");
    ctrl.headerElement.appendChild(badge);
    assert.ok(byClass(host, "host-badge"), "the host affordance sits in the header row");
});

test("the label carries the classes a host control hangs on it", () => {
    const rt = loadRuntime();

    const host = section(rt, { id: "api2", header: "Lane", labelCss: "wx-kanban-swimlane-header fw-bold" });
    const title = byClass(host, "wx-section-title");

    assert.equal(title.classList.contains("wx-kanban-swimlane-header"), true);
    assert.equal(title.classList.contains("fw-bold"), true);
    assert.equal(title.classList.contains("wx-section-title"), true, "and keeps its own");
});

test("the accessible model names the body the label row controls", () => {
    const rt = loadRuntime();
    const host = section(rt, { id: "s9", header: "Details" });

    const header = byClass(host, "wx-section-header");

    assert.equal(header.getAttribute("aria-expanded"), "true");
    assert.equal(header.getAttribute("aria-controls"), byClass(host, "wx-section-body").id);
    assert.equal(byClass(host, "wx-section-chevron").getAttribute("aria-hidden"), "true", "the chevron is decoration");
});

// --------------------------------------------------------------------- folding

test("a click folds the body away and a second click brings it back", () => {
    const rt = loadRuntime();
    const host = section(rt, { id: "s10", header: "Details" });
    const header = byClass(host, "wx-section-header");

    header.click();

    assert.equal(host.classList.contains("wx-section-collapsed"), true, "the body folds");
    assert.equal(header.getAttribute("aria-expanded"), "false", "and says so");

    header.click();

    assert.equal(host.classList.contains("wx-section-collapsed"), false);
    assert.equal(header.getAttribute("aria-expanded"), "true");
});

test("folding dispatches the visibility change", () => {
    const rt = loadRuntime();
    const host = section(rt, { id: "s11", header: "Details" });

    const seen = [];
    host.addEventListener(rt.wx.Event.CHANGE_VISIBILITY_EVENT, (event) => seen.push(event.detail.value));

    byClass(host, "wx-section-header").click();
    byClass(host, "wx-section-header").click();

    assert.deepEqual(seen, [false, true]);
});

test("a fixed section ignores the toggle", () => {
    const rt = loadRuntime();
    const host = section(rt, { id: "s12", header: "Details", collapsible: "false" });

    instance(rt, host).expanded = false;

    assert.equal(host.classList.contains("wx-section-collapsed"), false, "a section that cannot fold does not");
});

test("the declared state opens or folds the section on first render", () => {
    const rt = loadRuntime();

    assert.equal(section(rt, { id: "s13", header: "H" }).classList.contains("wx-section-collapsed"), false);
    assert.equal(section(rt, { id: "s14", header: "H", expanded: "false" }).classList.contains("wx-section-collapsed"), true);
});

// ----------------------------------------------------------------- the clip

test("the body is clipped while it moves and released when the fold comes to rest", () => {
    const rt = loadRuntime();
    const host = section(rt, { id: "s15", header: "Details" });

    byClass(host, "wx-section-header").click();

    assert.equal(host.classList.contains("wx-section-animating"), true, "clipped for the length of the fold");

    // the wrapper is what carries the animated property, so it is what reports the end
    byClass(host, "wx-section-wrapper").dispatchEvent({
        type: "transitionend",
        target: byClass(host, "wx-section-wrapper"),
        propertyName: "grid-template-rows"
    });

    assert.equal(host.classList.contains("wx-section-animating"), false, "released, so a dropdown may overflow again");
});

test("an unrelated transition does not release the clip", () => {
    const rt = loadRuntime();
    const host = section(rt, { id: "s16", header: "Details" });

    byClass(host, "wx-section-header").click();

    byClass(host, "wx-section-wrapper").dispatchEvent({
        type: "transitionend",
        target: byClass(host, "wx-section-wrapper"),
        propertyName: "opacity"
    });

    assert.equal(host.classList.contains("wx-section-animating"), true);
});

// ------------------------------------------------------------------ memory

test("the state a reader chose survives the next render", () => {
    const rt = loadRuntime();

    section(rt, { id: "remembered", header: "H" });
    byClass(rt.document.querySelector("#remembered"), "wx-section-header").click();

    assert.equal(rt.sandbox.localStorage.getItem("wx-section:remembered"), "false", "the choice is written");

    // a second page load of the same section, declared open
    const again = section(rt, { id: "remembered", header: "H", expanded: "true" });

    assert.equal(again.classList.contains("wx-section-collapsed"), true, "the remembered state wins over the declared one");
});

test("a section that may not be remembered writes nothing", () => {
    const rt = loadRuntime();

    const host = section(rt, { id: "forgetful", header: "H", persist: "false" });
    byClass(host, "wx-section-header").click();

    assert.equal(rt.sandbox.localStorage.getItem("wx-section:forgetful"), null);
});

test("a section without an id is never remembered", () => {
    const rt = loadRuntime();

    const host = section(rt, { header: "H" });
    byClass(host, "wx-section-header").click();

    assert.equal(host.classList.contains("wx-section-collapsed"), true, "it still folds");
    assert.equal(rt.sandbox.localStorage.getItem("wx-section:"), null, "it just has nowhere to write");
});

// ---------------------------------------------------------------- the flat look

test("the section itself draws no frame", () => {
    const declarations = cssRule(".wx-section");

    assert.ok(declarations, "the base rule exists");
    assert.equal(/(^|;)\s*border\s*:/.test(declarations), false, "no border");
    assert.equal(/background/.test(declarations), false, "no background");
    assert.equal(/box-shadow/.test(declarations), false, "no shadow");
    assert.equal(/border-radius/.test(declarations), false, "no radius");
    assert.match(declarations, /margin:\s*0 0 var\(--wx-section-gap\) 0/, "the gap below is the separator");
});

test("the label row is a quiet, upper-case line", () => {
    const declarations = cssRule(".wx-section-title");

    assert.match(declarations, /text-transform:\s*uppercase/);
    assert.match(declarations, /letter-spacing:\s*var\(--wx-section-label-spacing\)/);
    assert.match(cssRule(".wx-section-header"), /color:\s*var\(--wx-secondary-color\)/);
    assert.match(cssRule(".wx-section-header"), /background:\s*none/);
});

test("a guided section carries the vertical line on the wrapper", () => {
    // on the wrapper rather than the body: the wrapper shrinks to nothing when the section
    // folds, so the line goes with it, and it does not reset its text color, so the line can
    // follow an accent
    assert.match(
        cssRule(".wx-section-guided > .wx-section-wrapper"),
        /border-left:\s*1px solid var\(--wx-border-color\)/
    );
});

test("the body is only clipped while folded or moving", () => {
    assert.match(cssRule(".wx-section-body"), /overflow:\s*visible/);
    assert.match(
        cssRule(".wx-section-collapsed > .wx-section-wrapper > .wx-section-body, .wx-section-animating > .wx-section-wrapper > .wx-section-body"),
        /overflow:\s*hidden/
    );
});

test("an accent colors the label and the guide but not the content", () => {
    assert.match(
        cssRule(".wx-section-accented > .wx-section-header, .wx-section-accented.wx-section-collapsible > .wx-section-header:hover, .wx-section-accented.wx-section-collapsible > .wx-section-header:focus-visible"),
        /color:\s*inherit/
    );
    assert.match(cssRule(".wx-section-accented.wx-section-guided > .wx-section-wrapper"), /border-left-color:\s*currentColor/);
    assert.match(cssRule(".wx-section-accented > .wx-section-wrapper > .wx-section-body"), /color:\s*var\(--wx-body-color\)/);
});

test("a verbatim label keeps the spelling and the size it was given", () => {
    const declarations = cssRule(".wx-section-verbatim > .wx-section-header > .wx-section-title");

    assert.match(declarations, /text-transform:\s*none/);
    assert.match(declarations, /letter-spacing:\s*0/);
    assert.match(declarations, /font-size:\s*inherit/);
});

test("the rule layout replaces the guide with its hairline", () => {
    assert.match(cssRule(".wx-section-rule > .wx-section-header > .wx-section-rule-line"), /flex:\s*1/);
    assert.match(cssRule(".wx-section-rule.wx-section-guided > .wx-section-wrapper"), /border-left:\s*0/);
    assert.match(cssRule(".wx-section-rule-line"), /display:\s*none/, "the hairline is inert in the other layouts");
});

test("the fold animates the grid the body sits in", () => {
    assert.match(cssRule(".wx-section-wrapper"), /grid-template-rows:\s*1fr/);
    assert.match(cssRule(".wx-section-collapsed > .wx-section-wrapper"), /grid-template-rows:\s*0fr/);
});
