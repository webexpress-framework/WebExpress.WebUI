/**
 * Headless contract and behavior tests for the InputBarcodeCtrl control
 * (wx-webui-input-barcode) and for the two ways it is used to edit a barcode in
 * place: inside a SmartEditCtrl and through the "barcode" table template.
 *
 * What matters beyond the field itself is that the read view is the symbol
 * rather than the raw value - a barcode that falls back to its text is exactly
 * the thing the control exists to avoid - and that an unencodable value is
 * reported while it is typed instead of at the scanner.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

const DEPS = ["webexpress.webui.barcode.js", "webexpress.webui.input.barcode.js"];

// the smart edit picks its read view from a chain of instanceof checks over the
// input controls. Only the barcode is loaded here on purpose: the chain has to
// survive every control it knows about but the page does not ship.
const SMART_EDIT_DEPS = ["webexpress.webui.smartedit.js"];
contract({
    file: "webexpress.webui.input.barcode.js",
    selector: "wx-webui-input-barcode",
    ctrl: "InputBarcodeCtrl",
    deps: ["webexpress.webui.barcode.js"]
});

/**
 * Loads a runtime with the barcode sources.
 * @param {string[]} [extra] - Additional sources to load.
 * @returns {object} The loaded runtime.
 */
function loadRuntime(extra = []) {
    return loadWebUi({ browser: true, extraFiles: [...DEPS, ...extra] });
}

/**
 * Builds a barcode input and its controller.
 * @param {object} rt - The loaded runtime.
 * @param {object} options - The attributes to set.
 * @returns {object} The element and its controller.
 */
function makeInput(rt, options = {}) {
    const element = rt.createElement("div");
    element.classList.add("wx-webui-input-barcode");
    Object.entries(options).forEach(([name, value]) => element.setAttribute(name, String(value)));
    rt.document.body.appendChild(element);

    return { element, ctrl: new rt.wx.InputBarcodeCtrl(element) };
}

test("the input pairs a named text field with a preview of the symbol", () => {
    const rt = loadRuntime();
    const input = makeInput(rt, { id: "article", name: "article", "data-value": "WX-2026" });

    const field = input.element.querySelector("input");
    assert.ok(field, "the value is edited in a text field");
    assert.equal(field.name, "article", "which carries the name, so a submit needs no hidden field");
    assert.equal(field.value, "WX-2026", "and starts at the current value");

    assert.ok(input.element.querySelector(".wx-barcode-graphic"), "the symbol is previewed beside it");
});

test("typing redraws the preview and announces the value", () => {
    const rt = loadRuntime();
    const input = makeInput(rt, { "data-value": "WX-1" });

    const events = [];
    input.element.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, (e) => events.push(e.detail));

    const field = input.element.querySelector("input");
    field.value = "WX-2";
    // a committed edit redraws at once instead of waiting out the typing pause
    field.dispatchEvent({ type: "change" });

    assert.equal(input.ctrl.value, "WX-2", "the control takes the typed value over");
    assert.equal(events.length, 1, "the change is announced once");
    assert.equal(events[0].value, "WX-2");
    assert.ok(input.element.querySelector(".wx-barcode-graphic"), "the preview is drawn");
});

test("a value the symbology cannot encode marks the field invalid while it is typed", () => {
    const rt = loadRuntime();
    const input = makeInput(rt, { "data-type": "ean13", "data-value": "4006381333931" });
    const field = input.element.querySelector("input");

    assert.equal(field.classList.contains("is-invalid"), false, "a valid EAN is accepted");
    assert.equal(field.getAttribute("aria-invalid"), "false");

    // one digit off: the check digit no longer matches
    field.value = "4006381333932";
    field.dispatchEvent({ type: "change" });

    assert.equal(field.classList.contains("is-invalid"), true, "the mistyped check digit is caught");
    assert.equal(field.getAttribute("aria-invalid"), "true", "and is reported to assistive technology");
    assert.equal(input.element.querySelector(".wx-barcode-graphic"), null, "nothing unscannable is drawn");
});

test("the symbology and the error correction level can be switched at runtime", () => {
    const rt = loadRuntime();
    const input = makeInput(rt, { "data-value": "https://webexpress-framework.github.io/" });

    input.ctrl.type = "qr";
    input.ctrl.level = "H";

    assert.equal(input.ctrl.type, "qr");
    assert.equal(input.ctrl.level, "H");
    assert.ok(input.element.querySelector(".wx-barcode-graphic"), "the QR preview is drawn");
});

