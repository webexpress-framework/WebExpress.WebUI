/**
 * Headless tests for the icons of the date and calendar controls.
 *
 * The three controls build their icons in JavaScript, so nothing on the server can supply
 * the class: they have to resolve it themselves through the icon set. A control that skips
 * that emits a bare name, which is not an error - it is an element with a class no rule
 * defines, and therefore an empty box where the icon should be.
 *
 * The last test is the one that matters most, for the same reason: a class name is only a
 * string, and no assertion that compares strings would notice that nothing draws it. It
 * therefore reads the shipped icon stylesheet and holds every class these controls emit
 * against it.
 */
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWebUi, webuiAsset } from "./harness.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const iconCss = path.resolve(here, "..", "..", "WebExpress.WebUI", "Assets", "css", "webexpress.webui.icon.css");

/**
 * Builds a runtime and constructs a control on a fresh host.
 * @param {string} file - The control asset file name.
 * @param {string} ctrl - The controller class name.
 * @returns {object} The host element carrying the built control.
 */
function build(file, ctrl) {
    const rt = loadWebUi({ browser: true, extraFiles: [webuiAsset(file)] });

    const host = rt.document.createElement("div");
    rt.document.body.appendChild(host);
    new rt.wx[ctrl](host);

    return host;
}

/**
 * Returns the class list of the first element matching a selector.
 * @param {object} host - The host element.
 * @param {string} selector - The selector to look for.
 * @returns {string} The className, or "" when nothing matches.
 */
function classesOf(host, selector) {
    const element = host.querySelectorAll(selector)[0];
    return element ? element.className : "";
}

/**
 * Returns the markup a control assigned to an element. The stub keeps innerHTML as the
 * string it was given rather than parsing it into nodes, so an icon written that way is
 * only reachable as text.
 * @param {object} host - The host element.
 * @param {string} selector - The selector of the element carrying the markup.
 * @returns {string} The innerHTML, or "" when nothing matches.
 */
function markupOf(host, selector) {
    const element = host.querySelectorAll(selector)[0];
    return element ? String(element.innerHTML || "") : "";
}

/**
 * Collects every icon class a control put into its dom, from both the class lists it set
 * and the markup it assigned.
 * @param {object} host - The host element.
 * @returns {Set<string>} The icon class names, without the base class.
 */
function iconsIn(host) {
    const found = new Set();
    const collect = (text) => {
        for (const match of String(text || "").matchAll(/wx-icon-light-[a-z0-9-]+/g)) {
            found.add(match[0]);
        }
    };

    collect(host.className);
    collect(host.innerHTML);
    for (const element of host.querySelectorAll("*")) {
        collect(element.className);
        collect(element.innerHTML);
    }

    return found;
}

test("the date control renders the month grid through the icon set", () => {
    const classes = classesOf(build("webexpress.webui.date.js", "DateCtrl"), "i");
    assert.equal(
        classes,
        "wx-icon-light wx-icon-light-calendar",
        "the control emits the resolved class pair, not a bare symbol name"
    );
});

test("the date input keeps its own class beside the icon", () => {
    const classes = classesOf(build("webexpress.webui.input.date.js", "InputDateCtrl"), ".wx-date-calendar-icon");
    assert.equal(
        classes,
        "wx-date-calendar-icon wx-icon-light wx-icon-light-calendar",
        "the layout class stays, the icon classes are added beside it"
    );
});

test("the calendar toolbar renders all three of its buttons", () => {
    const host = build("webexpress.webui.input.calendar.js", "InputCalendarCtrl");
    assert.equal(
        markupOf(host, ".wx-calendar-today-btn"),
        '<i class="wx-icon-light wx-icon-light-calendar-day"></i>',
        "today keeps the day-specific calendar rather than the plain grid"
    );
    assert.equal(markupOf(host, ".wx-calendar-clear-btn"), '<i class="wx-icon-light wx-icon-light-trash"></i>');
    assert.equal(markupOf(host, ".wx-calendar-copy-btn"), '<i class="wx-icon-light wx-icon-light-clone"></i>');
});

test("the icon set keeps the two calendar glyphs apart", () => {
    const rt = loadWebUi({ browser: true });

    // the month grid and the single highlighted day are different drawings; a page that
    // mixes server- and client-built icons shows the difference side by side
    assert.equal(rt.wx.IconSet.resolve("calendar"), "wx-icon-light wx-icon-light-calendar");
    assert.equal(rt.wx.IconSet.resolve("calendar-day"), "wx-icon-light wx-icon-light-calendar-day");

    // legacy FontAwesome names still arrive from stored data and must land on the same set
    assert.equal(rt.wx.IconSet.resolve("fas fa-calendar-days"), "wx-icon-light wx-icon-light-calendar");
    assert.equal(rt.wx.IconSet.resolve("fas fa-calendar-day"), "wx-icon-light wx-icon-light-calendar-day");
});

test("every class these controls ask for is defined in the icon stylesheet", () => {
    const css = fs.readFileSync(iconCss, "utf8");
    const defined = new Set(
        [...css.matchAll(/\.(wx-icon-light-[a-z0-9-]+)\s*\{/g)].map((m) => m[1])
    );
    assert.ok(defined.size > 100, "the stylesheet was read and holds the icon set");

    const hosts = [
        build("webexpress.webui.date.js", "DateCtrl"),
        build("webexpress.webui.input.date.js", "InputDateCtrl"),
        build("webexpress.webui.input.calendar.js", "InputCalendarCtrl")
    ];

    const asked = new Set();
    for (const host of hosts) {
        for (const name of iconsIn(host)) {
            asked.add(name);
        }
    }

    assert.ok(asked.size >= 4, `the controls emit icons (found ${[...asked].join(", ")})`);
    for (const name of asked) {
        assert.ok(defined.has(name), `${name} is asked for but no rule defines it`);
    }
});
