/**
 * Headless tests for the keyed reconciler of the WebUI view layer
 * (webexpress.webui.renderer.js): node creation and in-place patching, keyed moves,
 * the keep flag of nested controls, controlled values, the SVG namespace, adopted
 * nodes and the html prop. The render loop that drives it is covered by
 * state.test.mjs.
 */
import { test } from "node:test";
// loose assert: objects produced inside the vm context have a different
// Object.prototype than this test realm
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

const SVG = "http://www.w3.org/2000/svg";
const XHTML = "http://www.w3.org/1999/xhtml";

test("renderer creates elements and text", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");

    wx.Renderer.patch(root, [h("span", { class: "a" }, "hello"), h("b", null, "x")]);

    assert.equal(root.childNodes.length, 2);
    assert.equal(root.childNodes[0].tagName, "SPAN");
    assert.equal(root.childNodes[0].className, "a");
    assert.equal(root.childNodes[0].textContent, "hello");
    assert.equal(root.childNodes[1].tagName, "B");
});

test("renderer updates props and text in place", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");

    wx.Renderer.patch(root, [h("span", { class: "a" }, "hi")]);
    const span = root.childNodes[0];

    wx.Renderer.patch(root, [h("span", { class: "b", "data-x": "1" }, "ho")]);

    assert.equal(root.childNodes[0], span);
    assert.equal(span.className, "b");
    assert.equal(span.getAttribute("data-x"), "1");
    assert.equal(span.textContent, "ho");
});

test("renderer reorders keyed nodes and preserves identity", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");

    wx.Renderer.patch(root, [h("li", { key: "a" }, "A"), h("li", { key: "b" }, "B"), h("li", { key: "c" }, "C")]);
    const [a, b, c] = root.childNodes;

    wx.Renderer.patch(root, [h("li", { key: "c" }, "C"), h("li", { key: "a" }, "A"), h("li", { key: "b" }, "B")]);

    assert.equal(root.childNodes.length, 3);
    assert.equal(root.childNodes[0], c);
    assert.equal(root.childNodes[1], a);
    assert.equal(root.childNodes[2], b);
});

test("renderer keep flag preserves a nested subtree", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");

    wx.Renderer.patch(root, [h("div", { class: "host", keep: true })]);
    const host = root.childNodes[0];
    const nested = createElement("span");
    host.appendChild(nested);

    wx.Renderer.patch(root, [h("div", { class: "host2", keep: true })]);

    assert.equal(root.childNodes[0], host);
    assert.equal(host.className, "host2");
    assert.equal(host.childNodes.length, 1);
    assert.equal(host.childNodes[0], nested);
});

test("renderer selects a select's value once its options exist", () => {
    const { wx, document } = loadWebUi();
    const h = wx.h;
    // a browser ignores a select value that none of its options carries
    const create = document.createElement.bind(document);
    document.createElement = (tag) => {
        const el = create(tag);
        if (tag === "select") {
            let selected = "";
            Object.defineProperty(el, "value", {
                get: () => selected,
                set: (v) => { selected = el.childNodes.some((o) => o.value === v) ? v : ""; }
            });
        }
        return el;
    };
    const root = create("div");
    const options = (ids) => ids.map((id) => h("option", { key: id, value: id }, id));

    wx.Renderer.patch(root, [h("select", { value: "b" }, options(["a", "b"]))]);
    assert.equal(root.childNodes[0].value, "b", "the value is applied after the options were created");

    wx.Renderer.patch(root, [h("select", { value: "c" }, options(["a", "b", "c"]))]);
    assert.equal(root.childNodes[0].value, "c", "and after options were added on a patch");
});

test("renderer leaves what a nested control added to an unchanged node", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");
    const tree = (label) => [h("div", { key: "host", class: "editor", title: "t", keep: true }), h("span", null, label)];

    wx.Renderer.patch(root, tree("a"));
    const host = root.childNodes[0];
    // the editor that lives on the node decorates it
    host.classList.add("wx-editor");
    host.setAttribute("role", "textbox");

    wx.Renderer.patch(root, tree("b"));
    assert.equal(root.childNodes[0], host);
    assert.ok(host.classList.contains("wx-editor"), "an unchanged class prop is not rewritten");
    assert.equal(host.getAttribute("role"), "textbox");
    assert.equal(root.childNodes[1].textContent, "b");

    wx.Renderer.patch(root, [h("div", { key: "host", class: "editor wide", title: "t", keep: true }), h("span", null, "b")]);
    assert.equal(host.className, "editor wide", "a changed class prop is applied");
});

