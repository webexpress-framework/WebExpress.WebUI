/**
 * Headless tests for the render loop of the WebUI view layer
 * (webexpress.webui.state.js): the LocalState container and the StateCtrl base that
 * renders a control as a function of its state, with an exchangeable container so a
 * WebApp control can hand in its ViewState.
 */
import { test } from "node:test";
// loose assert: objects produced inside the vm context have a different
// Object.prototype than this test realm
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Defines a counter control on the StateCtrl base that records its lifecycle.
 * @param {object} rt - The loaded runtime.
 * @returns {Function} The control class.
 */
function counterClass(rt) {
    const h = rt.wx.h;
    return class extends rt.wx.StateCtrl {
        constructor(element, options) {
            super(element, Object.assign({ state: { count: 0, label: "n" } }, options));
            this.log = [];
            this.mount();
        }
        render(state) {
            this.log.push("render " + state.count);
            return [
                h("b", { key: "label" }, state.label),
                h("span", { key: "count", class: "count" }, String(state.count))
            ];
        }
        onMount(state) { this.log.push("mount " + state.count); }
        onUpdate(state) { this.log.push("update " + state.count); }
        onUnmount() { this.log.push("unmount"); }
    };
}

test("local state merges patches and batches them into one notification", async () => {
    const rt = loadWebUi();
    const store = new rt.wx.LocalState({ a: 1, b: 2 });
    const seen = [];
    store.subscribe((state) => seen.push(JSON.stringify(state)));

    store.setState({ a: 5 });
    store.setState((state) => ({ b: state.a + 1 }));
    assert.deepEqual(JSON.parse(JSON.stringify(store.getState())), { a: 5, b: 6 }, "the state changes at once");
    assert.equal(seen.length, 0, "the notification waits for the microtask");

    await Promise.resolve();
    assert.deepEqual(seen, ['{"a":5,"b":6}']);

    const before = store.getState();
    store.setState({ a: 5 });
    await Promise.resolve();
    assert.equal(store.getState(), before, "a patch that changes nothing keeps the state object");
    assert.equal(seen.length, 1, "and notifies nobody");
});

test("local state flushes synchronously and keeps notifying past a failing listener", async () => {
    const rt = loadWebUi();
    const store = new rt.wx.LocalState();
    const seen = [];
    const errors = [];
    const log = console.error;
    console.error = (...args) => errors.push(args[0]);
    try {
        store.subscribe(() => { throw new Error("broken"); });
        const off = store.subscribe((state) => seen.push(state.x));

        store.setState({ x: 1 });
        store.flush();
        assert.deepEqual(seen, [1]);
        assert.equal(errors.length, 1);

        await Promise.resolve();
        assert.deepEqual(seen, [1], "the flushed notification is not delivered twice");

        off();
        store.setState({ x: 2 });
        store.flush();
        assert.deepEqual(seen, [1], "an unsubscribed listener hears nothing");

        const failures = errors.length;
        store.destroy();
        store.setState({ x: 3 });
        store.flush();
        assert.equal(errors.length, failures, "a destroyed container has no subscribers left");
    } finally {
        console.error = log;
    }
});

test("a state control renders on mount and patches its nodes on every change", () => {
    const rt = loadWebUi();
    const Counter = counterClass(rt);
    const host = rt.createElement("div");
    const ctrl = new Counter(host);

    assert.deepEqual(ctrl.log, ["render 0", "mount 0"]);
    const count = host.childNodes[1];
    assert.equal(count.textContent, "0");

    ctrl.setState({ count: 1 });
    ctrl.setState({ count: 2 });
    ctrl.store.flush();

    assert.deepEqual(ctrl.log, ["render 0", "mount 0", "render 2", "update 2"], "two patches render once");
    assert.equal(host.childNodes[1], count, "the keyed node is patched, not rebuilt");
    assert.equal(count.textContent, "2");
});

