/**
 * Guards how an icon sits against the text beside it.
 *
 * The icons are CSS masks with the drawing contained inside the em box, so the ink is inset and
 * the classic baseline nudge alone leaves them riding high next to a label. The framework's
 * answer is to centre them: a link is an inline-flex row and a button that carries an icon is
 * switched to one as well. Nothing in the DOM shows that - the stub resolves no styles - so the
 * stylesheets are asserted directly.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const css = path.resolve(here, "..", "..", "WebExpress.WebUI", "Assets", "css");

/**
 * Reads the declarations of every rule written for the given selector.
 * @param {string} file - The stylesheet file name.
 * @param {string} selector - Selector to look up, matched verbatim.
 * @returns {string|null} The declarations, or null when the selector carries no rule.
 */
function rule(file, selector) {
    const source = fs.readFileSync(path.join(css, file), "utf8");
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // a selector may head a group or follow a comma inside one, so both delimiters are accepted
    const matches = [...source.matchAll(new RegExp("(?:^|[};/,])\\s*" + escaped + "\\s*[,{]", "g"))];

    if (matches.length === 0) {
        return null;
    }

    // the selector may head a group, so the block is taken from the first "{" after the match
    const start = source.indexOf("{", matches[0].index + matches[0][0].length - 1);

    return source.slice(start + 1, source.indexOf("}", start));
}

test("a button carrying an icon centres it against the label", () => {
    const body = rule("webexpress.webui.icon.css", ".btn:has(> .wx-icon-light)");

    assert.ok(body, "the rule exists");
    assert.match(body, /display:\s*inline-flex/, "the button becomes a row");
    assert.match(body, /align-items:\s*center/, "whose items are centred against each other");
});

test("an image icon in a button is centred the same way", () => {
    assert.ok(rule("webexpress.webui.icon.css", ".btn:has(> .wx-icon-img)"), "an image icon stands in for a drawn one anywhere");
});

test("the centring is confined to buttons that carry an icon", () => {
    const source = fs.readFileSync(path.join(css, "webexpress.webui.icon.css"), "utf8");

    // a plain text button keeps the inline-block layout the button variants are built on, so the
    // switch must never be written for the bare .btn selector
    assert.doesNotMatch(source, /(?:^|[};])\s*\.btn\s*\{/, "no unconditional rule on .btn");
});

test("a link centres its icon, which is what the button rule follows", () => {
    const body = rule("webexpress.webui.css", ".wx-link");

    assert.ok(body, "the link rule exists");
    assert.match(body, /display:\s*inline-flex/);
    assert.match(body, /align-items:\s*center/);
});
