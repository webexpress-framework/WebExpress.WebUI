/**
 * Tests the policy EditorHtml.clean applies to markup that is shown as it stands - add-on
 * renderers, stored raw html, the reading view: nothing that runs, loads or instructs the framework.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

test("clean removes raw text containers, loading attributes and framework instructions", () => {
    const { wx, document } = loadEditor();
    const template = document.createElement("template");
    template.innerHTML = "<p>a</p><noscript><p>n</p></noscript><xmp>x</xmp>"
        + "<img src=\"/a.png\" srcset=\"https://evil/a.png 2x\" ping=\"https://evil\">"
        + "<a href=\"/x\" data-wx-primary-action=\"modal\" data-wx-bind=\"x\" data-wx-caret=\"1\">l</a>";
    const root = template.content || template;

    wx.EditorHtml.clean(root);

    assert.equal(root.querySelector("noscript"), null);
    assert.equal(root.querySelector("xmp"), null);
    const img = root.querySelector("img");
    assert.equal(img.getAttribute("src"), "/a.png");
    assert.equal(img.hasAttribute("srcset"), false);
    assert.equal(img.hasAttribute("ping"), false);
    const link = root.querySelector("a");
    assert.equal(link.hasAttribute("data-wx-primary-action"), false);
    assert.equal(link.hasAttribute("data-wx-bind"), false);
    assert.equal(link.getAttribute("data-wx-caret"), "1", "the editor's own marker stays");
});
