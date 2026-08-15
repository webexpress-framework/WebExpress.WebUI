/**
 * Headless contract and behavior tests for the MasterDetailCtrl control
 * (wx-webui-master-detail). The shared contract (controls.contract.mjs) covers
 * registration and the construct / teardown lifecycle.
 *
 * The behavior tests below cover what the composite actually adds on top of the
 * controls it hosts: routing a selection from any of its three channels into one
 * state transition, resolving the detail uri, hiding the detail side together
 * with the splitter, the sequential mode below the breakpoint, and the listbox
 * keyboard and aria model.
 *
 * Two stubs need shaping for this control. getComputedStyle is redirected to the
 * inline style, because the split decides whether a pane still has visible
 * content by reading the computed display of its children and the default stub
 * reports "" for everything. And the container width is shadowed per element,
 * because the stub reports every layout dimension as zero, which the responsive
 * mode reads as "not laid out yet".
 */
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

const DEPS = ["webexpress.webui.split.js", "webexpress.webui.frame.js", "webexpress.webui.master.detail.js"];

const CSS_PATH = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..", "..", "WebExpress.WebUI", "Assets", "css", "webexpress.webui.master.detail.css"
);

/**
 * Returns the declarations of the rule carrying exactly the given selector list.
 * A few of the traits under test are pure layout - the pane the split hands over,
 * the gap to the splitter, the header that stays out of the scroll area - and the
 * dom stub has no cascade to ask about them, so the stylesheet is read instead.
 * @param {string} selector - The selector list as authored, whitespace-normalized.
 * @returns {string|null} The declaration block, or null when no rule matches.
 */
