/**
 * Shared setup of the spreadsheet tests: loads the spreadsheet sources in include order and
 * builds controls on a host, as the controller does on a page.
 */
import { loadWebUi } from "./harness.mjs";

/**
 * The sources of the spreadsheet in the order IncludeJavaScript declares them, preceded by the
 * files they build on.
 */
export const SPREADSHEET_FILES = [
    "webexpress.webui.native.js",
    "webexpress.webui.ot.js",
    "webexpress.webui.input.color.js",
    "webexpress.webui.spreadsheet.model.js",
    "webexpress.webui.spreadsheet.formula.js",
    "webexpress.webui.spreadsheet.format.js",
    "webexpress.webui.spreadsheet.clipboard.js",
    "webexpress.webui.spreadsheet.collab.js",
    "webexpress.webui.spreadsheet.view.js",
    "webexpress.webui.spreadsheet.js",
    "spreadsheet/formatting.js",
    "spreadsheet/structure.js",
    "spreadsheet/find.js",
    "i18n/en.js",
    "i18n/de.js"
];

/**
 * Loads a fresh runtime with the spreadsheet.
 * @param {object} [options] - Options of loadWebUi.
 * @returns {object} The runtime.
 */
export function loadSpreadsheet(options = {}) {
    return loadWebUi({ browser: true, ...options, extraFiles: [...SPREADSHEET_FILES, ...(options.extraFiles ?? [])] });
}

/**
 * Creates a spreadsheet control on a connected host.
 * @param {object} rt - The runtime.
 * @param {object|string|null} [workbook] - The initial workbook.
 * @param {object} [attributes] - Further host attributes.
 * @returns {{host: object, ctrl: object}} The host and the control.
 */
export function createSpreadsheet(rt, workbook = null, attributes = {}) {
    const host = rt.createElement("div");
    host.classList.add("wx-webui-spreadsheet");
    if (workbook !== null && workbook !== undefined) host.setAttribute("value", typeof workbook === "string" ? workbook : JSON.stringify(workbook));
    for (const [name, value] of Object.entries(attributes)) host.setAttribute(name, value);
    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);
    return { host, ctrl: rt.wx.Controller.getInstanceByElement(host) };
}

/**
 * Builds a keyboard event aimed at an element.
 * @param {object} target - The element.
 * @param {string} key - The key.
 * @param {object} [init] - Modifiers { ctrl, shift, alt, meta }.
 * @returns {object} The event.
 */
export function keyOn(target, key, init = {}) {
    return {
        type: "keydown", key, target,
        ctrlKey: !!init.ctrl, shiftKey: !!init.shift, altKey: !!init.alt, metaKey: !!init.meta,
        isComposing: false, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        stopPropagation() { }
    };
}

/**
 * Builds a pointer event.
 * @param {object} target - The element.
 * @param {number} x - The client x.
 * @param {number} y - The client y.
 * @param {object} [init] - { type, ctrl, shift, pointerType, pointerId, button }.
 * @returns {object} The event.
 */
export function pointerOn(target, x, y, init = {}) {
    return {
        type: init.type ?? "pointerdown", target, clientX: x, clientY: y,
        ctrlKey: !!init.ctrl, shiftKey: !!init.shift, metaKey: false, altKey: false,
        pointerType: init.pointerType ?? "mouse", pointerId: init.pointerId ?? 1, button: init.button ?? 0,
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        stopPropagation() { }
    };
}

/**
 * Returns the pane coordinates of the center of a cell, which the stub's zero-sized boxes make
 * client coordinates as well.
 * @param {object} ctrl - The spreadsheet.
 * @param {number} row - The row.
 * @param {number} col - The column.
 * @returns {{x: number, y: number}} The point.
 */
export function cellPoint(ctrl, row, col) {
    const rect = ctrl._view.cellRect(row, col);
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Copies a value out of the vm realm, so deepEqual compares plain data.
 * @param {*} value - The value.
 * @returns {*} The copy.
 */
export function plain(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }

/**
 * Waits for queued microtasks and short timers.
 * @param {number} [ms=15] - The time to wait.
 * @returns {Promise<void>} Resolves afterwards.
 */
export function settle(ms = 15) { return new Promise(resolve => setTimeout(resolve, ms)); }
