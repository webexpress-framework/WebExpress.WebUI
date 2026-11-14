/**
 * Tests the drag-and-drop protocol shared by the data controls: what a drag carries, where a
 * drop lands, how a target refuses and what a drop announces. The DOM stub does not bubble, so
 * the document listeners are driven by calling their handlers with the event a browser would pass.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";

/**
 * A custom event that can be refused, as a browser's is.
 */
class CancelableEvent {
    constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
        this.bubbles = !!init.bubbles;
        this.cancelable = !!init.cancelable;
        this.defaultPrevented = false;
    }

    preventDefault() {
        if (this.cancelable) {
            this.defaultPrevented = true;
        }
    }
}

/**
 * Loads the protocol with two sources in a scope and a target.
 * @returns {object} The runtime, the protocol and the elements.
 */
function setup() {
    const rt = loadWebUi({ browser: true, globals: { CustomEvent: CancelableEvent }, extraFiles: ["webexpress.webui.dragdrop.js"] });
    const dd = rt.wx.DragDrop;
    const scope = rt.createElement("div");
    scope.setAttribute("data-wx-drag-scope", "");
    const a = rt.createElement("div");
    const b = rt.createElement("div");
    dd.decorate(a, "1", { dragKind: "issue" });
    dd.decorate(b, "2", { dragKind: "issue" });
    scope.appendChild(a);
    scope.appendChild(b);
    const target = rt.createElement("div");
    dd.decorate(target, "folder", { dropKind: "folder" });
    rt.document.body.appendChild(scope);
    rt.document.body.appendChild(target);
    return { rt, dd, scope, a, b, target };
}

/**
 * Builds the native event a drag handler receives.
 * @param {object} target - The element under the pointer.
 * @param {object} [extra={}] - Further fields.
 * @returns {object} The event.
 */
function dragEvent(target, extra = {}) {
    const data = {};
    return Object.assign({
        target,
        clientY: 0,
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        dataTransfer: { setData(type, value) { data[type] = value; }, getData(type) { return data[type]; }, data }
    }, extra);
}

test("the attributes make an element a source, a target or both", () => {
    const { dd } = setup();

    assert.deepEqual({ ...dd.attributes("7", { dragKind: "issue", dropKind: "folder" }) }, {
        draggable: "true",
        "data-wx-drag": "7",
        "data-wx-drag-kind": "issue",
        "data-wx-drop": "7",
        "data-wx-drop-kind": "folder"
    });
    assert.deepEqual({ ...dd.attributes("7", {}) }, {});
    assert.deepEqual({ ...dd.attributes(null, { dragKind: "issue" }) }, {});
});

test("a drag carries the source, or every chosen source of the scope when it starts on a chosen one", () => {
    const { dd, a, b } = setup();

    assert.deepEqual(Array.from(dd.sourcesOf(a), (x) => x.id), ["1"]);

    a.setAttribute("aria-selected", "true");
    b.setAttribute("aria-selected", "true");
    assert.deepEqual(Array.from(dd.sourcesOf(a), (x) => x.id), ["1", "2"]);

    const start = dragEvent(a);
    dd._onDragStart(start);
    assert.deepEqual(JSON.parse(start.dataTransfer.data[dd.TYPE]).map((x) => x.id), ["1", "2"]);
    assert.ok(a.classList.contains("wx-dragging") && b.classList.contains("wx-dragging"));

    dd._end();
    assert.equal(dd.current, null);
    assert.ok(!a.classList.contains("wx-dragging"));
});

test("a drop on a target announces the sources, the target and the effect", () => {
    const { dd, a, target } = setup();
    const drops = [];
    target.addEventListener(dd.DROP_EVENT, (e) => drops.push(e.detail));

    dd._onDragStart(dragEvent(a));
    const over = dragEvent(target);
    dd._onDragOver(over);
    assert.ok(over.defaultPrevented, "a target that takes the drag says so");
    assert.ok(target.classList.contains("wx-drag-over"), "the area mark shows where it lands");

    dd._onDrop(dragEvent(target, { ctrlKey: true }));

    assert.equal(drops.length, 1);
    assert.deepEqual(Array.from(drops[0].sources, (x) => [x.id, x.kind]), [["1", "issue"]]);
    assert.equal(drops[0].target.id, "folder");
    assert.equal(drops[0].target.position, "into");
    assert.equal(drops[0].effect, "copy");
    assert.ok(!target.classList.contains("wx-drag-over"), "the drop clears the mark");
});

