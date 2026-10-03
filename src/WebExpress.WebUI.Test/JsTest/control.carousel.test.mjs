import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";

test("carousel navigation scrolls the requested slide and touch observations update the indicator", () => {
    let observer;
    let disconnected = false;
    const rt = loadWebUi({ browser: true, globals: {
        IntersectionObserver: class {
            constructor(callback) { observer = callback; }
            observe() {}
            disconnect() { disconnected = true; }
        }
    }, extraFiles: ["webexpress.webui.carousel.js"] });
    const host = rt.createElement("div");
    const track = rt.createElement("div");
    track.className = "carousel-inner";
    host.appendChild(track);
    const scrolled = [];
    for (let i = 0; i < 3; i++) {
        const slide = rt.createElement("div");
        slide.className = "carousel-item";
        slide.scrollIntoView = options => scrolled.push([i, options.inline, options.container]);
        track.appendChild(slide);
        const indicator = rt.createElement("button");
        indicator.setAttribute("data-wx-slide-to", i);
        host.appendChild(indicator);
    }
    const ctrl = new rt.wx.CarouselCtrl(host);
    ctrl.goTo(2);
    ctrl.goTo(3);
    assert.deepEqual(scrolled, [[2, "start", "nearest"], [0, "start", "nearest"]]);
    observer([{ target: track.children[1], isIntersecting: true, intersectionRatio: 0.9 }]);
    assert.equal(ctrl._index, 1);
    assert.equal(ctrl._indicators[1].getAttribute("aria-current"), "true");
    assert.equal(track.style.transform, undefined);
    ctrl.destroy();
    assert.equal(disconnected, true);
});

test("automatic advancement pauses for focus and reduced motion and releases the timer", () => {
    let tick;
    let active = false;
    let motionChanged;
    const motion = { matches: false, addEventListener(type, fn) { motionChanged = fn; }, removeEventListener() {} };
    const rt = loadWebUi({ browser: true, globals: {
        matchMedia: () => motion,
        setInterval: fn => { tick = fn; active = true; return 1; },
        clearInterval: () => { active = false; }
    }, extraFiles: ["webexpress.webui.carousel.js"] });
    const host = rt.createElement("div");
    host.setAttribute("data-wx-interval", "6000");
    host.matches = () => false;
    const track = rt.createElement("div");
    track.className = "carousel-inner";
    for (let i = 0; i < 2; i++) {
        const slide = rt.createElement("div");
        slide.className = "carousel-item";
        track.appendChild(slide);
    }
    host.appendChild(track);
    const ctrl = new rt.wx.CarouselCtrl(host);
    assert.equal(active, true);
    tick();
    assert.equal(ctrl._index, 1);
    host.dispatchEvent({ type: "focusin" });
    assert.equal(active, false);
    motion.matches = true;
    motionChanged();
    assert.equal(active, false);
    motion.matches = false;
    motionChanged();
    assert.equal(active, true);
    ctrl.destroy();
    assert.equal(active, false);
    ctrl._resume();
    assert.equal(active, false, "a queued focusout cannot restart a destroyed carousel");
});
