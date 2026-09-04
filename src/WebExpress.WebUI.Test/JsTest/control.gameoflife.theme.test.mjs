/**
 * Guards the theme reading of the Game of Life.
 *
 * The canvas is transparent, so the ground is always the page's - which means the colors have to
 * be the part that moves. A cell keeps the hue it inherited from its parents, because that is
 * what says which colony it belongs to; only its lightness is read into the band the current
 * theme leaves room for, and a theme switch while the page is open has to reach it.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWebUi } from "./harness.mjs";

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "WebExpress.WebUI", "Assets");

const FILE = "webexpress.webui.gameoflife.js";

/**
 * Mounts the control on a host of a known size, in the given theme.
 * @param {string} theme - "light" or "dark".
 * @returns {object} The runtime and the controller.
 */
function mount(theme) {
    const rt = loadWebUi({ browser: true, extraFiles: [FILE] });

    rt.document.documentElement.setAttribute("data-bs-theme", theme);

    const host = rt.createElement("div");
    host.classList.add("wx-webui-gameoflife");
    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);

    return { rt, ctrl: rt.wx.Controller.instanceMap.get(host) };
}

/**
 * Reads the lightness of a hex color.
 * @param {object} ctrl - The controller, which owns the conversion.
 * @param {string} hex - The color.
 * @returns {number} The lightness in percent.
 */
const lightness = (ctrl, hex) => ctrl._hexToHsl(hex).l;

test("a dark page lifts the colors above its ground", () => {
    const { ctrl } = mount("dark");
    const band = ctrl.constructor.BANDS.dark;

    for (const color of ctrl._palette) {
        const drawn = ctrl._tint(color);

        assert.ok(lightness(ctrl, drawn) >= band.min - 0.5, `${color} -> ${drawn} is light enough to read`);
    }
});

test("a light page settles the colors below its ground", () => {
    const { ctrl } = mount("light");
    const band = ctrl.constructor.BANDS.light;

    for (const color of ctrl._palette) {
        const drawn = ctrl._tint(color);

        assert.ok(lightness(ctrl, drawn) <= band.max + 0.5, `${color} -> ${drawn} is dark enough to read`);
    }
});

test("a cell keeps the hue it inherited", () => {
    const { ctrl } = mount("dark");

    for (const color of ctrl._palette) {
        const before = ctrl._hexToHsl(color);
        const after = ctrl._hexToHsl(ctrl._tint(color));

        // the hue is what says which colony a cell belongs to, so the theme must not touch it
        assert.ok(Math.abs(after.h - before.h) < 2, `${color} keeps its hue`);
    }
});

test("switching the theme while the page is open reaches the cells", () => {
    const { rt, ctrl } = mount("light");
    const onLight = ctrl._tint("#8ecae6");

    rt.document.documentElement.setAttribute("data-bs-theme", "dark");

    // the observer is asynchronous in a browser; the cache emptying is what it does
    ctrl._tinted.clear();

    assert.notEqual(ctrl._tint("#8ecae6"), onLight, "the same cell is drawn differently on the other ground");
});

test("the teardown stops the animation and the theme watch", () => {
    const { ctrl } = mount("dark");

    ctrl._animationFrameId = 1;
    ctrl.destroy();

    assert.equal(ctrl._animationFrameId, null, "no frame is left scheduled");
    assert.equal(ctrl._themeObserver, null, "and nothing is left watching the document");
});

test("the board keeps a name a stylesheet can reach after it has mounted", () => {
    const { ctrl } = mount("dark");

    // the registry takes the class the control was recognised by off the element, so a rule
    // written for that name alone would stop applying the moment the board comes alive
    assert.ok(ctrl._element.classList.contains("wx-gameoflife"), "the styling hook is its own name");
    assert.ok(!ctrl._element.classList.contains("wx-webui-gameoflife"), "the marker was consumed");

    ctrl.destroy();
    assert.ok(!ctrl._element.classList.contains("wx-gameoflife"), "and it is given back on teardown");
});

test("the ground is the theme's, and both names carry it", () => {
    const css = fs.readFileSync(path.join(assets, "css", "webexpress.webui.css"), "utf8");
    const rule = css.match(/\.wx-webui-gameoflife,\s*\.wx-gameoflife\s*\{([^}]*)\}/);

    assert.ok(rule, "both the authored and the mounted name are styled");
    assert.match(rule[1], /background-color:\s*var\(--wx-/, "the ground comes from a theme variable");
});

test("nothing writes a ground into the document the board is saved in", () => {
    const addon = fs.readFileSync(path.join(assets, "js", "editor", "addons", "gameoflife.js"), "utf8");

    // an inline colour outranks every stylesheet, so a board written into a document with one
    // would stay on that ground whatever theme the reader is in. Only the emitted style matters
    // here - the file may well say the word while explaining why it does not write one.
    const style = addon.match(/style="([^"]*)"/);

    assert.ok(style, "the block still carries a style attribute");
    assert.doesNotMatch(style[1], /background/, "but no colour in it");
    assert.match(style[1], /height:\s*300px/, "only the size, which is the block's own");
});
