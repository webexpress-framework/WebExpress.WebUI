/**
 * Tests the client counterparts of UrlPolicy and HtmlSanitizer of WebExpress.WebCore. The html
 * fields of tables, boards, tiles and dashboards and the options of a selection are data an
 * application wrote from user input; they pass webexpress.webui.Html.sanitize before they reach
 * innerHTML, and addresses from data pass webexpress.webui.Url before they become a link.
 *
 * The richer editor DOM stub is used, since it parses and serializes markup.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEditorDocument } from "./dom-stub.editor.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, "..", "..", "WebExpress.WebUI", "Assets", "js", "webexpress.webui.js");

/**
 * Loads the Url and Html helpers of the shipped core into a context with a parsing DOM.
 * @returns {object} The webexpress.webui namespace.
 */
function load() {
    const { document, globals } = createEditorDocument();
    const code = fs.readFileSync(source, "utf8");
    const start = code.indexOf("webexpress.webui.Url = new class");
    const end = code.indexOf("webexpress.webui.Actions = new class");
    const sandbox = { console, ...globals, document, webexpress: { webui: {} } };
    vm.createContext(sandbox);
    // only the two helpers are evaluated; the rest of the core needs a browser
    vm.runInContext(code.slice(start, code.lastIndexOf("/**", end)), sandbox, { filename: source });
    return sandbox.webexpress.webui;
}

test("addresses are allowed by scheme as a browser reads it", () => {
    const { Url } = load();
    assert.equal(Url.isSafeLink("https://example.com/a"), true);
    assert.equal(Url.isSafeLink("/relative?x=1"), true);
    assert.equal(Url.isSafeLink("mailto:a@b.c"), true);
    assert.equal(Url.isSafeLink("javascript:alert(1)"), false);
    assert.equal(Url.isSafeLink(" JaVa\tScRiPt:alert(1)"), false);
    assert.equal(Url.isSafeLink("data:text/html,<script>alert(1)</script>"), false);
    assert.equal(Url.safeLink("vbscript:x"), null);
    assert.equal(Url.isSafeImage("data:image/png;base64,AA=="), true);
    assert.equal(Url.isSafeImage("data:image/svg+xml,<svg onload=alert(1)>"), false);
});

test("markup from data loses everything that can run script", () => {
    const { Html } = load();
    const html = Html.sanitize("<b onclick=\"x()\">bold</b><script>alert(1)</script>"
        + "<a href=\"javascript:alert(1)\">bad</a><a href=\"/ok\">ok</a>"
        + "<img src=\"x\" onerror=\"alert(1)\"><div data-wx-primary-uri=\"/x\" id=\"y\">d</div>"
        + "<span style=\"color: red; position: fixed\">c</span>");

    assert.doesNotMatch(html, /script|onclick|onerror|javascript|data-wx|id=|position/);
    assert.match(html, /<b>bold<\/b>/);
    assert.match(html, /<a href="\/ok" rel="nofollow noopener noreferrer">ok<\/a>/);
    assert.match(html, /<img src="x">/);
    assert.match(html, /<span style="color: red;">c<\/span>/);
});

test("text is escaped for markup", () => {
    const { Html } = load();
    assert.equal(Html.escape("<img src=x onerror=y> & \"'"), "&lt;img src=x onerror=y&gt; &amp; &quot;&#39;");
    assert.equal(Html.escape(null), "");
});

test("a link from data never points at an unsafe address and never jumps to the top", () => {
    const { Url } = load();
    const { document } = createEditorDocument();
    const anchor = document.createElement("a");

    Url.link(anchor, "javascript:alert(1)");
    assert.equal(anchor.getAttribute("href"), "#");
    let prevented = false;
    anchor.dispatchEvent({ type: "click", preventDefault() { prevented = true; } });
    assert.equal(prevented, true, "the placeholder does not navigate");

    Url.link(anchor, "/page");
    assert.equal(anchor.getAttribute("href"), "/page");
    prevented = false;
    anchor.dispatchEvent({ type: "click", preventDefault() { prevented = true; } });
    assert.equal(prevented, false, "a real address is followed");
});
