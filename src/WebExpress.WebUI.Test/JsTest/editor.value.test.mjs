/**
 * The value of the editor as a form fills it: a record whose text was never written sends
 * null, and the editor reads that as an empty document instead of refusing the whole form.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

test("null and undefined clear the document instead of throwing", () => {
    for (const absent of [null, undefined]) {
        const r = loadEditor({ html: "<p>alpha</p>" });

        assert.doesNotThrow(() => { r.editor.value = absent; }, "a missing value is no error");
        assert.ok(!JSON.stringify(r.editor.getState()).includes("alpha"), "the old text is gone");
    }
});

test("a value of another type is still refused", () => {
    const r = loadEditor();

    // the sandbox has its own TypeError, so the error is told by its name
    assert.throws(() => { r.editor.value = 42; }, (error) => error.name === "TypeError");
});
