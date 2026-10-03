/**
 * Headless contract test for the SlaGroupCtrl control (wx-webui-sla-group) -
 * the panel rendering of the agreement control, which ships in the same asset.
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * The stylesheet test below reads the declarations directly, because how the
 * panel sits in its host is a claim about the cascade that no dom stub answers.
 */
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contract } from "./controls.contract.mjs";

const CSS_PATH = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..", "..", "WebExpress.WebUI", "Assets", "css", "webexpress.webui.sla.css"
);

/**
 * Returns the declarations of the rule carrying exactly the given selector list.
 * @param {string} selector - The selector list as authored, whitespace-normalized.
 * @returns {string|null} The declaration block, or null when no rule matches.
 */
function cssRule(selector) {
    const css = fs.readFileSync(CSS_PATH, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

    for (const rule of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        if (rule[1].trim().replace(/\s*\n\s*/g, " ") === selector) {
            return rule[2];
        }
    }

    return null;
}

contract({
    file: "webexpress.webui.sla.js",
    selector: "wx-webui-sla-group",
    ctrl: "SlaGroupCtrl"
});

test("the panel gives up its own inset when a section already stepped it in", () => {
    // the section indents its body from the label; a second inset on top of that reads
    // as a nesting the panel does not have, since it draws no box to nest in
    const declarations = cssRule(".wx-section-body > .wx-sla-group");

    assert.match(declarations, /padding-left:\s*0/);
    assert.match(declarations, /padding-right:\s*0/);
    assert.match(cssRule(".wx-sla-group"), /padding:\s*0\.85rem 1rem/, "standalone it keeps the inset");
});
