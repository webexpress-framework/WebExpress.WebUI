/**
 * Guards the left inset of the code control.
 *
 * A code line is indented so the line number, which is placed absolutely at the
 * left edge, has a gutter to sit in. That indent belongs to the numbered variant
 * alone: applied to both, every block without line numbers is pushed in by the
 * width of a gutter nothing occupies - on top of the padding the code area
 * already has - and stops lining up with the text around it. Nothing in the DOM
 * shows that; only the resolved cascade does.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const css = fs.readFileSync(
    path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../WebExpress.WebUI/Assets/css/webexpress.webui.code.css"
    ),
    "utf8"
).replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * Resolves the padding-left an element gets, given the classes on its ancestor
 * chain. Every selector here is a plain descendant chain of classes, so a rule
 * applies when all the classes it names are present.
 * @param {string[]} classes - The classes on the element and its ancestors.
 * @returns {string|null} The winning value, or null when no rule declares it.
 */
function paddingLeft(classes) {
    const present = new Set(classes);
    let winner = null;

    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const declarations = match[2];
        const value = /(?:^|;)\s*padding-left\s*:\s*([^;]+)/.exec(declarations)?.[1]?.trim()
            ?? /(?:^|;)\s*padding\s*:\s*([^;]+)/.exec(declarations)?.[1]?.trim();

        if (!value) {
            continue;
        }

        for (const selector of match[1].split(",")) {
            const named = selector.match(/\.([\w-]+)/g) || [];
            if (!named.length || !named.every((name) => present.has(name.slice(1)))) {
                continue;
            }
            // the element itself is a span; a rule ending in another type selector
            // (code, button) describes a different element
            if (/(?:^|[\s>])(code|button|div)\b/.test(selector.trim())) {
                continue;
            }
            winner = { selector: selector.trim(), value: value, specificity: named.length };
        }
    }

    return winner;
}

test("a code line without numbers is not indented by the number gutter", () => {
    const winner = paddingLeft(["wx-code", "wx-code-line"]);

    assert.equal(
        winner,
        null,
        `an unnumbered line takes the padding of the code area alone, but "${winner?.selector}" adds ${winner?.value}`
    );
});

test("a code line with numbers keeps the gutter the number sits in", () => {
    const winner = paddingLeft(["wx-code", "wx-code-line-numbers"]);

    assert.ok(winner, "the numbered variant reserves the gutter");
    assert.match(winner.value, /^2\.5rem$/, "and reserves as much as the number is wide");
    assert.match(winner.selector, /wx-code-line-numbers/, "on the numbered variant, not on both");
});

test("the number is placed inside the gutter it reserves", () => {
    const rule = /\.wx-code\s+\.wx-code-line-numbers\s*>\s*span::before\s*\{([^}]*)\}/.exec(css);

    assert.ok(rule, "the line number rule exists");
    assert.match(rule[1], /position:\s*absolute/);
    assert.match(rule[1], /left:\s*0/, "it is placed at the left edge of the line");
    assert.match(rule[1], /width:\s*2rem/, "and is narrower than the gutter reserved for it");
});
