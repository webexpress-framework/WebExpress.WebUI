/**
 * Focused tests for the "markdown" and "html" table cell templates
 * (templates/default.js). The markdown renderer must escape the raw value
 * before it rewrites the markup, so markdown data cannot inject HTML; the
 * html renderer inserts the trusted server value verbatim.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the runtime with the default table templates and renders one cell.
 * @param {string} type - The template type to render.
 * @param {string} value - The cell value.
 * @returns {object} The rendered node (or empty string).
 */
function render(type, value) {
    const rt = loadWebUi({ browser: true, extraFiles: ["templates/default.js"] });
    const tmpl = rt.wx.TableTemplates.get(type);
    assert.ok(tmpl, `the "${type}" template is registered`);
    return tmpl.fn(value, null, {}, {}, "col", {});
}

test("markdown renders emphasis, code and links as elements", () => {
    const node = render("markdown", "**bold** and *italic* with `code` and [link](https://example.com)");

    assert.equal(node.className, "wx-table-markdown");
    assert.ok(node.innerHTML.includes("<strong>bold</strong>"), "bold is rewritten");
    assert.ok(node.innerHTML.includes("<em>italic</em>"), "italic is rewritten");
    assert.ok(node.innerHTML.includes("<code>code</code>"), "code is rewritten");
    assert.ok(node.innerHTML.includes("<a href=\"https://example.com\""), "the link is rewritten");
});

test("markdown renders headings and lists", () => {
    const node = render("markdown", "# Title\n- one\n- two\n1. first");

    assert.ok(node.innerHTML.includes("<h1>Title</h1>"), "the heading is rewritten");
    assert.ok(node.innerHTML.includes("<ul><li>one</li><li>two</li></ul>"), "the unordered list is rewritten");
    assert.ok(node.innerHTML.includes("<ol><li>first</li></ol>"), "the ordered list is rewritten");
});

test("markdown escapes raw HTML in the value", () => {
    const node = render("markdown", "<script>alert(1)</script> stays *text*");

    assert.ok(node.innerHTML.includes("&lt;script&gt;"), "markup in the value is escaped");
    assert.ok(!node.innerHTML.includes("<script>"), "no element is injected");
    assert.ok(node.innerHTML.includes("<em>text</em>"), "markdown still renders after escaping");
});

test("markdown and html render an empty value as an empty cell", () => {
    assert.equal(render("markdown", ""), "");
    assert.equal(render("html", null), "");
});

test("html renders the trusted value verbatim", () => {
    const node = render("html", "<b>Guybrush</b> &ndash; <i>pirate</i>");

    assert.equal(node.className, "wx-table-html");
    assert.equal(node.innerHTML, "<b>Guybrush</b> &ndash; <i>pirate</i>");
});
