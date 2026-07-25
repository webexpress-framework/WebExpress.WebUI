/**
 * Headless contract test for the SplitCtrl control (wx-webui-split).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * The behavior tests below cover the pane-sizing logic that the contract does
 * not exercise: surviving construction inside a zero-width (hidden) container
 * and fitting the side pane to its content. Because the headless DOM stub
 * reports every layout dimension as zero, the tests shadow clientWidth /
 * scrollWidth per element to simulate a real layout, and drive the resize path
 * by hand since the ResizeObserver stub never fires on its own.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.split.js",
    selector: "wx-webui-split",
    ctrl: "SplitCtrl"
});

/**
 * Builds a horizontal split (side + main) whose laid-out width can be toggled,
 * so a test can simulate a split that is first rendered inside a hidden
 * (zero-width) tab and later shown. The container starts at the given width
 * (0 = hidden); call show(width) to reveal it.
 * @param {object} rt - The loaded runtime.
 * @param {object} options - { size, minSide, collapseTo, unit, width }.
 * @returns {object} The controller plus element handles and a show() helper.
 */
function makeSplit(rt, { size, minSide, collapseTo, unit, width = 0 } = {}) {
    const el = rt.createElement("div");
    el.classList.add("wx-webui-split");
    el.setAttribute("data-orientation", "horizontal");
    if (size != null) { el.setAttribute("data-size", String(size)); }
    if (minSide != null) { el.setAttribute("data-min-side", String(minSide)); }
    if (collapseTo != null) { el.setAttribute("data-collapse-to", String(collapseTo)); }
    if (unit != null) { el.setAttribute("data-unit", String(unit)); }

    const side = rt.createElement("div");
    side.classList.add("wx-side-pane");
    side.appendChild(rt.createElement("div"));

    const main = rt.createElement("div");
    main.classList.add("wx-main-pane");
    main.appendChild(rt.createElement("div"));

    el.appendChild(side);
    el.appendChild(main);
    rt.document.body.appendChild(el);

    // the stub reports clientWidth as 0; shadow it so the split sees a real
    // (or intentionally absent) layout width
    let laidOutWidth = width;
    Object.defineProperty(el, "clientWidth", { configurable: true, get: () => laidOutWidth });

    const ctrl = new rt.wx.SplitCtrl(el);
    return { ctrl, el, side, main, show: (w) => { laidOutWidth = w; } };
}

test("split rendered while hidden keeps its desired side size and applies it once shown", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { size: 250, minSide: 150, width: 0 });

    // constructed while the container has no layout (hidden tab): the requested
    // size must survive instead of being clamped to zero
    assert.equal(s.ctrl._sideSize, 250, "desired side size is preserved while hidden");

    // the tab becomes visible; the ResizeObserver would fire _handleResize
    s.show(600);
    s.ctrl._handleResize();

    assert.equal(s.ctrl._sideSize, 250, "side size is restored on the first real resize");
    assert.equal(s.side.style.width, "250px", "side pane is laid out at the desired width, not collapsed");
});

test("fitSidePaneToContent sizes the side pane to its content, clamped to min-side", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { size: 280, minSide: 180, width: 600 });

    // the preferred content width is read from the side pane's offset width
    // (measured at width:max-content)
    let contentWidth = 320;
    Object.defineProperty(s.side, "offsetWidth", { configurable: true, get: () => contentWidth });

    s.ctrl.fitSidePaneToContent();
    assert.equal(s.ctrl._sideSize, 320, "fits to the content width when it exceeds the minimum");

    contentWidth = 90;
    s.ctrl.fitSidePaneToContent();
    assert.equal(s.ctrl._sideSize, 180, "clamps up to the configured min-side for narrow content");
});

test("fitSidePaneToContent is a no-op when the content has no measurable extent", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { size: 200, minSide: 150, width: 0 });

    // side pane scrollWidth stays 0 (hidden); fitting must not overwrite the size
    s.ctrl.fitSidePaneToContent();
    assert.equal(s.ctrl._sideSize, 200, "the desired size is left untouched");
});

test("percent side size via the separate data-unit tracks a ratio of the container", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    // C# emits SidePanelInitialSize + Unit=Percent as data-size="10" data-unit="%"
    const s = makeSplit(rt, { size: 10, unit: "%", width: 800 });

    assert.equal(s.ctrl._sideRatioMode, true, "a percent unit enables ratio mode");
    assert.equal(s.ctrl._sideSize, 80, "10% resolves to 80 of an 800px container");

    // the ratio, not a fixed pixel value, is what survives a resize
    s.show(1200);
    s.ctrl._handleResize();
    assert.equal(s.ctrl._sideSize, 120, "stays at 10% (120) after the container grows");
});

test("percent side size given inline on data-size still works", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { size: "25%", width: 800 });

    assert.equal(s.ctrl._sideRatioMode, true, "an inline percent enables ratio mode");
    assert.equal(s.ctrl._sideSize, 200, "25% resolves to 200 of an 800px container");
});

test("em side size via data-unit resolves to a fixed pixel extent, not a ratio", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { size: 10, unit: "em", width: 800 });

    assert.equal(s.ctrl._sideRatioMode, false, "em is a fixed unit");
    assert.equal(s.ctrl._sideSize, 160, "10em resolves to 160px");
});

test("the split-fit action fits the side pane of its target split", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js", "action/default.js"] });

    const action = rt.wx.Actions.get("split-fit");
    assert.ok(action, "the split-fit action is registered");

    // a button carrying data-wx-primary-target resolves the split through the
    // controller and calls fitSidePaneToContent on it
    let fitted = 0;
    const target = { fitSidePaneToContent() { fitted++; } };
    const controller = { getInstance: (sel) => (sel === "#mySplitFit" ? target : null) };
    const button = rt.createElement("div");
    button.setAttribute("data-wx-primary-target", "#mySplitFit");

    action.execute(button, "primary", controller, { preventDefault() { } });
    assert.equal(fitted, 1, "fitSidePaneToContent is invoked on the resolved target");
});


test("collapsing hides the side pane and the splitter with it", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    // a drag minimum is not a collapse target: a pane with a sensible minimum
    // has to remain fully hideable
    const s = makeSplit(rt, { size: 300, minSide: 260, width: 800 });

    s.ctrl.collapseSidePane();

    assert.equal(s.ctrl._sidePaneCollapsed, true, "the pane is collapsed");
    assert.equal(s.side.style.display, "none", "nothing of the side pane is left");
    assert.equal(s.ctrl._splitter.style.display, "none", "the divider goes with it");

    s.ctrl.expandSidePane();

    assert.equal(s.ctrl._sidePaneCollapsed, false, "the pane comes back");
    assert.notEqual(s.side.style.display, "none", "the side pane is visible again");
    assert.notEqual(s.ctrl._splitter.style.display, "none", "the divider is visible again");
});

test("a collapse target leaves the configured rail behind", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { size: 300, minSide: 260, collapseTo: 48, width: 800 });

    s.ctrl.collapseSidePane();

    assert.equal(s.side.style.width, "48px", "the rail keeps its configured width");
    assert.notEqual(s.side.style.display, "none", "the rail stays visible");
    assert.notEqual(s.ctrl._splitter.style.display, "none", "the divider stays grabbable");
});
