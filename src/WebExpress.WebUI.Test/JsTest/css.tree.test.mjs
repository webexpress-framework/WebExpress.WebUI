/**
 * Guards the alignment of tree labels.
 *
 * A label that is no link is a button, and a button centres its text. A label short
 * enough for one line hides that; one that wraps - a page title in the narrow side pane
 * of a sidebar dialog, say - is centred under itself and stops lining up with the
 * labels above and below it.
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
        "../../WebExpress.WebUI/Assets/css/webexpress.webui.tree.css"
    ),
    "utf8"
).replace(/\/\*[\s\S]*?\*\//g, "");

test("a tree label starts its lines at the same edge as its neighbours", () => {
    const rule = /\.wx-tree-label-container\s*\{([^}]*)\}/.exec(css);
    assert.ok(rule, "the label rule exists");
    assert.match(rule[1], /text-align:\s*start/);
});
