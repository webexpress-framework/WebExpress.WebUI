/**
 * Focused tests for the persistence branch of the SmartEditCtrl submit. A cell
 * that declares data-form-action submits its form data there, while a cell
 * without one leaves the storing to its host and only announces the save. The
 * latter is what the data controls rely on, which route their writes through
 * the service layer instead of a form post.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the runtime with the real smartedit control. _getView walks an
 * instanceof chain over sibling input controls that are not under test here, so
 * they are stubbed to keep the chain from dereferencing undefined.
 * @returns {object} The loaded runtime.
 */
function loadRuntime() {
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.smartedit.js"],
        // the submit collects the editor fields as form data; the stub only has
        // to be constructible, the assertions look at the request itself
        globals: { FormData: class { constructor(form) { this.form = form; } } }
    });

    for (const name of ["InputSelectionCtrl", "InputMoveCtrl", "InputCalendarCtrl", "InputDateCtrl", "InputTagCtrl", "InputRatingCtrl", "InputColorCtrl", "InputTrafficLightCtrl", "EditorCtrl"]) {
        if (!rt.wx[name]) { rt.wx[name] = class { }; }
    }

    return rt;
}

/**
 * Builds an inline editable cell around a plain text input.
 * @param {object} rt - The loaded runtime.
 * @param {string|null} action - The value of data-form-action, or null.
 * @returns {object} The container element.
 */
function buildCell(rt, action) {
    const container = rt.document.createElement("div");
    const input = rt.document.createElement("input");
    input.type = "text";
    input.value = "before";
    container.appendChild(input);

    if (action) {
        container.setAttribute("data-form-action", action);
        container.setAttribute("data-form-method", "PATCH");
    }

    rt.document.body.appendChild(container);
    new rt.wx.SmartEditCtrl(container);

    return container;
}

/**
 * Starts the inline edit, sets a new value and submits the editor form.
 * @param {object} rt - The loaded runtime.
 * @param {object} container - The cell container.
 * @param {string} value - The value to type.
 * @returns {Promise<void>} Resolves after the submit handler settled.
 */
async function submit(rt, container, value) {
    container.dispatchEvent({ type: "dblclick", stopPropagation() { } });

    const form = container.querySelector("form");
    form.querySelector("input").value = value;
    form.dispatchEvent({ type: "submit", preventDefault() { } });

    await submit.settle();
}

/**
 * Lets the promise chains of a submit run out.
 * @returns {Promise<void>} Resolves after the pending microtasks.
 */
submit.settle = async () => {
    for (let i = 0; i < 20; i++) {
        await Promise.resolve();
    }
};

test("a cell without a form action announces the save without a request", async () => {
    const rt = loadRuntime();
    const requests = [];
    rt.sandbox.fetch = async (url, init) => {
        requests.push({ url: url, method: init && init.method });
        return { ok: true, status: 200 };
    };

    const container = buildCell(rt, null);
    const saved = [];
    container.addEventListener(rt.wx.Event.SAVE_INLINE_EDIT_EVENT, (e) => saved.push(e.detail));

    await submit(rt, container, "after");

    assert.deepEqual(requests, [], "no request is issued for a cell the host persists");
    assert.equal(saved.length, 1, "the save is announced exactly once");
    assert.equal(saved[0].status, 200, "the announced save reports success");
    assert.equal(container.textContent, "after", "the read view shows the new value");
});

test("a cell with a form action submits the new value there", async () => {
    const rt = loadRuntime();
    const requests = [];
    rt.sandbox.fetch = async (url, init) => {
        requests.push({ url: url, method: init && init.method });
        return { ok: true, status: 200 };
    };

    const container = buildCell(rt, "/api/characters/1");

    await submit(rt, container, "after");

    assert.equal(requests.length, 1, "the configured action receives the submit");
    assert.equal(requests[0].url, "/api/characters/1");
    assert.equal(requests[0].method, "PATCH");
});

test("a host that waits on a write keeps the editor until the write is confirmed", async () => {
    const rt = loadRuntime();
    const container = buildCell(rt, null);
    let release = null;
    container.addEventListener(rt.wx.Event.SAVE_INLINE_EDIT_EVENT, (e) => {
        e.detail.waitUntil(new Promise((resolve) => { release = resolve; }));
    });

    await submit(rt, container, "after");
    assert.ok(container.querySelector("form"), "the editor stays open while the write is on its way");
    assert.ok(container.querySelector(".spinner-button"), "and shows that it waits");

    release(true);
    await submit.settle();

    assert.equal(container.querySelector("form"), null);
    assert.equal(container.textContent, "after", "the confirmed value is taken over");
});

test("a write the host refuses sets the value back and leaves the cell editable", async () => {
    const rt = loadRuntime();
    const container = buildCell(rt, null);
    container.addEventListener(rt.wx.Event.SAVE_INLINE_EDIT_EVENT, (e) => {
        e.detail.waitUntil(Promise.resolve(false));
    });

    await submit(rt, container, "after");

    assert.equal(container.querySelector("form"), null, "the edit has ended");
    assert.equal(container.textContent, "before", "the value from before the edit is back");

    await submit(rt, container, "again");
    assert.ok(container.querySelector(".spinner-button") === null, "a second attempt runs through as well");
    assert.equal(container.textContent, "before", "and is refused the same way");
});

test("a rejected promise counts as a refusal, and revert and confirm decide at once", async () => {
    const rt = loadRuntime();
    const decisions = [
        (detail) => detail.waitUntil(Promise.reject(new Error("offline"))),
        (detail) => detail.revert(),
        (detail) => detail.confirm()
    ];
    const container = buildCell(rt, null);
    container.addEventListener(rt.wx.Event.SAVE_INLINE_EDIT_EVENT, (e) => decisions.shift()(e.detail));

    await submit(rt, container, "first");
    assert.equal(container.textContent, "before");
    await submit(rt, container, "second");
    assert.equal(container.textContent, "before");
    await submit(rt, container, "third");
    assert.equal(container.textContent, "third");
});

test("a form action save can be decided by the host as well", async () => {
    const rt = loadRuntime();
    rt.sandbox.fetch = async () => ({ ok: false, status: 409, statusText: "Conflict" });
    const container = buildCell(rt, "/api/characters/1");
    const statuses = [];
    container.addEventListener(rt.wx.Event.SAVE_INLINE_EDIT_EVENT, (e) => {
        statuses.push(e.detail.status);
        if (e.detail.status >= 400) {
            e.detail.revert();
        }
    });

    await submit(rt, container, "after");

    assert.deepEqual(statuses, [409]);
    assert.equal(container.textContent, "before", "the refused value is set back");
});
