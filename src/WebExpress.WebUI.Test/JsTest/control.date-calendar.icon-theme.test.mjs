/**
 * Headless tests for the icon theme of the date and calendar controls.
 *
 * The three controls build their icons in JavaScript, so nothing on the server
 * can theme them: they have to resolve the class themselves against the theme
 * the page carries on <html data-icon-theme>. A control that skips that renders
 * a FontAwesome glyph on a page where every other icon is a light SVG.
 *
 * The last test is the one that matters most. A light class is only a class
 * name - a control may ask for one that no rule defines, and the result is not
 * an error but an empty box where the icon should be, which no unit test that
 * only compares strings would notice. It therefore reads the shipped icon
 * stylesheet and holds every class these controls emit against it.
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
 * Builds a runtime in the given icon theme and constructs a control on a fresh
 * host. The theme is set before construction because the controls resolve their
 * icons once, while they build their dom.
 * @param {string} file - The control asset file name.
 * @param {string} ctrl - The controller class name.
 * @param {"light"|"default"} theme - The icon theme to render in.
 * @returns {object} The host element carrying the built control.
 */
function build(file, ctrl, theme) {
    const rt = loadWebUi({ browser: true, extraFiles: [webuiAsset(file)] });
    if (theme === "light") {
        rt.document.documentElement.dataset.iconTheme = "light";
    }

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
 * Returns the markup a control assigned to an element. The stub keeps innerHTML
 * as the string it was given rather than parsing it into nodes, so an icon
 * written that way is only reachable as text.
 * @param {object} host - The host element.
 * @param {string} selector - The selector of the element carrying the markup.
 * @returns {string} The innerHTML, or "" when nothing matches.
 */
function markupOf(host, selector) {
    const element = host.querySelectorAll(selector)[0];
    return element ? String(element.innerHTML || "") : "";
}

/**
 * Collects every light icon class a control put into its dom, from both the
 * class lists it set and the markup it assigned.
 * @param {object} host - The host element.
 * @returns {Set<string>} The light icon class names, without the base class.
 */
function lightIconsIn(host) {
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

test("the date control renders the month grid of the active theme", () => {
    const fa = classesOf(build("webexpress.webui.date.js", "DateCtrl", "default"), "i");
    assert.match(fa, /fa-calendar-days/, "the default theme keeps the FontAwesome glyph");

    const light = classesOf(build("webexpress.webui.date.js", "DateCtrl", "light"), "i");
    assert.equal(light, "wx-icon-light wx-icon-light-calendar", "the light theme swaps in the svg variant");
});

test("the date input keeps its own class beside the themed icon", () => {
    const fa = classesOf(build("webexpress.webui.input.date.js", "InputDateCtrl", "default"), ".wx-date-calendar-icon");
    assert.equal(fa, "wx-date-calendar-icon fa-solid fa-calendar-days");

    const light = classesOf(build("webexpress.webui.input.date.js", "InputDateCtrl", "light"), ".wx-date-calendar-icon");
    assert.equal(
        light,
        "wx-date-calendar-icon wx-icon-light wx-icon-light-calendar",
        "the layout class stays, only the icon half is exchanged"
    );
});

test("the calendar toolbar themes all three of its buttons", () => {
    const fa = build("webexpress.webui.input.calendar.js", "InputCalendarCtrl", "default");
    assert.equal(markupOf(fa, ".wx-calendar-today-btn"), '<i class="fa-solid fa-calendar-day"></i>');
    assert.equal(markupOf(fa, ".wx-calendar-clear-btn"), '<i class="fa-solid fa-trash"></i>');
    assert.equal(markupOf(fa, ".wx-calendar-copy-btn"), '<i class="fa-solid fa-clone"></i>');

    const light = build("webexpress.webui.input.calendar.js", "InputCalendarCtrl", "light");
    assert.equal(
        markupOf(light, ".wx-calendar-today-btn"),
        '<i class="wx-icon-light wx-icon-light-calendar-day"></i>',
        "today keeps the day-specific calendar rather than the plain grid"
    );
    assert.equal(markupOf(light, ".wx-calendar-clear-btn"), '<i class="wx-icon-light wx-icon-light-trash"></i>');
    assert.equal(markupOf(light, ".wx-calendar-copy-btn"), '<i class="wx-icon-light wx-icon-light-clone"></i>');
});

test("the two calendar glyphs resolve the way the server icons do", () => {
    const rt = loadWebUi({ browser: true });
    rt.document.documentElement.dataset.iconTheme = "light";

    // IconCalendarDays maps the month grid to the light set's plain "calendar",
    // IconCalendarDay to the day-specific one; a page that mixes server- and
    // client-built icons shows the difference side by side
    assert.equal(rt.wx.IconTheme.resolveFa("fas fa-calendar-days"), "wx-icon-light wx-icon-light-calendar");
    assert.equal(rt.wx.IconTheme.resolveFa("fas fa-calendar-day"), "wx-icon-light wx-icon-light-calendar-day");
});

test("every light class these controls ask for is defined in the icon stylesheet", () => {
    const css = fs.readFileSync(iconCss, "utf8");
    const defined = new Set(
        [...css.matchAll(/\.(wx-icon-light-[a-z0-9-]+)\s*\{/g)].map((m) => m[1])
    );
    assert.ok(defined.size > 100, "the stylesheet was read and holds the icon set");

    const hosts = [
        build("webexpress.webui.date.js", "DateCtrl", "light"),
        build("webexpress.webui.input.date.js", "InputDateCtrl", "light"),
        build("webexpress.webui.input.calendar.js", "InputCalendarCtrl", "light")
    ];

    const asked = new Set();
    for (const host of hosts) {
        for (const name of lightIconsIn(host)) {
            asked.add(name);
        }
    }

    assert.ok(asked.size >= 4, `the controls emit light icons (found ${[...asked].join(", ")})`);
    for (const name of asked) {
        assert.ok(defined.has(name), `${name} is asked for but no rule defines it`);
    }
});
