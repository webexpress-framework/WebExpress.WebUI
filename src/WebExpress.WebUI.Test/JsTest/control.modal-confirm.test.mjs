import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";
import { deferred, settle } from "./modal.harness.mjs";

function setup() {
    const rt = loadWebUi({ browser: true, extraFiles: [
        "i18n/en.js", "webexpress.webui.modal.js", "webexpress.webui.modal.confirm.js"
    ] });
    return { ...rt, modal: new rt.wx.ModalConfirm() };
}

function confirm(modal) {
    return modal._confirmButton.onclick();
}

test("confirmation treats titles and messages as text and preserves the modal header controls", () => {
    const { modal } = setup();
    const value = '<img src=x onerror="bad()"> & <b>Tab</b>';
    modal.confirmation(value, value, () => {});
    assert.equal(modal._titleHeading.textContent, value);
    assert.equal(modal._titleHeading.parentNode, modal._headerDiv);
    assert.equal(modal._bodyDiv.querySelector("p").textContent, value);
    assert.equal(modal._headerDiv.querySelectorAll("button").length, 2);
    assert.equal(modal._element.getAttribute("aria-labelledby"), modal._titleHeading.id);
});

test("confirmation waits for async success and ignores duplicate clicks and dismissal while pending", async () => {
    const { modal } = setup();
    const request = deferred();
    let calls = 0;
    modal.confirmation("Delete?", "Tab A", () => { calls++; return request.promise; });
    modal.show();
    const first = confirm(modal);
    const second = confirm(modal);
    modal._element.dispatchEvent({ type: "cancel" });
    assert.equal(calls, 1);
    assert.equal(modal._confirmButton.disabled, true);
    assert.equal(modal._element.open, true);
    request.resolve(true);
    await Promise.all([first, second]);
    assert.equal(modal._element.open, false);
});

test("a failed confirmation stays open with an accessible error and permits retry", async () => {
    const { modal } = setup();
    let success = false;
    modal.confirmation("Delete?", "Tab A", () => success, { errorMessage: "Deletion failed." });
    modal.show();
    await confirm(modal);
    assert.equal(modal._element.open, true);
    assert.equal(modal._bodyDiv.querySelector('[role="alert"]').textContent, "Deletion failed.");
    assert.equal(modal._confirmButton.disabled, false);
    success = true;
    await confirm(modal);
    assert.equal(modal._element.open, false);
});

test("a rejected action releases the confirmation lock and shows the configured error", async () => {
    const { modal } = setup();
    modal.confirmation("Delete?", "Tab A", async () => { throw new Error("network"); }, { errorMessage: "Try again." });
    modal.show();
    await confirm(modal);
    assert.equal(modal._confirmButton.disabled, false);
    assert.equal(modal._bodyDiv.querySelector('[role="alert"]').textContent, "Try again.");
});

test("reusing a native dialog retains its host and emits one hide event per dismissal", () => {
    const { modal, wx } = setup();
    let hidden = 0;
    modal._element.addEventListener(wx.Event.MODAL_HIDE_EVENT, () => hidden++);
    for (let i = 0; i < 3; i++) {
        modal.confirmation("Delete?", "Tab A", () => {});
        modal.show();
        modal._cancelButton.click();
    }
    assert.equal(modal._element.tagName, "DIALOG");
    assert.equal(hidden, 3);
    modal.show();
    modal._element.dispatchEvent({ type: "cancel" });
    assert.equal(hidden, 4, "Escape also emits the framework hide event");
});

test("destroying an open confirmation disposes its dialog even during an outstanding action", async () => {
    const { modal } = setup();
    const request = deferred();
    modal.confirmation("Delete?", "Tab A", () => request.promise);
    modal.show();
    const action = confirm(modal);
    modal.destroy();
    assert.equal(modal._element.open, false);
    assert.equal(modal._element.parentNode, null);
    request.resolve(true);
    await action;
    await settle();
    assert.equal(modal._element.tagName, "DIALOG");
});

test("native dialog structure contains the title, body and footer without wrapper divs", () => {
    const { modal } = setup();
    assert.equal(modal._headerDiv.parentNode, modal._element);
    assert.equal(modal._bodyDiv.parentNode, modal._element);
    assert.equal(modal._footerDiv.parentNode, modal._element);
    assert.equal(modal._element.querySelector(".modal-dialog, .modal-content"), null);
});

test("an open confirmation cannot be retargeted to a different destructive action", async () => {
    const { modal } = setup();
    const calls = [];
    modal.confirmation("Delete?", "Tab A", () => calls.push("a"));
    modal.show();
    assert.equal(modal.confirmation("Delete?", "Tab B", () => calls.push("b")), false);
    await confirm(modal);
    assert.deepEqual(calls, ["a"]);
});

test("confirmation restores focus to the caller or its surviving fallback", async () => {
    const { modal, document, createElement } = setup();
    const trigger = createElement("button");
    const fallback = createElement("button");
    document.body.appendChild(trigger);
    document.body.appendChild(fallback);
    const focused = [];
    trigger.focus = options => focused.push(["trigger", options.preventScroll]);
    fallback.focus = options => focused.push(["fallback", options.preventScroll]);
    document.activeElement = trigger;
    modal.confirmation("Delete?", "Tab A", () => {}, { fallbackFocus: () => fallback });
    modal.show();
    modal.hide();
    assert.deepEqual(focused, [["trigger", true]]);
    modal.confirmation("Delete?", "Tab A", () => trigger.remove(), { fallbackFocus: () => fallback });
    modal.show();
    await confirm(modal);
    assert.deepEqual(focused, [["trigger", true], ["fallback", true]]);
});

test("leaving fullscreen keeps the native dialog open and handles an unspecified modal size", () => {
    const { modal, document } = setup();
    modal.show();
    modal.toggleFullscreen();
    modal.toggleFullscreen();
    assert.equal(modal._element.classList.contains("modal-fullscreen"), false);
    assert.equal(modal._element.classList.contains(""), false);
    assert.equal(modal._element.open, true);
    assert.equal(modal._fullscreenButton.getAttribute("aria-pressed"), "false");
});
