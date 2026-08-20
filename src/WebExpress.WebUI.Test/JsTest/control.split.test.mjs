/**
 * Headless contract test for the SplitCtrl control (wx-webui-split).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * The behavior tests below cover the pane-sizing logic that the contract does
 * not exercise: surviving construction inside a zero-width (hidden) container,
 * fitting the side pane to its content, and following a stylesheet that stacks
 * the split at a breakpoint. Because the headless DOM stub reports every layout
 * dimension as zero and answers every computed style with "", the tests shadow
 * clientWidth / clientHeight / scrollWidth per element and getComputedStyle per
 * runtime to simulate a real layout, and drive the resize path by hand since
 * the ResizeObserver stub never fires on its own.
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
 * @param {object} options - { size, minSide, collapseTo, collapsible, unit, width, height, id }.
 * @returns {object} The controller plus element handles, a show() helper and a
 * stack() helper that answers the container's computed flex-direction.
 */
function makeSplit(rt, { size, minSide, collapseTo, collapsible, unit, width = 0, height = 0, id } = {}) {
    const el = rt.createElement("div");
    el.classList.add("wx-webui-split");
    if (id) { el.id = id; }
    el.setAttribute("data-orientation", "horizontal");
    if (size != null) { el.setAttribute("data-size", String(size)); }
    if (minSide != null) { el.setAttribute("data-min-side", String(minSide)); }
    if (collapseTo != null) { el.setAttribute("data-collapse-to", String(collapseTo)); }
    if (collapsible === false) { el.setAttribute("data-collapsible", "false"); }
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
    Object.defineProperty(el, "clientHeight", { configurable: true, get: () => height });

    const ctrl = new rt.wx.SplitCtrl(el);

    // the split reads the axis off the container's computed flex-direction; the
    // stub answers every property with "", so a test that wants the stacked
    // layout has to say so explicitly
    const stack = (stacked) => {
        rt.sandbox.window.getComputedStyle = (node) => new Proxy({}, {
            get: (_, property) => (node === el && property === "flexDirection")
                ? (stacked ? "column" : "row")
                : "",
            has: () => true
        });
    };

    return { ctrl, el, side, main, stack, show: (w) => { laidOutWidth = w; } };
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


test("collapsing hides the side pane but keeps the splitter as the way back", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    // a drag minimum is not a collapse target: a pane with a sensible minimum
    // has to remain fully hideable
    const s = makeSplit(rt, { size: 300, minSide: 260, width: 800 });

    s.ctrl.collapseSidePane();

    assert.equal(s.ctrl._sidePaneCollapsed, true, "the pane is collapsed");
    assert.equal(s.side.style.display, "none", "nothing of the side pane is left");
    // the splitter is the only handle a fully hidden pane leaves behind - a
    // toggle button hosted inside the pane goes down with it, so a splitter
    // that vanished too would strand the user
    assert.notEqual(s.ctrl._splitter.style.display, "none", "the divider stays grabbable");

    s.ctrl.expandSidePane();

    assert.equal(s.ctrl._sidePaneCollapsed, false, "the pane comes back");
    assert.notEqual(s.side.style.display, "none", "the side pane is visible again");
    assert.notEqual(s.ctrl._splitter.style.display, "none", "the divider is visible again");
});

test("a non-collapsible side pane stops at its minimum instead of vanishing", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { size: 300, minSide: 180, collapsible: false, width: 800 });

    // dragging past the minimum, far enough that a collapsible pane would close
    s.ctrl._dragging = true;
    s.el.getBoundingClientRect = () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 });
    s.ctrl._onDragMove({ clientX: 5, clientY: 300 }, null, 0);

    assert.equal(s.ctrl._sidePaneCollapsed, false, "the pane does not collapse");
    assert.equal(s.ctrl._sideSize, 180, "it stops at the configured minimum");
    assert.notEqual(s.side.style.display, "none", "and stays on screen");

    // neither the api nor the splitter double click may take it away
    s.ctrl.collapseSidePane();
    assert.equal(s.ctrl._sidePaneCollapsed, false, "collapsing is refused outright");
    assert.notEqual(s.side.style.display, "none");
});