test("update renders the current state rather than calling render without one", () => {
    const rt = loadWebUi();
    const Counter = counterClass(rt);
    const host = rt.createElement("div");
    const ctrl = new Counter(host, { state: { count: 7, label: "x" } });

    ctrl.update();

    assert.equal(ctrl.log.at(-2), "render 7");
    assert.equal(ctrl.log.at(-1), "update 7");
    assert.equal(host.childNodes[1].textContent, "7");
});

test("a control moved onto another container renders and follows that one", () => {
    const rt = loadWebUi();
    const Counter = counterClass(rt);
    const host = rt.createElement("div");
    const ctrl = new Counter(host);
    const first = ctrl.store;
    const second = new rt.wx.LocalState({ count: 40, label: "shared" });

    ctrl._useStore(second);
    assert.equal(ctrl.store, second);
    assert.equal(host.childNodes[0].textContent, "shared", "it renders the new state at once");

    first.setState({ count: 1 });
    first.flush();
    assert.equal(host.childNodes[1].textContent, "40", "the former container no longer renders");

    second.setState({ count: 41 });
    second.flush();
    assert.equal(host.childNodes[1].textContent, "41");
});

test("a destroyed control stops rendering and runs onUnmount", () => {
    const rt = loadWebUi();
    const Counter = counterClass(rt);
    const host = rt.createElement("div");
    const ctrl = new Counter(host);

    ctrl.destroy();
    ctrl.setState({ count: 9 });
    ctrl.store.flush();

    assert.equal(ctrl.log.at(-1), "unmount");
    assert.equal(host.childNodes[1].textContent, "0");
});

test("a render may return a DOM node, nothing, and patch into a render root of its own", () => {
    const rt = loadWebUi();
    const host = rt.createElement("div");
    const root = rt.createElement("section");
    host.appendChild(root);

    class Mixed extends rt.wx.StateCtrl {
        constructor(element) {
            super(element, { state: { mode: "node" }, renderRoot: root });
            this.mount();
        }
        render(state) {
            if (state.mode === "node") {
                const p = rt.document.createElement("p");
                p.textContent = "built by hand";
                return p;
            }
            return state.mode === "tree" ? rt.wx.h("em", null, "tree") : undefined;
        }
    }

    const ctrl = new Mixed(host);
    assert.equal(host.childNodes.length, 1, "the host keeps its own children");
    assert.equal(root.childNodes[0].tagName, "P");

    ctrl.setState({ mode: "imperative" });
    ctrl.store.flush();
    assert.equal(root.childNodes[0].tagName, "P", "a render that returns nothing leaves the DOM alone");

    ctrl.setState({ mode: "tree" });
    ctrl.store.flush();
    assert.equal(root.childNodes.length, 1);
    assert.equal(root.childNodes[0].tagName, "EM");
});

test("a FrameState notifies once on the next animation frame and flush delivers at once", async () => {
    const rt = loadWebUi({ browser: true });
    const store = new rt.wx.FrameState({ x: 0 });
    const seen = [];
    store.subscribe((state) => seen.push(state.x));

    store.setState({ x: 1 });
    store.setState({ x: 2 });
    await Promise.resolve();
    assert.deepEqual(seen, [], "a microtask is not a frame");

    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.deepEqual(seen, [2], "the frame delivers the last state once");

    store.setState({ x: 3 });
    store.flush();
    assert.deepEqual(seen, [2, 3], "flush renders at once");

    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.deepEqual(seen, [2, 3], "and gives its frame back");
});

test("a destroyed FrameState gives its pending frame back", async () => {
    const rt = loadWebUi({ browser: true });
    const store = new rt.wx.FrameState({ x: 0 });
    const seen = [];
    store.subscribe((state) => seen.push(state.x));

    store.setState({ x: 1 });
    store.destroy();
    await new Promise((resolve) => setTimeout(resolve, 40));

    assert.deepEqual(seen, []);
});
