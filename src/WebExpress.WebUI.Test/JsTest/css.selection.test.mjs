/**
 * Guards the cascade of the "selected" states of the tile picker and the segmented
 * choice against the shipped stylesheets.
 *
 * These states are painted by a single-purpose class on top of a base rule that
 * declares `border` and `box-shadow` as shorthands from a descendant selector. Such
 * a base rule outranks a plain `.wx-...-selected` rule, which silently erases the
 * frame while the markup still looks correct — a failure no DOM test can see. The
 * tests below therefore resolve the cascade for an element in the selected state and
 * assert that the selected rule is the one that wins.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cssDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../WebExpress.WebUI/Assets/css"
);

/**
 * Computes the specificity of a selector as (ids, classes, elements). Attributes
 * and pseudo-classes count as classes; `:not(...)` contributes its argument only.
 * @param {string} selector - The selector.
 * @returns {number[]} The specificity triple.
 */
function specificity(selector) {
    const ids = (selector.match(/#[\w-]+/g) || []).length;

    let classes = (selector.match(/\.[\w-]+/g) || []).length
        + (selector.match(/\[[^\]]+\]/g) || []).length
        + (selector.match(/(?<!:):(?!:)(?!not\b)[\w-]+/g) || []).length;

    for (const arg of selector.match(/:not\(([^)]*)\)/g) || []) {
        classes += (arg.match(/\.[\w-]+/g) || []).length
            + (arg.match(/(?<!:):(?!:)[\w-]+/g) || []).length;
    }

    const elements = (selector.match(/(?:^|[\s>+~])([a-z][\w-]*)/g) || []).length;

    return [ids, classes, elements];
}

/**
 * Reads the ordinary rules of a stylesheet, ignoring comments and media blocks.
 * @param {string} file - The stylesheet file name.
 * @returns {Array<object>} The rules as { order, selector, declarations }.
 */
function readRules(file) {
    let css = fs.readFileSync(path.join(cssDir, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");

    const rules = [];
    let order = 0;

    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const declarations = {};
        for (const declaration of match[2].matchAll(/([\w-]+)\s*:\s*([^;]+)/g)) {
            declarations[declaration[1].trim()] = declaration[2].trim();
        }
        for (const selector of match[1].split(",")) {
            if (selector.trim()) {
                rules.push({ order: order, selector: selector.trim(), declarations });
            }
        }
        order++;
    }

    return rules;
}

/**
 * Resolves which rule wins a property for an element carrying the given classes.
 * A selector applies when every class it names is present and it carries no state
 * pseudo-class; the longhand is also fed by its shorthand.
 * @param {string} file - The stylesheet file name.
 * @param {string[]} classes - The classes the element carries.
 * @param {string} property - The longhand property.
 * @returns {object|null} The winning rule.
 */
function resolve(file, classes, property) {
    const present = new Set(classes);
    const shorthand = property.split("-")[0];
    let winner = null;

    for (const rule of readRules(file)) {
        const named = rule.selector.match(/\.([\w-]+)/g) || [];
        if (!named.length || !named.every((c) => present.has(c.slice(1)))) {
            continue;
        }
        if (/:(hover|active|focus|disabled|focus-visible)/.test(rule.selector)) {
            continue;
        }

        const declared = Object.keys(rule.declarations)
            .find((key) => key === property || key === shorthand);
        if (!declared) {
            continue;
        }

        const key = [...specificity(rule.selector), rule.order];
        if (!winner || key.join(".") > winner.key.join(".")
            || key.some((v, i) => v > winner.key[i] && key.slice(0, i).every((w, j) => w === winner.key[j]))) {
            winner = { key: key, rule: rule, declared: declared };
        }
    }

    return winner;
}

test("the selected tile card wins its frame, ring and ground", () => {
    const classes = ["wx-tile-container", "wx-tile-card", "wx-tile-card-selected"];

    for (const property of ["border-color", "box-shadow", "background-color"]) {
        const winner = resolve("webexpress.webui.tile.css", classes, property);

        assert.ok(winner, `a rule declares ${property}`);
        assert.match(
            winner.rule.selector,
            /wx-tile-card-selected/,
            `${property} is won by the selected rule, not by "${winner.rule.selector}"`
        );
    }
});

test("the selected choice option wins its frame and ground", () => {
    const classes = ["wx-choice", "wx-choice-option", "wx-choice-option-selected"];

    for (const property of ["border-color", "background-color"]) {
        const winner = resolve("webexpress.webui.choice.css", classes, property);

        assert.ok(winner, `a rule declares ${property}`);
        assert.match(
            winner.rule.selector,
            /wx-choice-option-selected/,
            `${property} is won by the selected rule, not by "${winner.rule.selector}"`
        );
    }
});

test("hovering a selected option does not repaint its frame", () => {
    const hover = readRules("webexpress.webui.choice.css")
        .find((rule) => rule.selector.includes(":hover") && rule.declarations["border-color"]);

    assert.ok(hover, "the hover rule exists");
    assert.match(
        hover.selector,
        /:not\(\.wx-choice-option-selected\)/,
        "the hover rule excludes the selected option instead of outranking it"
    );
});
