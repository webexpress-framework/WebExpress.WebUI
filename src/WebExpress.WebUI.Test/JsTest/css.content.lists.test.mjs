/**
 * Guards the reach of the prose list indent.
 *
 * A reading view indents its lists so the markers have room. A menu, a listbox or a tab strip is
 * a list in markup only: it carries a role of its own, lays its own entries out, and has no
 * marker for that indent to make room for - so the indent pushes every entry in by a gutter that
 * nothing occupies. The rule reaches them because an element in the selector outweighs the
 * single class the controls reset their list with (Bootstrap's `.dropdown-menu` sets
 * `padding: .5rem 0`), which is a cascade fact no DOM test can see.
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
        "../../WebExpress.WebUI/Assets/css/webexpress.webui.content.css"
    ),
    "utf8"
).replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * Returns the selectors of every rule that sets the given property.
 * @param {string} property - The declaration to look for.
 * @returns {string[]} The selectors, one per comma-separated part.
 */
function selectorsSetting(property) {
    const found = [];

    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (new RegExp("(?:^|;)\\s*" + property + "\\s*:").test(rule[2])) {
            found.push(...rule[1].split(",").map(s => s.trim()).filter(Boolean));
        }
    }

    return found;
}

test("the prose list indent is written for lists, and excludes the ones controls build", () => {
    const indenting = selectorsSetting("padding-left").filter(s => /\b(ul|ol)\b/.test(s));

    assert.ok(indenting.length > 0, "the reading view still indents its lists");

    for (const selector of indenting) {
        assert.match(selector, /:not\(\[role\]\)/, `${selector} spares a list that carries a role of its own`);
        assert.match(selector, /:not\(\.dropdown-menu\)/, `${selector} spares a dropdown menu`);
    }
});

test("nothing else in the reading view reaches into a dropdown menu", () => {
    for (const rule of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
        for (const selector of rule[1].split(",")) {
            const trimmed = selector.trim();

            // a rule may name the menu to exclude it; naming it to style it would mean the
            // reading view is decorating a control it does not own
            if (trimmed.includes(".dropdown-menu") && !trimmed.includes(":not(.dropdown-menu)")) {
                assert.fail(`${trimmed} styles a control's menu from the reading view`);
            }
        }
    }
});
