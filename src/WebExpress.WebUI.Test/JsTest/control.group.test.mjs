/**
 * Headless contract and behavior tests for the GroupCtrl control (wx-webui-group). The shared
 * contract (controls.contract.mjs) covers registration and the construct / teardown lifecycle.
 *
 * The behavior tests below cover what the group is for: turning a host element and a handful of
 * items - any items, the group does not care what they are - into one bounded surface whose
 * fields are divided by hairlines, and keeping those dividers correct when the row wraps, which
 * is the reason the control exists at all. The last group reads the stylesheet directly, because
 * the surface colour per theme is a claim about declarations that no dom stub has a cascade to
 * answer.
 */
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

const FILE = "webexpress.webui.group.js";

const CSS_PATH = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..", "..", "WebExpress.WebUI", "Assets", "css", "webexpress.webui.group.css"
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
    selector: "wx-webui-group",
    ctrl: "GroupCtrl"
});

/**
 * Loads a runtime with the group control.
 * @returns {object} The loaded runtime.
 */
function loadRuntime() {
    return loadWebUi({ browser: true, extraFiles: [FILE] });
}

/**
 * Builds a connected host carrying the marker class, the supplied configuration and one child
 * per item, and lets the controller adopt it.
 *
 * The dom stub does not reflect setAttribute into dataset, so the configuration is written to
 * dataset directly - which is the side the control reads.
 * @param {object} rt - The loaded runtime.
 * @param {number} count - The number of items.
 * @param {object} [data] - The data attribute values, without the "data-" prefix.
 * @param {number[]} [tops] - The offsetTop each field reports, to stand in for a wrapped row.
 * @param {string} [tag] - The element name of the items.
 * @returns {object} The host element.
 */
function group(rt, count, data = {}, tops = null, tag = "div") {
    const host = rt.createElement("div");

    if (data.id) {
        host.id = data.id;
        delete data.id;
    }

    Object.assign(host.dataset, data);

    for (let i = 0; i < count; i++) {
        const item = rt.createElement(tag);
        item.id = "item" + i;
        host.appendChild(item);
    }

    host.classList.add("wx-webui-group");
    rt.document.body.appendChild(host);

    // the stub reports no geometry, so a wrapped row is described by the test rather than
    // measured. the fields are the next elements the controller creates, so the property is
    // installed on them as they are handed out.
    if (tops) {
        let index = 0;
        const original = rt.document.createElement;
        rt.document.createElement = (name) => {
            const element = original.call(rt.document, name);

            if (index < tops.length) {
                Object.defineProperty(element, "offsetTop", { value: tops[index++], configurable: true });
            }

            return element;
        };
    }

    rt.wx.Controller.createInstances(host);

    return host;
}

/**
 * Returns the fields of the group.
 * @param {object} host - The host element.
 * @returns {Array} The field elements.
 */
function fields(host) {
    return Array.from(host.children).filter((x) => x.classList.contains("wx-group-field"));
}

// ------------------------------------------------------------------ structure

test("the group wraps every item in a field of its own", () => {
    const rt = loadRuntime();
    const host = group(rt, 3, { id: "g1" });

    const built = fields(host);

    assert.equal(built.length, 3, "one field per item");
    assert.equal(host.classList.contains("wx-group"), true, "the host is marked as a group");
    built.forEach((field, i) => {
        assert.equal(field.children.length, 1, "a field holds exactly its item");
        assert.equal(field.children[0].id, "item" + i, "and holds them in the order they were given");
    });
});

test("the group takes whatever it is given - the content is not its business", () => {
    const rt = loadRuntime();
    const host = rt.createElement("div");

    const text = rt.createElement("p");
    text.id = "prose";

    const nested = rt.createElement("section");
    const inner = rt.createElement("span");
    inner.id = "inner";
    nested.appendChild(inner);

    host.appendChild(text);
    host.appendChild(nested);
    host.classList.add("wx-webui-group");
    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);

    assert.equal(fields(host).length, 2, "a paragraph and a section are both fields");
    assert.equal(inner.parentNode, nested, "what an item rendered is untouched");
    assert.equal(text.parentNode.classList.contains("wx-group-field"), true, "and every item sits in a field");
});

// ------------------------------------------------------------------ configuration

test("a declared column count reaches the stylesheet, and the attributes are consumed", () => {
    const rt = loadRuntime();
    const host = group(rt, 4, { id: "g2", columns: "2" });

    assert.equal(host.style.getPropertyValue("--wx-group-columns"), "2", "the count drives the custom property");
    assert.equal(host.getAttribute("data-columns"), null, "the configuration attribute is removed");
});

test("without a column count the fields divide the width between them", () => {
    const rt = loadRuntime();
    const host = group(rt, 3, { id: "g3" });

    assert.equal(host.style.getPropertyValue("--wx-group-columns"), "", "nothing is imposed");
});

test("a group inside another frame drops its own surface", () => {
    const rt = loadRuntime();

    const framed = group(rt, 2, { id: "g4" });
    assert.equal(framed.classList.contains("wx-group-bare"), false, "the default is a bounded surface");

    const bare = group(rt, 2, { id: "g5", framed: "false" });
    assert.equal(bare.classList.contains("wx-group-bare"), true, "and it can be dropped");
    assert.equal(bare.getAttribute("data-framed"), null, "the configuration attribute is removed");
});

