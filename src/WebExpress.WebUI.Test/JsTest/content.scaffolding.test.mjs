/**
 * Holds the client reading view against the same cases as the server-side reader.
 *
 * The rules for reading the working surface of the editor as a document exist twice: here in
 * webexpress.webui.content.js (ContentFormat) and on the server in WebControl/EditorContent.cs,
 * which is what converts a stored value to Markdown where no browser is available. The two
 * work on different trees and produce different output, so they cannot share code - they share
 * the cases in ../Data/editor-content.fixture.json instead, read by this file and by
 * UnitTestEditorContent.cs. A rule added on one side and forgotten on the other fails here.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEditorDocument } from "./dom-stub.editor.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const contentJs = path.resolve(here, "..", "..", "WebExpress.WebUI", "Assets", "js", "webexpress.webui.content.js");
const fixture = path.resolve(here, "..", "Data", "editor-content.fixture.json");

/**
 * Loads the converter into a fresh vm context backed by the rich DOM stub.
 * @returns {object} The namespace and the document.
 */
function loadContent() {
    const { document, globals } = createEditorDocument();

    const sandbox = {
        console,
        ...globals,
        webexpress: {
            webui: {
                Ctrl: class { constructor(element) { this._element = element; } destroy() { } },
                Controller: { registerClass() { }, createInstances() { } },
                I18N: { translate: (key) => key },
                IconSet: { resolve: (icon) => icon }
            }
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(contentJs, "utf8"), sandbox, { filename: contentJs });

    return { wx: sandbox.webexpress.webui, document };
}

const cases = JSON.parse(fs.readFileSync(fixture, "utf8")).cases;

test("the shared fixture is readable and holds cases", () => {
    assert.ok(Array.isArray(cases) && cases.length > 0, "the fixture the server reads too was found");
});

for (const entry of cases) {
    test(`reading view: ${entry.name}`, () => {
        const rt = loadContent();

        const host = rt.document.createElement("div");
        host.appendChild(rt.wx.ContentFormat.toFragment(entry.html));
        const text = host.textContent || "";

        for (const keep of entry.keeps || []) {
            assert.ok(text.includes(keep), `"${keep}" survives the conversion, got "${text}"`);
        }

        for (const drop of entry.drops || []) {
            assert.ok(!text.includes(drop), `"${drop}" does not reach the reader, got "${text}"`);
        }

        if (typeof entry.paragraphs === "number") {
            assert.equal(
                host.querySelectorAll("p").length,
                entry.paragraphs,
                "the paragraphs the author typed are kept and the guards are not"
            );
        }
    });
}
