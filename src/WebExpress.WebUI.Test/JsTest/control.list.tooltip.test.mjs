/**
 * Headless render tests for the per-row title and tooltip of the list control.
 * ControlListItemLink emits both as data attributes, so the controller has to
 * carry them onto the rendered action element; a row that drops them looks
 * correct in the markup but silently loses the hover text.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, webuiAsset } from "./harness.mjs";

/**
 * Builds a list host carrying a single row and constructs the control on it.
 * @param {string} rowClass - The marker class of the row (link, button or plain item).
 * @param {object} rowData - The data attributes emitted for the row.
 * @param {object} [hostData] - Extra data attributes for the list root.
 * @returns {{ctrl: object, host: object}} The control and its host.
 */
function build(rowClass, rowData, hostData = {}) {
    const runtime = loadWebUi({ browser: true, extraFiles: [webuiAsset("webexpress.webui.list.js")] });
    const host = runtime.document.createElement("div");
    Object.assign(host.dataset, hostData);
    const row = runtime.document.createElement("div");
    // a keyed row keeps the change tracker off crypto.randomUUID, which the stub lacks
    row.id = "row-1";
    row.className = rowClass;
    Object.assign(row.dataset, rowData);
    row.textContent = "Maintenance Window";
    host.appendChild(row);
    runtime.document.body.appendChild(host);
    return { ctrl: new runtime.wx.ListCtrl(host), host };
}

test("a link row hands its title to the anchor as hover text", () => {
    const { host } = build("wx-list-item-link", { title: "Maintenance Window", uri: "/a" });

    const anchor = host.querySelector(".wx-list-item-link-el");
    assert.equal(anchor.getAttribute("title"), "Maintenance Window", "the title reaches the anchor");
});

test("a link row falls back to the tooltip when no title is set", () => {
    const { host } = build("wx-list-item-link", { tooltip: "SD-45000", uri: "/a" });

    const anchor = host.querySelector(".wx-list-item-link-el");
    assert.equal(anchor.getAttribute("title"), "SD-45000", "the tooltip stands in for the missing title");
});

test("the title wins over the tooltip, as it does on ControlLink", () => {
    const { host } = build("wx-list-item-link", { title: "Maintenance Window", tooltip: "SD-45000", uri: "/a" });

    const anchor = host.querySelector(".wx-list-item-link-el");
    assert.equal(anchor.getAttribute("title"), "Maintenance Window", "the more specific title is kept");
});

test("a row without title or tooltip stays free of an empty hover text", () => {
    const { host } = build("wx-list-item-link", { uri: "/a" });

    const anchor = host.querySelector(".wx-list-item-link-el");
    assert.equal(anchor.getAttribute("title"), null, "no title attribute is emitted");
});

test("a plain row carries its hover text on the list entry itself", () => {
    const { host } = build("wx-list-item", { tooltip: "SD-45000" });

    const li = host.querySelector("li");
    assert.equal(li.getAttribute("title"), "SD-45000", "the entry carries the hover text");
});

test("the list header title is not mistaken for a row title", () => {
    const { host } = build("wx-list-item-link", { uri: "/a" }, { title: "Incidents" });

    assert.equal(
        host.querySelector(".wx-list-header-title").textContent,
        "Incidents",
        "the root title still builds the header"
    );
    assert.equal(
        host.querySelector(".wx-list-item-link-el").getAttribute("title"),
        null,
        "the header title does not leak onto the row"
    );
});
