/**
 * Guards the reach of the prose list indent.
 *
 * A reading view indents its lists so the markers have room. A menu, a listbox or a tab strip is
 * a list in markup only: it carries a role of its own, lays its own entries out, and has no
 * marker for that indent to make room for - so the indent pushes every entry in by a gutter that
 * nothing occupies. The rule used to reach them because an element in the selector outweighs the
 * single class the controls reset their list with (Bootstrap's `.dropdown-menu` sets
 * `padding: .5rem 0`), which is a cascade fact no DOM test can see.
 *
 * The exclusions therefore live inside `:where()`, which weighs nothing: that holds the rule at
 * one class and one element, the same weight a control's own `.wx-x > ul` reset carries, so a
 * control served after this sheet keeps its own list geometry without being named here. Take the
 * `:where()` away and every control list in a reading view is indented again, which is why the
 * tests below pin it rather than only the named exclusions.
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

/**
 * Removes every :where() group from a selector. The groups nest parentheses, so they are
 * matched by counting rather than by a regex.
 * @param {string} selector - The selector to strip.
 * @returns {string} The selector with what :where() holds removed.
 */
function withoutWhere(selector) {
    let out = "";

    for (let i = 0; i < selector.length; i++) {
        if (!selector.startsWith(":where(", i)) {
            out += selector[i];
            continue;
        }

        let depth = 0;
        for (i += ":where".length; i < selector.length; i++) {
            if (selector[i] === "(") { depth++; }
            if (selector[i] === ")" && --depth === 0) { break; }
        }
    }

    return out;
}

test("the prose list indent is written for lists, and excludes the ones controls build", () => {
    const indenting = selectorsSetting("padding-left").filter(s => /\b(ul|ol)\b/.test(s));

    assert.ok(indenting.length > 0, "the reading view still indents its lists");

    for (const selector of indenting) {
        assert.match(selector, /:not\(\[role\]\)/, `${selector} spares a list that carries a role of its own`);
        assert.match(selector, /:not\(\.dropdown-menu\)/, `${selector} spares a dropdown menu`);
    }
});

test("the indent weighs no more than the reset a control writes for its own list", () => {
    const indenting = selectorsSetting("padding-left").filter(s => /\b(ul|ol)\b/.test(s));

    for (const selector of indenting) {
        // a bare :not() counts towards specificity and outweighs ".wx-x > ul"; inside :where()
        // it costs nothing, which is what lets the control's own reset win on source order
        const bare = withoutWhere(selector);

        assert.doesNotMatch(bare, /:not\(/, `${selector} pays specificity for an exclusion, so it outranks every control reset`);
        assert.match(selector, /:where\(/, `${selector} has to hold its exclusions in :where()`);
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
