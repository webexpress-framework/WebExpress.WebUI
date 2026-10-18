/**
 * Headless contract test for the TabCtrl control (wx-webui-tab).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle. The
 * focused tests below cover the optional badge of a tab header.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.tab.js",
    selector: "wx-webui-tab",
    ctrl: "TabCtrl"
});

/**
 * Builds a .wx-tab-view element carrying the given data attributes.
 * @param {object} rt - The loaded runtime.
 * @param {string} id - The tab id.
 * @param {object} data - The dataset entries (label, badge, ...).
 * @returns {object} The view element.
 */
function tabView(rt, id, data = {}) {
    const view = rt.document.createElement("div");
    view.id = id;
    view.classList.add("wx-tab-view");
    for (const [key, value] of Object.entries(data)) {
        view.dataset[key] = value;
    }
    return view;
}

test("wx-webui-tab renders the badge of a tab header", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tab.js"] });
    const host = rt.document.createElement("div");
    host.appendChild(tabView(rt, "tab-inbox", { label: "Inbox", badge: "12", badgeColor: "text-bg-danger" }));
    host.appendChild(tabView(rt, "tab-plain", { label: "Plain" }));
    rt.document.body.appendChild(host);

    new rt.wx.TabCtrl(host);

    const badges = host.querySelectorAll(".wx-tab-badge");
    assert.equal(badges.length, 1, "only the badged tab carries a badge");
    assert.equal(badges[0].textContent, "12", "the badge carries the count");
    assert.ok(badges[0].classList.contains("text-bg-danger"), "the system color lands as a css class");

    const links = host.querySelectorAll(".nav-link");
    const inbox = links.find((l) => l.dataset.tabId === "tab-inbox");
    assert.ok(inbox.querySelector(".wx-tab-badge"), "the badge sits inside the tab header");
});

test("wx-webui-tab applies a user-defined badge color as an inline style", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tab.js"] });
    const host = rt.document.createElement("div");
    host.appendChild(tabView(rt, "tab-styled", { label: "Styled", badge: "7", badgeStyle: "background:#7c3aed;" }));
    rt.document.body.appendChild(host);

    new rt.wx.TabCtrl(host);

    const badge = host.querySelector(".wx-tab-badge");
    assert.ok(badge, "the tab carries a badge");
    assert.ok((badge.style.cssText || "").includes("#7c3aed"), "the user color lands as an inline style");
});

test("wx-webui-tab relabels a tab in place, ahead of its badge", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tab.js"] });
    const host = rt.document.createElement("div");
    host.appendChild(tabView(rt, "tab-inbox", { label: "Inbox", badge: "12" }));
    host.appendChild(tabView(rt, "tab-blank", { badge: "1" }));
    rt.document.body.appendChild(host);

    const ctrl = new rt.wx.TabCtrl(host);
    const link = (id) => host.querySelectorAll(".nav-link").find((l) => l.dataset.tabId === id);
    const text = (id) => link(id).childNodes.filter((n) => n.nodeType === 3).map((n) => n.textContent);

    assert.equal(ctrl.setTabLabel("tab-inbox", "Mail"), true);
    ctrl.store.flush();
    assert.deepEqual(text("tab-inbox"), ["Mail"], "the label is replaced, not added");
    assert.equal(ctrl._tabs[0].label, "Mail", "the model follows");

    assert.equal(ctrl.setTabLabel("tab-blank", "Named"), true);
    ctrl.store.flush();
    assert.deepEqual(text("tab-blank"), ["Named"], "a tab without a label gets one");
    assert.equal(link("tab-blank").childNodes.at(-1).classList.contains("wx-tab-badge"), true, "the badge stays last");

    assert.equal(ctrl.setTabLabel("unknown", "X"), false);
});

test("wx-webui-tab describes its view without touching the DOM", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tab.js"] });
    const host = rt.document.createElement("div");
    host.appendChild(tabView(rt, "tab-one", { label: "One" }));
    rt.document.body.appendChild(host);

    const ctrl = new rt.wx.TabCtrl(host);
    const before = host.childNodes.slice();
    const tree = ctrl.render(Object.assign({}, ctrl.state, { tabs: [] }));

    assert.equal(host.childNodes.length, before.length);
    assert.ok(host.childNodes.every((node, i) => node === before[i]));
    assert.deepEqual(Array.from(tree, (node) => node.key), ["header", "content"]);
});

test("wx-webui-tab switches by patching: headers and panes keep their nodes, the authored pane its classes", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tab.js"] });
    const host = rt.document.createElement("div");
    const first = tabView(rt, "tab-one", { label: "One" });
    const second = tabView(rt, "tab-two", { label: "Two" });
    second.classList.add("wide");
    second.appendChild(rt.document.createElement("p"));
    host.appendChild(first);
    host.appendChild(second);
    rt.document.body.appendChild(host);

    const ctrl = new rt.wx.TabCtrl(host);
    const link = (id) => host.querySelectorAll(".nav-link").find((l) => l.dataset.tabId === id);
    const header = link("tab-two").parentNode;
    // a listener of the selection may measure the pane, so it is shown by then
    const seen = [];
    host.addEventListener(rt.wx.Event.SELECTED_TAB_EVENT, () => seen.push(second.classList.contains("active")));

    link("tab-two").dispatchEvent({ type: "click", preventDefault() { } });

    assert.deepEqual(seen, [true], "the selection is rendered before it is announced");
    assert.equal(link("tab-two").parentNode, header, "the header node survives");
    assert.equal(link("tab-two").getAttribute("aria-selected"), "true");
    assert.equal(link("tab-two").getAttribute("tabindex"), "0");
    assert.equal(link("tab-one").getAttribute("tabindex"), "-1");
    assert.equal(second.parentNode.classList.contains("wx-tab-content"), true, "the authored pane is placed, not copied");
    assert.equal(second.childNodes.length, 1, "with its content");
    assert.deepEqual(second.className.split(" ").sort(), ["active", "fade", "show", "tab-pane", "wide"]);
    assert.equal(first.classList.contains("active"), false);
});

test("wx-webui-tab places the authored toolbar beside the tab list", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.overflow.js", "webexpress.webui.toolbar.js", "webexpress.webui.tab.js"] });
    const host = rt.document.createElement("div");
    host.appendChild(tabView(rt, "tab-one", { label: "One" }));
    const toolbar = rt.document.createElement("div");
    toolbar.className = "wx-tab-toolbar";
    host.appendChild(toolbar);
    rt.document.body.appendChild(host);

    const ctrl = new rt.wx.TabCtrl(host);
    ctrl.setTabLabel("tab-one", "Renamed");
    ctrl.store.flush();

    assert.ok(ctrl.toolbar, "the toolbar has its controller");
    assert.equal(toolbar.parentNode.parentNode, ctrl._toolsElement, "it sits among the tools");
    assert.equal(ctrl._navElement.contains(toolbar), false, "a tab list holds nothing but tabs");
});