test("the colors reach the preview rather than the field", () => {
    const rt = loadRuntime();
    const input = makeInput(rt, {
        "data-value": "WX-2026",
        "data-color-css": "text-primary",
        "data-bgcolor-style": "background-color:gold;"
    });

    const preview = input.element.querySelector(".wx-input-barcode-preview");
    assert.equal(preview.classList.contains("text-primary"), true, "the palette class colors the previewed symbol");
    assert.match(preview.style.cssText || "", /gold/, "and the custom ground reaches it too");
    assert.equal(input.element.classList.contains("text-primary"), false, "the field itself is left uncolored");
});

test("a read view built from the editor keeps its colors", () => {
    const rt = loadRuntime(SMART_EDIT_DEPS);

    const host = rt.createElement("div");
    const editor = rt.createElement("div");
    editor.setAttribute("data-value", "WX-2026");
    editor.setAttribute("data-color-css", "text-primary");
    const editorCtrl = new rt.wx.InputBarcodeCtrl(editor);
    editor._wx_controller = editorCtrl;
    host.appendChild(editor);
    rt.document.body.appendChild(host);

    new rt.wx.SmartEditCtrl(host);

    // the symbol must not change color when the editor closes, or the cell
    // would flicker between two appearances of the same value
    const view = host.querySelector(".wx-barcode");
    assert.ok(view, "the read view draws the symbol");
    assert.equal(view.classList.contains("text-primary"), true, "in the color the editor previewed it in");
});

test("inside a smart edit the read view is the symbol, not the raw value", () => {
    const rt = loadRuntime(SMART_EDIT_DEPS);

    // a smart edit takes its first child as the editor and builds the read view
    // from it, which is how a barcode becomes editable in place
    const host = rt.createElement("div");
    const editor = rt.createElement("div");
    editor.setAttribute("data-value", "WX-2026");
    editor.setAttribute("data-type", "code128");
    const editorCtrl = new rt.wx.InputBarcodeCtrl(editor);
    editor._wx_controller = editorCtrl;
    host.appendChild(editor);
    rt.document.body.appendChild(host);

    const smartEdit = new rt.wx.SmartEditCtrl(host);

    assert.equal(smartEdit.value, "WX-2026", "the smart edit reads the value from the editor");
    assert.ok(host.querySelector(".wx-barcode-graphic"), "the read view draws the symbol");
    assert.equal(host.querySelector("input"), null, "and shows no text field until editing starts");
});

test("the barcode table template renders read-only and editable cells", () => {
    const rt = loadRuntime([...SMART_EDIT_DEPS, "templates/default.js"]);

    const template = rt.wx.TableTemplates.get("barcode");
    assert.ok(template, "the template is registered");

    const readOnly = template.fn("WX-2026", null, { id: "1" }, {}, "code", { barcodeType: "code128" });
    assert.ok(readOnly.querySelector(".wx-barcode-graphic"), "the read-only cell draws the symbol");
    assert.equal(readOnly.querySelector("input"), null, "and offers no field");

    const editable = template.fn("WX-2026", null, { id: "1" }, {}, "code", { barcodeType: "code128", editable: "true" });
    assert.ok(editable.querySelector(".wx-barcode-graphic"), "the editable cell also shows the symbol");
    assert.equal(editable.classList.contains("wx-smart-edit"), true, "and is wrapped in a smart edit");

    // an empty read-only cell stays empty rather than drawing an error
    assert.equal(template.fn("", null, { id: "1" }, {}, "code", {}), "");
});

test("the table template carries the row endpoint into the inline edit", () => {
    const rt = loadRuntime([...SMART_EDIT_DEPS, "templates/default.js"]);

    const template = rt.wx.TableTemplates.get("barcode");
    const cell = template.fn("WX-2026", null, { id: "7", restApi: "/api/v1/articles/7" }, {}, "code", {
        barcodeType: "code128",
        editable: "true"
    });

    // the smart edit consumes these attributes, so their absence is what proves
    // the binding ran rather than their presence
    assert.equal(cell.getAttribute("data-form-action"), null, "the endpoint was taken over by the smart edit");
    assert.equal(cell.classList.contains("wx-smart-edit"), true, "which is mounted on the cell");
});