test("the spacing of a field is applied as a class, and the default adds none", () => {
    const rt = loadRuntime();

    const wide = group(rt, 2, { id: "g6", spacing: "wide" });
    assert.equal(wide.classList.contains("wx-group-wide"), true);
    assert.equal(wide.getAttribute("data-spacing"), null, "the configuration attribute is removed");

    const plain = group(rt, 2, { id: "g7" });
    assert.equal(plain.className.includes("wx-group-wide"), false);
    assert.equal(plain.className.includes("wx-group-narrow"), false);
});

// ------------------------------------------------------------------ dividers

test("in a single row only the first field starts a row", () => {
    const rt = loadRuntime();
    const host = group(rt, 4, { id: "g8" }, [0, 0, 0, 0]);

    const marks = fields(host).map((x) => x.classList.contains("wx-group-row-start"));

    assert.deepEqual(marks, [true, false, false, false], "the dividers run between the fields, not before the first");
});

test("when the row wraps, the first field of every row starts one", () => {
    const rt = loadRuntime();
    const host = group(rt, 4, { id: "g9" }, [0, 0, 90, 90]);

    const marks = fields(host).map((x) => x.classList.contains("wx-group-row-start"));

    assert.deepEqual(marks, [true, false, true, false], "a line would otherwise run into empty space");
});

test("every field below the first row is marked, not just the one that starts it", () => {
    const rt = loadRuntime();
    const host = group(rt, 6, { id: "g11" }, [0, 0, 90, 90, 180, 180]);

    const firstRow = fields(host).map((x) => x.classList.contains("wx-group-first-row"));

    assert.deepEqual
    (
        firstRow,
        [true, true, false, false, false, false],
        "separating only the row starts would draw the rule under one column and leave the rest open"
    );
});

test("a single row is entirely the first row, so nothing is separated horizontally", () => {
    const rt = loadRuntime();
    const host = group(rt, 3, { id: "g12" }, [0, 0, 0]);

    const firstRow = fields(host).map((x) => x.classList.contains("wx-group-first-row"));

    assert.deepEqual(firstRow, [true, true, true]);
});

test("a runtime without geometry is treated as one row", () => {
    const rt = loadRuntime();
    const host = group(rt, 3, { id: "g10" });

    const marks = fields(host).map((x) => x.classList.contains("wx-group-row-start"));

    assert.deepEqual(marks, [true, false, false], "nothing is guessed from the markup position");
});

// ------------------------------------------------------------------ short last row

test("a last row that is not full is completed with empty fields", () => {
    const rt = loadRuntime();
    const host = group(rt, 3, { id: "g13" }, [0, 0, 90]);

    const built = fields(host);
    const fillers = built.filter((x) => x.classList.contains("wx-group-filler"));

    assert.equal(built.length, 4, "the row is completed");
    assert.equal(fillers.length, 1, "by one empty field");
    assert.equal(fillers[0].children.length, 0, "which holds nothing");
    assert.equal(fillers[0].getAttribute("aria-hidden"), "true", "and is not read out");
});

test("the empty fields carry the dividers, so the rule runs to the edge", () => {
    const rt = loadRuntime();
    const host = group(rt, 3, { id: "g14" }, [0, 0, 90]);

    const filler = fields(host).find((x) => x.classList.contains("wx-group-filler"));

    assert.equal(filler.classList.contains("wx-group-first-row"), false, "it is separated from the row above");
    assert.equal(filler.classList.contains("wx-group-row-start"), false, "and keeps the divider on its left");
});

test("a single row is left alone - there is no hole to close", () => {
    const rt = loadRuntime();
    const host = group(rt, 3, { id: "g15" }, [0, 0, 0]);

    assert.equal(fields(host).filter((x) => x.classList.contains("wx-group-filler")).length, 0, "fencing off unused space would say something untrue");
});

test("a full last row needs no completion", () => {
    const rt = loadRuntime();
    const host = group(rt, 4, { id: "g16" }, [0, 0, 90, 90]);

    assert.equal(fields(host).filter((x) => x.classList.contains("wx-group-filler")).length, 0);
});

// ------------------------------------------------------------------ stylesheet

test("the surface follows the body palette, and the dark theme follows it too", () => {
    const light = cssRule(".wx-group");
    const dark = cssRule('[data-bs-theme="dark"] .wx-group');

    assert.ok(light, "the group has a rule");
    assert.match(light, /--wx-group-bg:\s*var\(--wx-body-bg/, "the surface is a token, not a literal");
    assert.match(light, /background:\s*var\(--wx-group-bg\)/, "and the background reads it");

    assert.ok(dark, "the dark theme is answered");
    assert.match(dark, /--wx-group-bg:\s*var\(--wx-dark/, "by moving the token, not by repeating the rule");
});

test("the divider is drawn on the field and dropped where a row starts", () => {
    const field = cssRule(".wx-group-field");
    const start = cssRule(".wx-group-field.wx-group-row-start");
    const below = cssRule(".wx-group-field:not(.wx-group-first-row)");

    assert.match(field, /border-left:\s*1px solid/, "every field carries its left divider");
    assert.match(start, /border-left:\s*0/, "except the one that starts a row");
    assert.match(below, /border-top:\s*1px solid/, "and every field below the first row is separated from it");
});

test("the spacing variants move the padding token rather than the padding", () => {
    const field = cssRule(".wx-group-field");

    assert.match(field, /padding:\s*var\(--wx-group-padding\)/, "the field reads the token");
    assert.match(cssRule(".wx-group-wide"), /--wx-group-padding:/, "and a variant sets it");
    assert.match(cssRule(".wx-group-narrow"), /--wx-group-padding:/);
});

test("a bare group carries no surface of its own", () => {
    const bare = cssRule(".wx-group-bare");

    assert.match(bare, /background:\s*transparent/);
    assert.match(bare, /border:\s*0/);
});