function cssRule(selector) {
    const css = fs.readFileSync(CSS_PATH, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

    for (const rule of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        if (rule[1].trim().replace(/\s*\n\s*/g, " ") === selector) {
            return rule[2];
        }
    }

    return null;
}

contract({
    file: "webexpress.webui.master.detail.js",
    selector: "wx-webui-master-detail",
    ctrl: "MasterDetailCtrl",
    deps: ["webexpress.webui.split.js", "webexpress.webui.frame.js"]
});

/**
 * Loads a runtime whose computed style mirrors the inline style, which is what
 * the split's content-visibility check needs to see. The frame the detail side
 * drives really fetches, so the transport is stubbed with an empty, successful
 * response; what these tests assert is the uri the composite hands over, not
 * what the frame does with it.
 * @param {object} [options] - Extra loadWebUi options.
 * @returns {object} The loaded runtime.
 */
function loadRuntime(options = {}) {
    const rt = loadWebUi({
        browser: true,
        extraFiles: DEPS,
        fetch: async () => ({ ok: true, status: 200, text: async () => "<html><body></body></html>" }),
        globals: {
            DOMParser: class {
                parseFromString() {
                    return { querySelector: () => null, body: { firstChild: null } };
                }
            },
            // the list control keys items without an id by a generated uuid
            crypto: { randomUUID: () => Math.random().toString(16).slice(2) }
        },
        ...options
    });
    rt.sandbox.window.getComputedStyle = (element) => element.style;
    return rt;
}

/**
 * Builds the markup ControlMasterDetail renders: a host carrying the marker
 * class, a split with the master in the side pane and the detail in the main
 * pane, and a placeholder plus a frame inside the detail body.
 * @param {object} rt - The loaded runtime.
 * @param {object} options - { items, width, breakpoint, detailUri, detailVisible, itemSelector }.
 * @returns {object} The controller plus element handles.
 */
function makeMasterDetail(rt, options = {}) {
    const items = options.items || [
        { id: "1", uri: "/apps/details?id=1", text: "Entry 1" },
        { id: "2", uri: "/apps/details?id=2", text: "Entry 2" },
        { id: "3", uri: "/apps/details?id=3", text: "Entry 3" }
    ];

    const host = rt.createElement("div");
    host.id = "myMasterDetail";
    host.classList.add("wx-webui-master-detail");
    if (options.breakpoint != null) { host.setAttribute("data-breakpoint", String(options.breakpoint)); }
    if (options.detailUri) { host.setAttribute("data-detail-uri", options.detailUri); }
    if (options.detailVisible === false) { host.setAttribute("data-detail-visible", "false"); }
    if (options.closable === false) { host.setAttribute("data-closable", "false"); }
    if (options.itemSelector) { host.setAttribute("data-item", options.itemSelector); }

    const split = rt.createElement("div");
    split.id = "myMasterDetail-split";
    split.classList.add("wx-webui-split");
    split.setAttribute("data-orientation", "horizontal");
    split.setAttribute("data-size", "30");
    split.setAttribute("data-unit", "%");
    // what ControlMasterDetail emits: the master carries the navigation, so it
    // has a minimum and may not be collapsed away
    split.setAttribute("data-min-side", String(options.masterMinSize == null ? 180 : options.masterMinSize));
    split.setAttribute("data-collapsible", "false");

    const sidePane = rt.createElement("div");
    sidePane.classList.add("wx-side-pane");
    const master = rt.createElement("div");
    master.id = "myMasterDetail-master";
    master.classList.add("wx-master");
    const list = rt.createElement("div");
    list.classList.add("wx-list");

    for (const item of items) {
        const element = rt.createElement("div");
        element.classList.add("wx-list-item");
        if (item.uri) { element.setAttribute("data-bind-uri", item.uri); }
        if (item.id) { element.setAttribute("data-bind-id", item.id); }
        if (item.disabled) { element.setAttribute("disabled", "disabled"); }
        element.textContent = item.text || "";
        list.appendChild(element);
    }
    master.appendChild(list);
    sidePane.appendChild(master);

    const mainPane = rt.createElement("div");
    mainPane.classList.add("wx-main-pane");
    const detail = rt.createElement("div");
    detail.id = "myMasterDetail-detail";
    detail.classList.add("wx-detail");
    const detailBody = rt.createElement("div");
    detailBody.classList.add("wx-detail-body");
    const emptyState = rt.createElement("div");
    emptyState.classList.add("wx-empty-state");
    const frame = rt.createElement("div");
    frame.id = "myMasterDetail-frame";
    frame.classList.add("wx-webui-frame");

    detailBody.appendChild(emptyState);
    detailBody.appendChild(frame);
    detail.appendChild(detailBody);
    mainPane.appendChild(detail);

    split.appendChild(sidePane);
    split.appendChild(mainPane);
    host.appendChild(split);
    rt.document.body.appendChild(host);

    // the stub reports clientWidth as 0, which the responsive mode reads as an
    // unlaid-out container; shadow it so the breakpoint decision is meaningful
    const width = options.width == null ? 1200 : options.width;
    Object.defineProperty(host, "clientWidth", { configurable: true, get: () => width });
    Object.defineProperty(split, "clientWidth", { configurable: true, get: () => width });

    rt.wx.Controller.createInstances(host);

    return {
        rt,
        host,
        master,
        list,
        detail,
        emptyState,
        frame,
        sidePane,
        mainPane,
        ctrl: rt.wx.Controller.getInstanceByElement(host),
        split: rt.wx.Controller.getInstanceByElement(split),
        items: () => Array.from(list.children),
        click: (element) => master.dispatchEvent({ type: "click", target: element }),
        key: (key, target) => master.dispatchEvent({
            type: "keydown",
            key,
            target: target || master,
            defaultPrevented: false,
            preventDefault() { this.defaultPrevented = true; }
        })
    };
}

test("a click on a master item loads its uri into the detail frame", () => {
    const md = makeMasterDetail(loadRuntime());

    const events = [];
    md.host.addEventListener(md.rt.wx.Event.SELECT_ITEM_EVENT, (e) => events.push(e.detail));

    md.click(md.items()[1]);

    assert.equal(md.ctrl.selectedId, "2", "the composite owns the selected id");
    assert.equal(md.rt.wx.Controller.getInstanceByElement(md.frame).uri, "/apps/details?id=2", "the frame loads the item uri");
    assert.equal(md.emptyState.style.display, "none", "the placeholder gives way to the content");
    assert.equal(events.length, 1, "the selection is announced once");
    assert.equal(events[0].itemId, "2");
    assert.equal(events[0].uri, "/apps/details?id=2");
});

test("an item that carries only an id resolves its uri through the template", () => {
    const md = makeMasterDetail(loadRuntime(), {
        detailUri: "/apps/details?id={id}",
        items: [{ id: "1024", text: "Entry" }]
    });

    md.click(md.items()[0]);

    assert.equal(md.ctrl.selectedId, "1024");
    assert.equal(md.rt.wx.Controller.getInstanceByElement(md.frame).uri, "/apps/details?id=1024", "the template fills in the item id");
});

test("the selected item is the only active option", () => {
    const md = makeMasterDetail(loadRuntime());

    md.click(md.items()[0]);
    md.click(md.items()[2]);

    const states = md.items().map((item) => [
        item.classList.contains("wx-md-item-active"),
        item.getAttribute("aria-selected")
    ]);

    assert.deepEqual(states, [[false, "false"], [false, "false"], [true, "true"]]);
});

test("re-selecting the same item does not refetch or re-announce, reload does", () => {
    const md = makeMasterDetail(loadRuntime());
    const frame = md.rt.wx.Controller.getInstanceByElement(md.frame);

    let loads = 0;
    frame.load = () => { loads++; };

    const events = [];
    md.host.addEventListener(md.rt.wx.Event.SELECT_ITEM_EVENT, (e) => events.push(e.detail));

    md.click(md.items()[0]);
    assert.equal(loads, 1, "the first selection loads");

    // a single click can arrive twice - through the item's own action and
    // through the delegated handler - and must still count as one selection
    md.ctrl.select({ element: md.items()[0] });
    md.click(md.items()[0]);
    assert.equal(loads, 1, "the same item is not fetched twice");
    assert.equal(events.length, 1, "and is not announced twice");

    md.ctrl.reload();
    assert.equal(loads, 2, "an explicit reload fetches again");
});

test("hiding the detail takes the splitter with it and restores the position", () => {
    const md = makeMasterDetail(loadRuntime());
    md.split._handleResize();
    const sizeBefore = md.split._sideSize;

    md.ctrl.hideDetail();

    assert.equal(md.ctrl.detailHidden, true);
    assert.equal(md.detail.style.display, "none", "the detail content is hidden");
    assert.equal(md.split._splitter.style.display, "none", "the splitter goes with it");
    assert.equal(md.sidePane.style.width, "100%", "the master takes the whole container");

    md.ctrl.showDetail();

    assert.equal(md.ctrl.detailHidden, false);
    assert.notEqual(md.split._splitter.style.display, "none", "the splitter is back");
    assert.equal(md.split._sideSize, sizeBefore, "the splitter returns to its previous position");
});

test("the built-in close button hides the detail side", () => {
    const md = makeMasterDetail(loadRuntime());

    const close = md.detail.querySelector(".wx-detail-close");
    assert.ok(close, "the detail side carries a close button of its own");
    assert.ok(close.getAttribute("aria-label"), "and it is labelled for screen readers");
    assert.equal(close.classList.contains("wx-button-close"), true, "it is the framework's close button");

    md.click(md.items()[0]);
    assert.equal(md.ctrl.detailHidden, false);

    const events = [];
    md.host.addEventListener(md.rt.wx.Event.HIDE_EVENT, (e) => events.push(e.detail));

    close.dispatchEvent({ type: "click" });

    assert.equal(md.ctrl.detailHidden, true, "the click hides the detail side");
    assert.equal(md.detail.style.display, "none");
    assert.equal(md.split._splitter.style.display, "none", "and the splitter goes with it");
    assert.equal(events.length, 1, "the hiding is announced");

    // the selection survives, so the same item brings the detail straight back
    md.click(md.items()[0]);
    assert.equal(md.ctrl.detailHidden, false, "selecting again reopens it");
});

test("both ways out sit in a header that is no part of the scrolling body", () => {
    const md = makeMasterDetail(loadRuntime());

    const header = md.detail.querySelector(".wx-detail-header");
    const body = md.detail.querySelector(".wx-detail-body");

    assert.ok(header, "the detail side carries a header bar");
    assert.equal(md.detail.firstElementChild, header, "which sits above the content rather than on top of it");
    assert.equal(md.detail.querySelector(".wx-detail-close").parentElement, header, "the close button lives in the bar");
    assert.equal(md.detail.querySelector(".wx-detail-back").parentElement, header, "and so does the back button");

    // only the body scrolls, so a bar outside it cannot travel away with the
    // content - which a button placed on the pane itself would have done
    assert.equal(body.parentElement, md.detail, "the bar and the scrolling body are siblings");
    assert.match(cssRule(".wx-master-detail .wx-detail-body"), /overflow-y:\s*auto/, "the body owns the scrolling");
    assert.doesNotMatch(cssRule(".wx-master-detail .wx-detail-header"), /position:\s*absolute/, "and the bar is laid out, not floated");

    assert.equal(md.host.classList.contains("wx-md-closable"), true, "the marker tells css the bar has content of its own");
});

test("a control that may not be closed carries no close button", () => {
    const md = makeMasterDetail(loadRuntime(), { closable: false });

    assert.equal(md.detail.querySelector(".wx-detail-close"), null, "no close button is built");
    assert.ok(md.detail.querySelector(".wx-detail-back"), "the sequential back button stays");

    // outside the sequential mode the bar would be empty, and css hides it by
    // the absent marker rather than leaving a stray line above the content
    assert.equal(md.host.classList.contains("wx-md-closable"), false, "the host is not marked closable");
    assert.match(
        cssRule(".wx-master-detail:not(.wx-md-closable):not(.wx-md-compact) .wx-detail-header"),
        /display:\s*none/,
        "and the stylesheet acts on it");

    // hiding through the api and the toggle action remains possible
    md.ctrl.toggleDetail();
    assert.equal(md.ctrl.detailHidden, true);
});

test("the gap to the splitter is the body's alone, not the header's", () => {
    assert.match(
        cssRule(".wx-master-detail .wx-detail-body"),
        /padding-left:\s*var\(--wx-master-detail-gap/,
        "the two-column layout offsets the detail content from the drag handle");

    // the header is a bar and has to run edge to edge, so the gap must not sit
    // on the column that holds both
    assert.doesNotMatch(cssRule(".wx-master-detail .wx-detail"), /padding/, "the column itself carries no inset");
    assert.doesNotMatch(cssRule(".wx-master-detail .wx-detail-header"), /padding-left:\s*var\(--wx-master-detail-gap/, "and neither does the bar");

    // the sequential mode has no splitter at all: the detail is an overlay over
    // the whole container and an inset would only cut its width
    assert.match(
        cssRule(".wx-master-detail.wx-md-compact .wx-detail-body"),
        /padding-left:\s*0/,
        "the sequential overlay takes the full width");
});

test("arriving detail content is animated in, and the animation is replayed on every swap", () => {
    const md = makeMasterDetail(loadRuntime());
    const arrived = (uri) => md.frame.dispatchEvent({
        type: md.rt.wx.Event.DATA_ARRIVED_EVENT,
        detail: { sender: md.frame, uri: uri }
    });

    md.click(md.items()[0]);
    arrived("/apps/details?id=1");
    assert.equal(md.frame.classList.contains("wx-detail-swap"), true, "the new content enters with the animation");

    // the class is dropped once the animation finished, so the next swap can
    // restart it instead of the browser ignoring an already-present class
    md.frame.dispatchEvent({ type: "animationend" });
    assert.equal(md.frame.classList.contains("wx-detail-swap"), false, "and is cleaned up afterwards");

    md.click(md.items()[1]);
    arrived("/apps/details?id=2");
    assert.equal(md.frame.classList.contains("wx-detail-swap"), true, "the next swap animates again");
});

test("a frame nested inside the detail content does not animate the detail", () => {
    const md = makeMasterDetail(loadRuntime());

    // the loaded detail page may embed frames of its own; their arrivals are not
    // swaps of the detail and must leave it alone
    const nested = md.rt.createElement("div");
    md.frame.dispatchEvent({
        type: md.rt.wx.Event.DATA_ARRIVED_EVENT,
        detail: { sender: nested, uri: "/somewhere/else" }
    });

    assert.equal(md.frame.classList.contains("wx-detail-swap"), false, "the foreign arrival is ignored");
});

test("the detail fills the pane: the split's own scroller is taken back", () => {
    const md = makeMasterDetail(loadRuntime());

    // the split turns its main pane into a scroll container by writing an inline
    // overflow, whose scrollbar gutter would sit between the pane edge and the
    // detail. the master-detail scrolls its own body, so the stylesheet has to
    // take that scroller back - and only !important outranks an inline style.
    assert.equal(md.mainPane.style.overflow, "auto", "the split still writes the inline overflow");

    const rule = cssRule(".wx-master-detail .wx-side-pane, .wx-master-detail .wx-main-pane");

    assert.ok(rule, "the stylesheet counters it for both panes");
    assert.match(rule, /overflow:\s*hidden\s*!important/, "and does so with a declaration that beats the inline style");
});

test("the master side cannot be dragged out of sight", () => {
    const md = makeMasterDetail(loadRuntime());

    // drag the splitter to the very edge, far past the minimum
    md.split._dragging = true;
    md.split._element.getBoundingClientRect = () => ({ left: 0, top: 0, right: 1200, bottom: 600, width: 1200, height: 600 });
    md.split._onDragMove({ clientX: 2, clientY: 300 }, null, 0);

    assert.equal(md.split._sidePaneCollapsed, false, "the master does not collapse");
    assert.equal(md.split._sideSize, 180, "it stops at the minimum width");
    assert.notEqual(md.sidePane.style.display, "none", "and stays visible");

    // a double click on the splitter must not take it away either
    md.split.collapseSidePane();
    assert.equal(md.split._sidePaneCollapsed, false, "collapsing is refused outright");
});

test("selecting an item brings a hidden detail side back", () => {
    const md = makeMasterDetail(loadRuntime(), { detailVisible: false });

    assert.equal(md.ctrl.detailHidden, true, "the configured start state is respected");
    assert.equal(md.detail.style.display, "none");

    md.click(md.items()[0]);

    assert.equal(md.ctrl.detailHidden, false, "a selection reveals the detail again");
    assert.notEqual(md.detail.style.display, "none");
    assert.equal(md.rt.wx.Controller.getInstanceByElement(md.frame).uri, "/apps/details?id=1");
});

test("clearing the selection returns the detail side to its placeholder", () => {
    const md = makeMasterDetail(loadRuntime());

    md.click(md.items()[0]);
    md.ctrl.clearSelection();

    assert.equal(md.ctrl.selectedId, null);
    assert.equal(md.emptyState.style.display, "", "the placeholder is shown again");
    assert.equal(md.frame.style.display, "none", "the stale content is hidden");
    assert.deepEqual(md.items().map((i) => i.getAttribute("aria-selected")), ["false", "false", "false"]);
});

test("below the breakpoint the control starts on the list and slides the detail in", () => {
    const md = makeMasterDetail(loadRuntime(), { width: 480, breakpoint: 768 });

    assert.equal(md.ctrl.compact, true, "the measured container width decides the mode");
    assert.equal(md.host.classList.contains("wx-md-compact"), true);
    assert.equal(md.ctrl.detailHidden, true, "the list is the first screen");
    assert.equal(md.host.classList.contains("wx-md-detail-open"), false);

    // the detail stays displayed in the sequential mode; the open class, not the
    // display, decides whether the overlay is on screen
    assert.equal(md.detail.style.display, "");

    md.click(md.items()[0]);

    assert.equal(md.host.classList.contains("wx-md-detail-open"), true, "the selection opens the overlay");

    md.ctrl.hideDetail();

    assert.equal(md.host.classList.contains("wx-md-detail-open"), false, "the back button closes it again");
});

test("above the breakpoint both columns stay visible", () => {
    const md = makeMasterDetail(loadRuntime(), { width: 1200, breakpoint: 768 });

    assert.equal(md.ctrl.compact, false);
    assert.equal(md.host.classList.contains("wx-md-compact"), false);
    assert.equal(md.ctrl.detailHidden, false);
});

test("crossing the breakpoint announces the mode change", () => {
    let width = 1200;
    const rt = loadRuntime();
    const md = makeMasterDetail(rt, { breakpoint: 768 });
    Object.defineProperty(md.host, "clientWidth", { configurable: true, get: () => width });

    const events = [];
    md.host.addEventListener(rt.wx.Event.BREAKPOINT_CHANGE_EVENT, (e) => events.push(e.detail));

    // the ResizeObserver stub never fires; drive the same path by hand
    width = 400;
    md.ctrl._updateBreakpoint(false);

    assert.equal(events.length, 1);
    assert.equal(events[0].compact, true);
    assert.equal(md.ctrl.compact, true);
});

test("the arrow keys move the tab stop and Enter selects", () => {
    const md = makeMasterDetail(loadRuntime());

    md.key("ArrowDown");
    assert.equal(md.items()[0].getAttribute("tabindex"), "0", "the first item takes the focus");

    md.key("ArrowDown", md.items()[0]);
    assert.equal(md.items()[1].getAttribute("tabindex"), "0", "the focus moves on");
    assert.equal(md.items()[0].getAttribute("tabindex"), "-1", "and only one item stays reachable");

    md.key("Enter", md.items()[1]);
    assert.equal(md.ctrl.selectedId, "2", "Enter activates the focused item");

    md.key("End", md.items()[1]);
    assert.equal(md.items()[2].getAttribute("tabindex"), "0", "End jumps to the last item");
});

test("a key another control already handled is left alone", () => {
    const md = makeMasterDetail(loadRuntime());

    // a self-navigating master (a table, for example) calls preventDefault on
    // the arrow keys it consumed; handling it again would move twice
    md.master.dispatchEvent({
        type: "keydown",
        key: "ArrowDown",
        target: md.items()[0],
        defaultPrevented: true,
        preventDefault() { }
    });

    assert.deepEqual(md.items().map((i) => i.getAttribute("tabindex")), ["0", "-1", "-1"], "nothing moved");
});

test("the listbox roles are applied to the item owner and its items", () => {
    const md = makeMasterDetail(loadRuntime());

    assert.equal(md.list.getAttribute("role"), "listbox", "the element that owns the items is the listbox");
    assert.equal(md.list.getAttribute("aria-controls"), "myMasterDetail-detail", "it points at the detail region");

    for (const item of md.items()) {
        assert.equal(item.getAttribute("role"), "option");
        assert.equal(item.getAttribute("aria-controls"), "myMasterDetail-detail");
    }
});

test("a selection the master control makes on its own is adopted", () => {
    const md = makeMasterDetail(loadRuntime());

    // the list control announces its own selection - an auto-selected first row,
    // its keyboard handling or a programmatic call - and the composite follows
    md.master.dispatchEvent({
        type: md.rt.wx.Event.SELECT_ITEM_EVENT,
        detail: { sender: md.list, itemId: "3", originalEvent: null }
    });

    assert.equal(md.ctrl.selectedId, "3");
    assert.equal(md.rt.wx.Controller.getInstanceByElement(md.frame).uri, "/apps/details?id=3", "the uri is resolved from the item element");
});

test("a selection made before the composite initialized is adopted without revealing a hidden detail", () => {
    const rt = loadRuntime();
    const md = makeMasterDetail(rt, { detailVisible: false });

    // rebuild with a pre-activated item, as a selectable list leaves behind when
    // it auto-selects its first row before the composite is constructed
    const host = rt.createElement("div");
    host.id = "second";
    host.classList.add("wx-webui-master-detail");
    host.setAttribute("data-detail-visible", "false");
    const master = rt.createElement("div");
    master.classList.add("wx-master");
    const item = rt.createElement("div");
    item.classList.add("wx-list-item");
    item.classList.add("active");
    item.setAttribute("data-bind-id", "42");
    item.setAttribute("data-bind-uri", "/apps/details?id=42");
    master.appendChild(item);
    const detail = rt.createElement("div");
    detail.id = "second-detail";
    detail.classList.add("wx-detail");
    host.appendChild(master);
    host.appendChild(detail);
    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);

    const ctrl = rt.wx.Controller.getInstanceByElement(host);
    assert.equal(ctrl.selectedId, "42", "the pre-activated item becomes the selection");
    assert.equal(ctrl.detailHidden, true, "an adopted selection does not override the configured visibility");
    assert.ok(md.ctrl, "the first control is unaffected");
});

test("a disabled item is neither selectable nor reachable with the keyboard", () => {
    const md = makeMasterDetail(loadRuntime(), {
        items: [
            { id: "1", uri: "/a", text: "One" },
            { id: "2", uri: "/b", text: "Two", disabled: true }
        ]
    });

    md.click(md.items()[1]);
    assert.equal(md.ctrl.selectedId, null, "the click is ignored");

    md.key("ArrowDown", md.items()[0]);
    assert.equal(md.items()[0].getAttribute("tabindex"), "0", "the focus stays on the enabled item");
});

test("the master-detail actions route a selection and toggle the detail", () => {
    const rt = loadRuntime({ extraFiles: [...DEPS, "action/default.js"] });

    const select = rt.wx.Actions.get("master-detail");
    const toggle = rt.wx.Actions.get("master-detail-toggle");
    assert.ok(select && toggle, "both actions are registered");

    const calls = [];
    const target = {
        select: (selection) => calls.push(selection),
        toggleDetail: () => calls.push("toggle")
    };
    const controller = { getInstance: (selector) => (selector === "#md" ? target : null) };

    const element = rt.createElement("div");
    element.setAttribute("data-wx-primary-target", "#md");
    element.setAttribute("data-wx-primary-uri", "/apps/details?id=7");
    element.setAttribute("data-wx-primary-item", "7");

    select.execute(element, "primary", controller, null);
    toggle.execute(element, "primary", controller, null);

    assert.equal(calls[0].id, "7");
    assert.equal(calls[0].uri, "/apps/details?id=7");
    assert.equal(calls[1], "toggle");
});

test("a real selectable list drives the detail side through its own auto-selection", () => {
    const rt = loadRuntime({ extraFiles: [...DEPS, "webexpress.webui.list.js", "action/default.js"] });

    const host = rt.createElement("div");
    host.id = "listMasterDetail";
    host.classList.add("wx-webui-master-detail");

    const master = rt.createElement("div");
    master.classList.add("wx-master");

    const list = rt.createElement("div");
    list.classList.add("wx-webui-list");
    list.setAttribute("data-selectable", "true");
    list.dataset.selectable = "true";

    for (const id of ["a", "b"]) {
        const item = rt.createElement("div");
        item.classList.add("wx-list-item");
        // the list reads its configuration through the dataset api while the
        // composite reads attributes; the stub keeps the two apart, so the test
        // writes both where a browser would keep them in sync
        item.dataset.wxPrimaryAction = "master-detail";
        item.dataset.wxPrimaryTarget = "#listMasterDetail";
        item.dataset.wxPrimaryUri = `/apps/details?id=${id}`;
        item.dataset.wxPrimaryItem = id;
        list.appendChild(item);
    }

    master.appendChild(list);

    const detail = rt.createElement("div");
    detail.id = "listMasterDetail-detail";
    detail.classList.add("wx-detail");
    const detailBody = rt.createElement("div");
    detailBody.classList.add("wx-detail-body");
    const frame = rt.createElement("div");
    frame.classList.add("wx-webui-frame");
    detailBody.appendChild(frame);
    detail.appendChild(detailBody);

    host.appendChild(master);
    host.appendChild(detail);
    rt.document.body.appendChild(host);

    rt.wx.Controller.createInstances(host);

    // the list auto-selects its first row before the composite exists, so the
    // action it triggers finds no target; the composite adopts the marked row
    const ctrl = rt.wx.Controller.getInstanceByElement(host);
    assert.equal(ctrl.selectedId, "a", "the row the list activated becomes the selection");
    assert.equal(rt.wx.Controller.getInstanceByElement(frame).uri, "/apps/details?id=a", "and its uri reaches the frame");

    // and a later click on the second row routes through the action registry
    const rows = list.querySelectorAll(".wx-list-item");
    rt.wx.Actions.get("master-detail").execute(rows[1], "primary", rt.wx.Controller, null);

    assert.equal(ctrl.selectedId, "b");
    assert.equal(rt.wx.Controller.getInstanceByElement(frame).uri, "/apps/details?id=b");
});

test("re-rendered master items are re-bound to the current selection", () => {
    const md = makeMasterDetail(loadRuntime());

    md.click(md.items()[1]);
    assert.equal(md.ctrl.selectedId, "2");

    // a list control rebuilds its items on every render, which replaces the
    // elements the composite was holding on to
    const rebuilt = md.rt.createElement("div");
    rebuilt.classList.add("wx-list-item");
    rebuilt.setAttribute("data-bind-id", "2");
    rebuilt.setAttribute("data-bind-uri", "/apps/details?id=2");
    md.list.replaceChildren(rebuilt);

    md.ctrl.refresh();

    assert.equal(rebuilt.classList.contains("wx-md-item-active"), true, "the highlight follows the new element");
    assert.equal(rebuilt.getAttribute("aria-selected"), "true");
});