test("renderer keeps a controlled input on its state value", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");

    wx.Renderer.patch(root, [h("input", { value: "" })]);
    root.childNodes[0].value = "typed but not taken into the state";
    wx.Renderer.patch(root, [h("input", { value: "" })]);

    assert.equal(root.childNodes[0].value, "", "value is written even when the prop did not change");
});

test("renderer creates svg content in the SVG namespace and HTML again inside a foreignObject", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");
    const tree = (cls) => [h("svg", { viewBox: "0 0 10 10", class: "chart" },
        h("g", { class: cls }, h("rect", { key: "r", width: 4, height: 2 })),
        h("foreignObject", null, h("div", { class: "label" }, "x")))];

    wx.Renderer.patch(root, tree("bars"));
    const svg = root.childNodes[0];
    const [g, foreign] = svg.childNodes;
    assert.equal(svg.namespaceURI, SVG);
    assert.equal(g.namespaceURI, SVG);
    assert.equal(g.tagName, "g", "an SVG element keeps the case of its name");
    assert.equal(g.childNodes[0].namespaceURI, SVG);
    assert.equal(svg.getAttribute("viewBox"), "0 0 10 10", "attribute names keep their case");
    assert.equal(g.getAttribute("class"), "bars", "an svg class is written as an attribute");
    assert.equal(foreign.childNodes[0].namespaceURI, XHTML, "foreignObject content is HTML");
    assert.equal(foreign.childNodes[0].className, "label");

    wx.Renderer.patch(root, tree("bars wide"));
    assert.equal(root.childNodes[0].childNodes[0], g);
    assert.equal(g.getAttribute("class"), "bars wide");
});

test("renderer adopts an existing node without recreating it or lending it to another node", () => {
    const { wx, document, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");
    const pane = createElement("div");
    pane.className = "pane";
    pane.appendChild(document.createTextNode("server content"));
    root.appendChild(pane);

    wx.Renderer.patch(root, [h("div", { class: "body" }, "list"), wx.Renderer.adopt(pane, { hidden: "hidden" })]);
    assert.equal(root.childNodes.length, 2, "the existing node was not duplicated");
    assert.equal(root.childNodes[0].className, "body", "a new div was created instead of patching the pane");
    assert.equal(root.childNodes[1], pane);
    assert.equal(pane.getAttribute("hidden"), "hidden");
    assert.equal(pane.textContent, "server content", "its children are its own");

    wx.Renderer.patch(root, [wx.Renderer.adopt(pane, {}), h("div", { class: "body" }, "graph")]);
    assert.equal(root.childNodes[0], pane, "the node moved with the tree");
    assert.equal(pane.hasAttribute("hidden"), false, "a prop the view no longer states is removed");
    assert.equal(pane.className, "pane", "the node's own class is left alone");
});

test("renderer adds the described content to an adopted container and keeps what it adopts there", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("form");
    const body = createElement("div");
    body.className = "modal-body";
    const field = createElement("input");
    body.appendChild(field);
    root.appendChild(body);
    const tree = (errors) => [wx.Renderer.adopt(body, null, [
        h("div", { key: "banner", class: "banner" }, errors),
        wx.Renderer.adopt(field)
    ])];

    wx.Renderer.patch(root, tree("one"));
    assert.equal(root.childNodes[0], body);
    assert.equal(body.childNodes.length, 2);
    assert.equal(body.childNodes[0].textContent, "one", "the described content leads");
    assert.equal(body.childNodes[1], field, "the adopted field keeps its place behind it");
    const banner = body.childNodes[0];

    wx.Renderer.patch(root, tree("two"));
    assert.equal(body.childNodes[0], banner);
    assert.equal(banner.textContent, "two");
    assert.equal(body.childNodes[1], field);

    // without described children the node's own children stay untouched
    wx.Renderer.patch(root, [wx.Renderer.adopt(body)]);
    assert.equal(body.childNodes.length, 2);
});