test("a check listener refuses a target, which is drawn as refused and gets no drop", () => {
    const { dd, a, target } = setup();
    const drops = [];
    target.addEventListener(dd.CHECK_EVENT, (e) => {
        if (e.detail.sources.some((x) => x.id === "1")) {
            e.preventDefault();
        }
    });
    target.addEventListener(dd.DROP_EVENT, (e) => drops.push(e.detail));

    dd._onDragStart(dragEvent(a));
    const over = dragEvent(target);
    dd._onDragOver(over);

    assert.ok(!over.defaultPrevented);
    assert.ok(target.classList.contains("wx-drag-blocked"));

    dd._onDrop(dragEvent(target));
    assert.equal(drops.length, 0);
});

test("a target takes only the kinds it accepts, and never the source itself", () => {
    const { dd, a, target } = setup();
    target.setAttribute("data-wx-drop-accept", "page");

    dd._onDragStart(dragEvent(a));
    const over = dragEvent(target);
    dd._onDragOver(over);
    assert.ok(!over.defaultPrevented);

    dd.decorate(a, "1", { dragKind: "issue", dropKind: "issue" });
    const self = dragEvent(a);
    dd._onDragOver(self);
    assert.ok(!self.defaultPrevented, "a source is not dropped onto itself");
});

test("a target of the source's own kind with edges takes a drop above, into and below", () => {
    const { rt, dd } = setup();
    const source = rt.createElement("div");
    const sibling = rt.createElement("div");
    dd.decorate(source, "s", { dragKind: "node", dropKind: "node" });
    dd.decorate(sibling, "t", { dragKind: "node", dropKind: "node" });
    sibling.setAttribute("data-wx-drop-position", "edges");
    sibling.getBoundingClientRect = () => ({ top: 0, height: 100, left: 0, width: 100 });
    rt.document.body.appendChild(source);
    rt.document.body.appendChild(sibling);

    dd._onDragStart(dragEvent(source));
    const at = (y) => dd._describe(sibling, dd.current.sources, { clientY: y }).position;
    assert.equal(at(10), "above");
    assert.equal(at(50), "into");
    assert.equal(at(90), "below");

    dd._onDragOver(dragEvent(sibling, { clientY: 10 }));
    assert.equal(sibling.getAttribute("data-wx-drop-at"), "above", "the line mark shows the edge");

    sibling.setAttribute("data-wx-drop-into", "false");
    assert.equal(at(40), "above", "a target that takes no children leaves only its edges");
    assert.equal(at(60), "below");
});

test("a target that takes only other kinds into itself leaves its own kind the edges", () => {
    const { rt, dd, a } = setup();
    const source = rt.createElement("div");
    const card = rt.createElement("div");
    dd.decorate(source, "s", { dragKind: "card", dropKind: "card" });
    dd.decorate(card, "t", { dragKind: "card", dropKind: "card" });
    card.setAttribute("data-wx-drop-position", "edges");
    card.setAttribute("data-wx-drop-into", "other");
    card.getBoundingClientRect = () => ({ top: 0, height: 100, left: 0, width: 100 });
    rt.document.body.appendChild(source);
    rt.document.body.appendChild(card);

    dd._onDragStart(dragEvent(source));
    const own = (y) => dd._describe(card, dd.current.sources, { clientY: y }).position;
    assert.equal(own(40), "above", "a card of its own kind lands between, never inside");
    assert.equal(own(60), "below");
    dd._end();

    dd._onDragStart(dragEvent(a));
    assert.equal(dd._describe(card, dd.current.sources, { clientY: 10 }).position, "into", "an item of another kind is dropped onto it");
});

test("the drop carries the element the drag started on, and the drag is current while it is announced", () => {
    const { dd, a, target } = setup();
    const seen = [];
    target.addEventListener(dd.DROP_EVENT, (e) => seen.push({ origin: e.detail.origin, current: dd.current }));
    target.addEventListener(dd.CHECK_EVENT, (e) => seen.push({ check: e.detail.origin }));

    dd._onDragStart(dragEvent(a));
    dd._onDrop(dragEvent(target));

    const drop = seen.find((x) => "current" in x);
    assert.equal(drop.origin, a);
    assert.ok(drop.current, "a listener can still ask for the drag");
    assert.equal(seen.find((x) => "check" in x).check, a);
    assert.equal(dd.current, null, "the drag ends after the announcement");
});
