/**
 * Headless contract test for the FrameCtrl control (wx-webui-frame).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * The behavior tests below cover the loading state, which decides how a swap
 * from one page to the next looks: a placeholder while the frame is empty, and
 * the outgoing content held in place while it is not.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.frame.js",
    selector: "wx-webui-frame",
    ctrl: "FrameCtrl"
});

/**
 * Loads a runtime whose fetch is controlled by the test, so the frame can be
 * inspected while a request is still in flight. The parsed document hands back
 * a body carrying one element, which is what the frame moves into itself.
 * @returns {object} The runtime plus a settle() helper that resolves the
 *     pending request and lets the promise chain run.
 */
function loadRuntime() {
    let pending = null;
    let body = () => ({ firstChild: null });

    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.frame.js"],
        fetch: () => new Promise((resolve) => { pending = resolve; }),
        globals: {
            DOMParser: class {
                parseFromString() {
                    return { querySelector: () => null, body: body() };
                }
            }
        }
    });

    body = () => {
        const parsed = rt.document.createElement("body");
        parsed.appendChild(rt.document.createElement("p"));
        return parsed;
    };

    return {
        rt,
        settle: async () => {
            pending({ ok: true, status: 200, headers: { get: () => "text/html" }, text: async () => "<html><body><p>content</p></body></html>" });
            // let the transport, its promise chain and the update run to completion; a
            // macrotask outlasts however many microtask turns the chain takes
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    };
}

/**
 * Builds a frame element bound to a uri.
 * @param {object} rt - The loaded runtime.
 * @param {string} uri - The initial uri.
 * @returns {object} The element and its controller.
 */
function makeFrame(rt, uri) {
    const element = rt.createElement("div");
    element.classList.add("wx-webui-frame");
    element.setAttribute("data-uri", uri);
    rt.document.body.appendChild(element);

    return { element, ctrl: new rt.wx.FrameCtrl(element) };
}

test("a load into an empty frame shows the placeholder", () => {
    const { rt } = loadRuntime();
    const frame = makeFrame(rt, "/first");

    assert.ok(frame.element.querySelector(".placeholder-glow"), "the skeleton fills the empty frame while loading");
});

test("a reload keeps the current content until the replacement arrives", async () => {
    const { rt, settle } = loadRuntime();
    const frame = makeFrame(rt, "/first");

    await settle();
    const loaded = frame.element.firstChild;
    assert.ok(loaded, "the first page is in place");
    assert.equal(frame.element.querySelector(".placeholder-glow"), null, "and the placeholder is gone");

    // swapping to the next page must not flash through an empty frame
    frame.ctrl.uri = "/second";

    assert.equal(frame.element.querySelector(".placeholder-glow"), null, "no skeleton replaces the visible content");
    assert.equal(frame.element.firstChild, loaded, "the outgoing page stays until its replacement is ready");

    await settle();
    assert.notEqual(frame.element.firstChild, loaded, "and is exchanged in a single step");
});

test("an empty uri clears the frame", () => {
    const { rt } = loadRuntime();
    const frame = makeFrame(rt, "/first");

    frame.ctrl.uri = "";

    assert.equal(frame.element.firstChild, null, "nothing is left to show");
    assert.equal(frame.element.querySelector(".placeholder-glow"), null, "and nothing is loading either");
});

test("the landmarks of an embedded page step down, so the host page keeps one main and distinct names", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.frame.js"] });
    const element = rt.createElement("div");
    element.classList.add("wx-webui-frame");
    rt.document.body.appendChild(element);
    const ctrl = new rt.wx.FrameCtrl(element);

    const header = rt.createElement("header");
    const nav = rt.createElement("nav");
    nav.setAttribute("aria-label", "Breadcrumb");
    const main = rt.createElement("main");
    const inner = rt.createElement("nav");
    inner.setAttribute("aria-label", "Sidebar");
    main.appendChild(inner);
    element.appendChild(header);
    element.appendChild(nav);
    element.appendChild(main);

    ctrl._demoteLandmarks(element, "Guest page");

    // a main admits no other role, so it is exchanged for a section in its place
    const region = element.children[2];
    assert.equal(region.tagName, "SECTION", "a second main is no main element any more");
    assert.equal(region.getAttribute("role"), "region", "it is a region");
    assert.equal(region.getAttribute("aria-label"), "Guest page", "named after the page it came from");
    assert.equal(inner.parentNode, region, "with the content it had");
    assert.equal(header.getAttribute("role"), "group", "the banner of the guest page is no banner here");
    assert.equal(nav.getAttribute("aria-label"), "Breadcrumb – Guest page", "a named landmark says which page it belongs to");
    assert.equal(inner.getAttribute("aria-label"), "Sidebar – Guest page", "at any depth");
});

test("the headings of an embedded page continue the section of the host page", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.frame.js"] });
    const section = rt.createElement("h4");
    section.textContent = "Light Mode";
    rt.document.body.appendChild(section);
    const element = rt.createElement("div");
    element.classList.add("wx-webui-frame");
    rt.document.body.appendChild(element);
    const ctrl = new rt.wx.FrameCtrl(element);

    const title = rt.createElement("h1");
    const sub = rt.createElement("h2");
    element.appendChild(title);
    element.appendChild(sub);
    // the stub has no document order; the host heading reports that the frame follows it
    element.compareDocumentPosition = () => 0;
    section.compareDocumentPosition = () => 4;

    ctrl._fitHeadings(element);

    assert.equal(title.getAttribute("aria-level"), "5", "the page title sits one level under the section it is embedded in");
    assert.equal(sub.getAttribute("aria-level"), "6", "and its own steps are kept");
    assert.equal(title.getAttribute("role"), "heading", "the level is spoken through the role");
});