test("renderer keeps the markup of an html prop across later renders", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");
    const tree = (label) => [h("div", { class: "body", html: "<p>stored</p>" }), h("span", null, label)];

    wx.Renderer.patch(root, tree("a"));
    const body = root.childNodes[0];
    // the stub does not parse markup; it keeps it as one text node, which stands in
    // for the nodes a browser parses
    const parsed = body.childNodes[0];
    assert.equal(body.childNodes.length, 1);

    wx.Renderer.patch(root, tree("b"));
    assert.equal(root.childNodes[0], body);
    assert.equal(body.childNodes.length, 1);
    assert.equal(body.childNodes[0], parsed, "a later render does not reconcile the markup away");

    wx.Renderer.patch(root, [h("div", { class: "body" }, h("em", null, "children")), h("span", null, "b")]);
    assert.equal(body.childNodes.length, 1);
    assert.equal(body.childNodes[0].tagName, "EM", "dropping the prop hands the children back to the tree");
});

test("renderer sets and removes custom properties of a style object", () => {
    const { wx, document } = loadWebUi();
    const h = wx.h;
    // a browser keeps custom properties out of the style object's members: assigning
    // style["--name"] sets nothing the stylesheet sees
    const create = document.createElement.bind(document);
    document.createElement = (tag) => {
        const el = create(tag);
        if (tag === "li") {
            const custom = new Map();
            el.style.setProperty = (name, value) => { custom.set(name, String(value)); };
            el.style.removeProperty = (name) => { custom.delete(name); };
            el.style.getPropertyValue = (name) => custom.get(name) || "";
        }
        return el;
    };
    const root = create("div");
    const tree = (style) => [h("li", { key: "tab", style })];

    wx.Renderer.patch(root, tree({ "--wx-tab-color": "#198754", width: "4px" }));
    const li = root.childNodes[0];
    assert.equal(li.style.getPropertyValue("--wx-tab-color"), "#198754");
    assert.equal(li.style.width, "4px");

    wx.Renderer.patch(root, tree({ width: "4px" }));
    assert.equal(li.style.getPropertyValue("--wx-tab-color"), "", "a dropped custom property is removed");
    assert.equal(li.style.width, "4px");
});

test("renderer removes stale nodes", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");

    wx.Renderer.patch(root, [h("li", null, "1"), h("li", null, "2"), h("li", null, "3")]);
    assert.equal(root.childNodes.length, 3);

    wx.Renderer.patch(root, [h("li", null, "1")]);
    assert.equal(root.childNodes.length, 1);
    assert.equal(root.childNodes[0].textContent, "1");
});

test("renderer leaves an unchanged style declaration alone", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");

    wx.Renderer.patch(root, [h("span", { style: { color: "red", cursor: "" } })]);
    const span = root.childNodes[0];
    // a hand outside the view changed the cursor; the view states the same cursor as before
    span.style.cursor = "grabbing";

    wx.Renderer.patch(root, [h("span", { style: { color: "blue", cursor: "" } })]);

    assert.equal(span.style.color, "blue", "a changed declaration is written");
    assert.equal(span.style.cursor, "grabbing", "an unchanged one is not");
});

test("renderer patches children that kept their order in place and still moves reordered ones", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");

    wx.Renderer.patch(root, [h("i", { key: "a" }, "A"), h("i", { key: "b" }, "B"), "tail"]);
    const [a, b, tail] = root.childNodes;

    wx.Renderer.patch(root, [h("i", { key: "a", class: "x" }, "A"), h("i", { key: "b" }, "B2"), "tail2"]);
    assert.ok(root.childNodes[0] === a && root.childNodes[1] === b && root.childNodes[2] === tail, "same nodes, same places");
    assert.equal(a.className, "x");
    assert.equal(b.textContent, "B2");
    assert.equal(tail.textContent, "tail2");

    wx.Renderer.patch(root, [h("i", { key: "b" }, "B2"), h("i", { key: "a", class: "x" }, "A")]);
    assert.ok(root.childNodes[0] === b && root.childNodes[1] === a, "a reorder still moves the keyed nodes");
    assert.equal(root.childNodes.length, 2);
});

test("renderer releases the listeners it attached below a node", () => {
    const { wx, createElement } = loadWebUi();
    const h = wx.h;
    const root = createElement("div");
    const calls = [];

    wx.Renderer.patch(root, [h("button", { key: "b", on: { click: () => calls.push("click") } }, h("i", { on: { focus: () => calls.push("focus") } }))]);
    const button = root.childNodes[0];
    const icon = button.childNodes[0];

    wx.Renderer.release(root);
    button.dispatchEvent({ type: "click" });
    icon.dispatchEvent({ type: "focus" });

    assert.deepEqual(calls, [], "no listener survives the release");
});
