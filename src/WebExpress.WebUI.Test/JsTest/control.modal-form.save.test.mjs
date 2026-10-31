/**
 * Headless tests for the dialog form as a saving control (docs/js/contract.md). The dialog
 * posts the form and shows what the server rendered back; whether the server took the values
 * is read from the state field the C# ControlForm renders, and announced like every other
 * saving control announces it.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the dialog form with a DOMParser that answers with the document the test parks,
 * and a transport that records what is sent.
 * @returns {object} The runtime, the parked document holder and the recorded requests.
 */
function load() {
    const holder = { doc: null };
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.modal.js", "webexpress.webui.modal.page.js", "webexpress.webui.modal.form.js"],
        globals: {
            DOMParser: class { parseFromString() { return holder.doc; } },
            FormData: class { constructor(form) { this.form = form; } }
        }
    });
    const requests = [];
    rt.wx.Transport.use({
        request: async (url, init) => {
            requests.push(init.body);
            return { ok: true, status: 200, data: { text: "<html/>" }, error: null };
        }
    });
    return { rt, holder, requests };
}

/**
 * Builds the document of a served form: a field and the state field of the C# form.
 * @param {object} rt - The runtime.
 * @param {string} state - The state the server rendered: Default, Success or Error.
 * @param {Function} [extend] - Adds to the form.
 * @returns {object} The parsed document.
 */
function served(rt, state, extend) {
    const form = rt.createElement("form");
    const field = rt.createElement("input");
    field.setAttribute("name", "Name");
    form.appendChild(field);
    const stateField = rt.createElement("input");
    stateField.setAttribute("type", "hidden");
    stateField.setAttribute("name", "controlform_character_state");
    stateField.value = state;
    form.appendChild(stateField);
    if (state === "Error") {
        const alert = rt.createElement("div");
        alert.className = "wx-validation-alert";
        alert.textContent = "The name is taken.";
        form.appendChild(alert);
    }
    extend?.(form);
    return { title: "Edit Character", querySelector: (selector) => (selector === "form" ? form : null) };
}

/**
 * Opens the dialog on a served form and records the save announcements of its host.
 * @param {Function} [extend] - Adds to the served form, given the runtime and the form.
 * @returns {object} The runtime, the dialog, the holder, the requests and the events.
 */
function open(extend) {
    const { rt, holder, requests } = load();
    const host = rt.createElement("dialog");
    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.ModalFormCtrl(host);
    holder.doc = served(rt, "Default", extend && ((form) => extend(rt, form)));
    ctrl._update("<html/>");
    // the stub form lists no controls of its own
    Object.defineProperty(ctrl._form, "elements", { get: () => ctrl._form.querySelectorAll("input") });
    const events = [];
    for (const name of ["BEFORE_SAVE_EVENT", "SAVED_EVENT", "DATA_ERROR_EVENT"]) {
        host.addEventListener(rt.wx.Event[name], (e) => events.push({ name: name, detail: e.detail }));
    }
    return { rt, host, ctrl, holder, requests, events };
}

async function submit(ctrl) {
    ctrl._form.dispatchEvent({ type: "submit", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } });
    for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
}

const names = (events) => events.map((event) => event.name);

test("a submission the server takes is announced before and as saved after", async () => {
    const { rt, ctrl, holder, requests, events } = open();
    holder.doc = served(rt, "Success");

    await submit(ctrl);

    assert.equal(requests.length, 1);
    assert.deepEqual(names(events), ["BEFORE_SAVE_EVENT", "SAVED_EVENT"]);
});

test("a submission the server's validation refuses is reported with its message", async () => {
    const { rt, ctrl, holder, events } = open();
    holder.doc = served(rt, "Error");

    await submit(ctrl);

    assert.deepEqual(names(events), ["BEFORE_SAVE_EVENT", "DATA_ERROR_EVENT"]);
    assert.equal(events[1].detail.action, "save");
    assert.equal(events[1].detail.error.kind, "validation");
    assert.equal(events[1].detail.error.message, "The name is taken.");
});

test("a vetoed submission is not sent", async () => {
    const { rt, host, ctrl, requests } = open();
    host.addEventListener(rt.wx.Event.BEFORE_SAVE_EVENT, (e) => e.preventDefault());

    await submit(ctrl);

    assert.equal(requests.length, 0);
});

test("a field control the browser cannot check holds the submission back", async () => {
    const { ctrl, requests, events } = open((rt, form) => {
        class RequiredCtrl extends rt.wx.Ctrl {
            get value() { return ""; }
            set value(value) { }
        }
        rt.wx.Controller.registerClass("wx-test-required", RequiredCtrl);
        const field = rt.createElement("div");
        field.classList.add("wx-test-required");
        field.setAttribute("data-required", "true");
        const hidden = rt.createElement("input");
        hidden.setAttribute("type", "hidden");
        hidden.setAttribute("name", "Ship");
        field.appendChild(hidden);
        form.appendChild(field);
        rt.wx.Controller.createInstances(field);
    });

    await submit(ctrl);

    assert.equal(requests.length, 0);
    assert.deepEqual(events, []);
    assert.equal(ctrl._form.querySelector("[data-required]").getAttribute("aria-invalid"), "true");
});
