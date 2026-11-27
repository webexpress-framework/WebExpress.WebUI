/**
 * Guards the reach of the reading view's image rule.
 *
 * The reading view scales its pictures to the column (`height: auto`). The page's content area
 * carries `.wx-content` as well, so the rule reaches every image of every control on the page -
 * the icons among them. `.wx-content img` and `img.wx-icon` weigh the same, and the content sheet
 * is served after the base sheet, so the later rule won and an icon was drawn at the size of its
 * drawing. That is a cascade fact no DOM test can see; the tests below resolve it from the
 * stylesheets in their include order.
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

// the include order of IncludeStyleSheet: the base sheet comes before the content sheet
const SHEETS = ["webexpress.webui.css", "webexpress.webui.content.css"];

/**
 * Reads the rules whose subject is an image, in include order, ignoring comments and media
 * blocks. Only descendant selectors of classes are understood; any other selector is skipped,
 * since it cannot be judged here.
 * @returns {Array<object>} The rules as { order, selector, ancestors, classes, excluded, declarations }.
 */
function readImageRules() {
    const rules = [];
    let order = 0;

    for (const file of SHEETS) {
        const css = fs.readFileSync(path.join(cssDir, file), "utf8")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");

        for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
            const declarations = {};
            for (const declaration of match[2].matchAll(/([\w-]+)\s*:\s*([^;]+)/g)) {
                declarations[declaration[1].trim()] = declaration[2].trim();
            }

            for (const selector of match[1].split(",").map(x => x.trim()).filter(Boolean)) {
                const parts = selector.split(/\s+/);
                const subject = parts.pop().match(/^img((?:\.[\w-]+|:not\(\.[\w-]+\))*)$/);

                if (!subject || !parts.every(x => /^(\.[\w-]+)+$/.test(x))) {
                    continue;
                }

                rules.push({
                    order: order,
                    selector: selector,
                    ancestors: parts.flatMap(x => x.match(/[\w-]+/g)),
                    classes: [...subject[1].matchAll(/(?<!:not\()\.([\w-]+)/g)].map(x => x[1]),
                    excluded: [...subject[1].matchAll(/:not\(\.([\w-]+)\)/g)].map(x => x[1]),
                    declarations: declarations
                });
            }

            order++;
        }
    }

    return rules;
}

/**
 * Resolves which rule wins a property for an image.
 * @param {string[]} classes - The classes on the image.
 * @param {string[]} ancestors - The classes on its ancestors.
 * @param {string} property - The property to resolve.
 * @returns {object|null} The winning rule.
 */
function resolve(classes, ancestors, property) {
    let winner = null;

    for (const rule of readImageRules()) {
        if (!rule.classes.every(x => classes.includes(x)) ||
            rule.excluded.some(x => classes.includes(x)) ||
            !rule.ancestors.every(x => ancestors.includes(x)) ||
            !Object.prototype.hasOwnProperty.call(rule.declarations, property)) {
            continue;
        }

        // every rule here has one type selector, so the class count decides, then the order;
        // the class inside :not() counts like any other
        const weight = rule.ancestors.length + rule.classes.length + rule.excluded.length;

        if (!winner || weight > winner.weight || (weight === winner.weight && rule.order >= winner.rule.order)) {
            winner = { weight: weight, rule: rule };
        }
    }

    return winner;
}

test("an icon of a control in the page content keeps the icon height", () => {
    const winner = resolve(["wx-icon"], ["wx-content"], "height");

    assert.ok(winner, "a rule decides the height of an icon");
    assert.equal(winner.rule.declarations.height, "1.2em", `"${winner.rule.selector}" sizes the icon`);
});

test("a large icon in the page content keeps the large icon height", () => {
    const winner = resolve(["wx-icon", "wx-icon-large"], ["wx-content"], "height");

    assert.ok(winner, "a rule decides the height of a large icon");
    assert.equal(winner.rule.declarations.height, "2.2em", `"${winner.rule.selector}" sizes the icon`);
});

test("a picture in the reading view still scales to the column", () => {
    const height = resolve([], ["wx-content"], "height");
    const width = resolve([], ["wx-content"], "max-width");

    assert.equal(height?.rule.declarations.height, "auto", "the picture keeps its aspect ratio");
    assert.equal(width?.rule.declarations["max-width"], "100%", "the picture never exceeds the column");
});
