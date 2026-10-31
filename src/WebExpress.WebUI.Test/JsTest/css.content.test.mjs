/**
 * Guards the cascade around the instruction texts of the reading view.
 *
 * The editor stylesheet hides `.wx-editor-instruction` everywhere and brings it
 * back only inside `.wx-editor-content`, so the note stays invisible on a
 * published page. A reading view that was asked to keep the notes therefore has
 * to out-rank that hiding rule: without it the conversion keeps the node, the
 * markup looks correct and the note is still not on screen - a failure no DOM
 * test can see.
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
 * Reads the ordinary rules of the given stylesheets in include order, ignoring
 * comments and media blocks.
 * @param {string[]} files - The stylesheet file names, in include order.
 * @returns {Array<object>} The rules as { order, selector, declarations }.
 */
function readRules(files) {
    const rules = [];
    let order = 0;

    for (const file of files) {
        const css = fs.readFileSync(path.join(cssDir, file), "utf8")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");

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
    }

    return rules;
}

/**
 * Resolves which rule wins a property for an element whose ancestor chain
 * carries the given classes. A selector applies when every class it names is
 * present somewhere in that chain.
 * @param {string[]} files - The stylesheets, in include order.
 * @param {string[]} classes - The classes on the element and its ancestors.
 * @param {string} property - The property to resolve.
 * @returns {object|null} The winning rule.
 */
function resolve(files, classes, property) {
    const present = new Set(classes);
    let winner = null;

    for (const rule of readRules(files)) {
        const named = rule.selector.match(/\.([\w-]+)/g) || [];
        if (!named.length || !named.every((name) => present.has(name.slice(1)))) {
            continue;
        }
        if (/:(hover|active|focus|disabled|focus-visible|empty|has)/.test(rule.selector)) {
            continue;
        }
        if (!Object.prototype.hasOwnProperty.call(rule.declarations, property)) {
            continue;
        }

        // specificity here is the class count, since none of these selectors
        // carries an id or a type selector
        const key = [named.length, rule.order];
        if (!winner || key[0] > winner.key[0] || (key[0] === winner.key[0] && key[1] >= winner.key[1])) {
            winner = { key: key, rule: rule };
        }
    }

    return winner;
}

// the include order of IncludeStyleSheet: the content sheet is registered
// before the editor sheet, so the reading view may not rely on source order
const SHEETS = ["webexpress.webui.content.css", "webexpress.webui.editor.css"];

test("a kept instruction text is visible in the reading view", () => {
    const winner = resolve(SHEETS, ["wx-content", "wx-editor-instruction"], "display");

    assert.ok(winner, "a rule decides the display of an instruction text");
    assert.notEqual(
        winner.rule.declarations.display,
        "none",
        `the instruction stays hidden - "${winner.rule.selector}" wins the display`
    );
});

test("an instruction text is still hidden wherever the reading view is not", () => {
    const winner = resolve(SHEETS, ["wx-editor-instruction"], "display");

    assert.ok(winner, "a rule decides the display of an instruction text");
    assert.equal(
        winner.rule.declarations.display,
        "none",
        "a note to the author must not reach a page that only embeds the stored value"
    );
});