test("a collapse target leaves the configured rail behind", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { size: 300, minSide: 260, collapseTo: 48, width: 800 });

    s.ctrl.collapseSidePane();

    assert.equal(s.side.style.width, "48px", "the rail keeps its configured width");
    assert.notEqual(s.side.style.display, "none", "the rail stays visible");
    assert.notEqual(s.ctrl._splitter.style.display, "none", "the divider stays grabbable");
});

test("a drag that ends in a collapse restores the width the pane had before the drag", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { size: 300, minSide: 260, collapseTo: 48, width: 800 });

    // the stub reports every extent as zero, so the pane's laid-out width is
    // derived from what the control wrote to it
    Object.defineProperty(s.side, "offsetWidth", {
        configurable: true,
        get: () => parseInt(s.side.style.width, 10) || 0
    });
    s.el.getBoundingClientRect = () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 });

    s.ctrl._onDragStart({ button: 0, clientX: 300, clientY: 300, preventDefault() { } });

    // the drag pushes the pane down to its minimum before it crosses the
    // collapse threshold, so by the time the collapse runs the current width is
    // already the shrunken one
    s.ctrl._onDragMove({ clientX: 265, clientY: 300 }, null, 0);
    s.ctrl._onDragMove({ clientX: 5, clientY: 300 }, null, 0);
    rt.sandbox.window.dispatchEvent({ type: "mouseup" });

    assert.equal(s.ctrl._sidePaneCollapsed, true, "the drag collapses the pane");

    s.ctrl.expandSidePane();

    assert.equal(s.ctrl._sideSize, 300, "expanding returns to the pre-drag width, not to the rail");
});

test("a stylesheet that stacks the split moves the layout onto the vertical axis", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { size: 200, width: 800, height: 600 });

    assert.equal(s.side.style.width, "200px", "side by side, the pane is sized across");

    // the breakpoint reaches the control as a resize
    s.stack(true);
    s.ctrl._handleResize();

    assert.equal(s.ctrl._axis, "vertical", "the control follows the stacked container");
    assert.equal(s.side.style.width, "", "the extent of the abandoned axis is dropped");
    assert.equal(s.side.style.height, "200px", "the size on record is re-applied on the new axis");
    assert.equal(s.main.style.height, "400px", "the main pane takes the rest of the stack");
    assert.ok(
        s.ctrl._splitter.classList.contains("wx-splitter-vertical"),
        "the divider turns into a bar across the stack"
    );
});

test("collapsing a stacked split takes the pane down on the stacked axis", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { size: 200, collapseTo: 45, width: 800, height: 600 });

    s.stack(true);
    s.ctrl._handleResize();
    s.ctrl.collapseSidePane();

    assert.equal(s.side.style.height, "45px", "the rail is left standing across the stack");
    assert.equal(s.side.style.width, "", "nothing constrains the pane across the old axis");
    assert.notEqual(s.ctrl._splitter.style.display, "none", "the divider stays as the way back");
});

test("a stacked split leaves the side size on record for the side-by-side layout", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const s = makeSplit(rt, { id: "shell", size: 200, width: 800, height: 600 });

    // a drag while side by side is what puts a size on record
    s.ctrl._setPaneSizes(320, true);
    s.ctrl._setStateCookie({ size: 320, collapsed: false });

    s.stack(true);
    s.ctrl._handleResize();

    // a drag on the stacked axis reports an extent measured top to bottom,
    // which means nothing to the side-by-side layout the cookie is read back in
    s.ctrl._setStateCookie({ size: 240, collapsed: true });

    const state = s.ctrl._getStateFromCookie();
    assert.equal(state.size, 320, "the width from the side-by-side layout survives");
    assert.equal(state.collapsed, true, "the collapse itself is axis-independent and is kept");
});
