/**
 * Headless test for the ModalFormCtrl content relocation (wx-webui-modal-form).
 *
 * A data bound form (for example a WebApp RestForm) is rendered empty by the
 * server and carries its endpoint in hidden island child elements (wx-service,
 * wx-state); the form controller that hydrates the injected form reads those
 * islands from the form's direct children. When such a form is shown inside a
 * modal, the modal fetches the edit page and relocates the form fields into its
 * body. This test pins that the relocation keeps the hidden metadata islands as
 * direct children of the form, so the injected form still finds its endpoint and
 * loads its data, while the visible fields and the submit button move to the
 * modal body and footer.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads a WebUI runtime with the modal form control and a DOMParser stub whose
 * parseFromString returns a document the test builds from the runtime's own
 * element stubs, so the control manipulates the same element class it does in
 * the browser.
 */
function loadModalForm() {
    // the DOMParser the control constructs returns whatever the test parked in
    // the holder, which lets the test build the parsed tree after the runtime
    // (and its element stub) exists
    const holder = { doc: null };

    const rt = loadWebUi({
        browser: true,
        extraFiles: [
            "webexpress.webui.modal.js",
            "webexpress.webui.modal.page.js",
            "webexpress.webui.modal.form.js"
        ],
        globals: {
            DOMParser: class {
                parseFromString() {
                    return holder.doc;
                }
            }
        }
    });

    return { rt, holder };
}

/**
 * Builds a host modal element that carries the control's marker class.
 */
function buildHost(rt) {
    const host = rt.createElement("div");
    host.classList.add("wx-webui-modal-form");
    host.id = "myFormEdit";
    rt.document.body.appendChild(host);
    return host;
}

/**
 * Builds the parsed edit-page document the modal fetches: a title and an empty
 * data bound form that carries a hidden wx-service island, a visible main with
 * a field and a submit button.
 */
function buildParsedDoc(rt) {
    const form = rt.createElement("form");
    form.classList.add("wx-webapp-restform");
    form.setAttribute("data-method", "PUT");
    form.setAttribute("data-mode", "edit");
    form.setAttribute("data-id", "the-id");

    const island = rt.createElement("wx-service");
    island.setAttribute("hidden", "");
    island.setAttribute("name", "data");
    island.setAttribute("base-uri", "/webui/api/1/character");

    const main = rt.createElement("main");
    const input = rt.createElement("input");
    input.setAttribute("name", "Name");
    main.appendChild(input);

    const buttonPanel = rt.createElement("div");
    const submit = rt.createElement("button");
    submit.setAttribute("type", "submit");
    buttonPanel.appendChild(submit);

    // islands come first, mirroring the C# EmitDataIslands order
    form.appendChild(island);
    form.appendChild(main);
    form.appendChild(buttonPanel);

    const doc = {
        title: "Edit Character",
        querySelector: (selector) => (selector === "form" ? form : null)
    };

    return { doc, form, island, main, submit };
}

test("the modal keeps hidden islands as direct children of the form", () => {
    const { rt, holder } = loadModalForm();
    const host = buildHost(rt);
    const ctrl = new rt.wx.ModalFormCtrl(host);

    const parsed = buildParsedDoc(rt);
    holder.doc = parsed.doc;

    ctrl._update("<ignored/>");

    // the hidden island stays a direct child of the form, so a form controller
    // instantiated on the injected form reads its endpoint from the islands
    assert.equal(parsed.island.parentNode, ctrl._form, "the wx-service island is a direct child of the form");
    assert.ok(
        ctrl._form.children.some((child) => child.tagName === "WX-SERVICE"),
        "the form exposes the island among its direct children"
    );
});

test("the visible fields move to the modal body and the submit to the footer", () => {
    const { rt, holder } = loadModalForm();
    const host = buildHost(rt);
    const ctrl = new rt.wx.ModalFormCtrl(host);

    const parsed = buildParsedDoc(rt);
    holder.doc = parsed.doc;

    ctrl._update("<ignored/>");

    // the visible main is relocated into the modal body, not left on the form
    assert.ok(ctrl._bodyDiv.querySelectorAll("main").length === 1, "the main is in the modal body");
    assert.equal(ctrl._bodyDiv.querySelectorAll("[name='Name']").length, 1, "the field is in the modal body");

    // no hidden island leaks into the visible body
    assert.equal(ctrl._bodyDiv.querySelectorAll("wx-service").length, 0, "no island leaks into the body");

    // the submit button is moved into the footer
    assert.ok(
        ctrl._footerDiv.children.some((child) => child.getAttribute("type") === "submit"),
        "the submit button is in the modal footer"
    );

    // the title reflects the fetched page
    assert.equal(ctrl._titleH1.textContent, "Edit Character");
});
