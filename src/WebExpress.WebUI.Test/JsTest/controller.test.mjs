/**
 * Headless unit tests for the webexpress.webui controller lifecycle.
 *
 * They cover the deterministic teardown of the View, State and Service
 * architecture (see WebExpress/docs/view-state-service.md, section 4): the
 * controller instantiates registered classes for new DOM elements, destroys
 * the instances of removed elements, runs element cleanups, and leaves moved
 * or intentionally detached elements untouched.
 *
 * Run with Node 18 or newer from the jstest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, childListMutation } from "./harness.mjs";

/**
 * Registers a probe control class that records its destruction.
 * @param {object} wx - The webui namespace.
 * @param {string} selector - The marker class to register under.
 * @returns {Function} The probe class.
 */
function registerProbe(wx, selector) {
    class Probe extends wx.Ctrl {
        constructor(element) {
            super(element);
            this.destroyed = 0;
        }
        destroy() {
            this.destroyed += 1;
            super.destroy();
        }
    }

    wx.Controller.registerClass(selector, Probe);
    return Probe;
}

test("controller creates an instance for a registered selector and strips the marker class", () => {
    const { wx, createElement } = loadWebUi();
    registerProbe(wx, "wx-probe");

    const element = createElement("div");
    element.classList.add("wx-probe");
    wx.Controller.createInstances(element);

    const instance = wx.Controller.instanceMap.get(element);
    assert.ok(instance, "the instance is registered in the instance map");
    assert.equal(element.classList.contains("wx-probe"), false, "the marker class is consumed");
});

test("a removed element destroys its instance and leaves the instance map", () => {
    const { wx, createElement } = loadWebUi();
    registerProbe(wx, "wx-probe");

    const element = createElement("div");
    element.classList.add("wx-probe");
    wx.Controller.createInstances(element);
    const instance = wx.Controller.instanceMap.get(element);

    // the element is not connected, so the removal is final
    wx.Controller.handleMutations([childListMutation({ removed: [element] })]);

    assert.equal(instance.destroyed, 1, "destroy ran once");
    assert.equal(wx.Controller.instanceMap.has(element), false, "the instance left the map");
});

test("descendant instances are destroyed with their removed ancestor", () => {
    const { wx, createElement } = loadWebUi();
    registerProbe(wx, "wx-probe");

    const host = createElement("div");
    const child = createElement("span");
    child.classList.add("wx-probe");
    host.appendChild(child);
    wx.Controller.createInstances(host);
    const instance = wx.Controller.instanceMap.get(child);
    assert.ok(instance);

    wx.Controller.handleMutations([childListMutation({ removed: [host] })]);

    assert.equal(instance.destroyed, 1);
    assert.equal(wx.Controller.instanceMap.has(child), false);
});

test("a still connected element is treated as moved and kept alive", () => {
    const { wx, document, createElement } = loadWebUi();
    registerProbe(wx, "wx-probe");

    const element = createElement("div");
    element.classList.add("wx-probe");
    wx.Controller.createInstances(element);
    const instance = wx.Controller.instanceMap.get(element);

    // the element was re-inserted before the mutation batch is processed
    document.body.appendChild(element);
    wx.Controller.handleMutations([childListMutation({ removed: [element] })]);

    assert.equal(instance.destroyed, 0, "a moved element is not destroyed");
    assert.equal(wx.Controller.instanceMap.has(element), true);
});

test("an intentional detach keeps the instance until the element is finally removed", () => {
    const { wx, document, createElement } = loadWebUi();
    registerProbe(wx, "wx-probe");

    const element = createElement("div");
    element.classList.add("wx-probe");
    document.body.appendChild(element);
    wx.Controller.createInstances(element);
    const instance = wx.Controller.instanceMap.get(element);

    // a control detaches the element to hold it offline (expandable, modal,
    // smartedit); the detach flags the element and the teardown skips it
    instance._detachElement(element);
    assert.equal(element._wxDetached, true);
    wx.Controller.handleMutations([childListMutation({ removed: [element] })]);
    assert.equal(instance.destroyed, 0, "a detached element is not destroyed");
    assert.equal(wx.Controller.instanceMap.has(element), true);

    // reattaching clears the flag, so a later removal is final
    document.body.appendChild(element);
    wx.Controller.handleMutations([childListMutation({ added: [element] })]);
    assert.equal(element._wxDetached, undefined, "the flag is cleared on re-add");

    document.body.removeChild(element);
    wx.Controller.handleMutations([childListMutation({ removed: [element] })]);
    assert.equal(instance.destroyed, 1, "the final removal destroys the instance");
    assert.equal(wx.Controller.instanceMap.has(element), false);
});

test("a stale insertion record does not strip the mark from a held element", () => {
    const { wx, document, createElement } = loadWebUi();
    registerProbe(wx, "wx-probe");

    const host = createElement("div");
    const element = createElement("div");
    element.classList.add("wx-probe");
    host.appendChild(element);
    document.body.appendChild(host);
    wx.Controller.createInstances(host);
    const instance = wx.Controller.instanceMap.get(element);

    // the shape a parsed page produces: the batch still carries the insertion of
    // the element, and by the time it is processed the control that was built
    // from the same batch has taken the element out again to hold on to it
    instance._detachElement(element);
    wx.Controller.handleMutations([childListMutation({ added: [element] })]);
    assert.equal(element._wxDetached, true, "an insertion that no longer holds leaves the mark alone");

    wx.Controller.handleMutations([childListMutation({ removed: [element] })]);
    assert.equal(instance.destroyed, 0, "so the element the control holds survives the batch");
    assert.equal(wx.Controller.instanceMap.has(element), true);
});

test("a detached element parked inside a removed container keeps its instance", () => {
    const { wx, document, createElement } = loadWebUi();
    registerProbe(wx, "wx-probe");

    const host = createElement("div");
    const element = createElement("div");
    element.classList.add("wx-probe");
    host.appendChild(element);
    document.body.appendChild(host);
    wx.Controller.createInstances(host);
    const instance = wx.Controller.instanceMap.get(element);

    // the shape the smart edit produces: the held element is flagged, then put
    // into a container that the control empties again when the edit ends. the
    // container is what the observer reports as removed, so a teardown that
    // walked into it unconditionally destroyed the element the control still holds
    instance._detachElement(element);
    const container = createElement("form");
    container.appendChild(element);
    host.appendChild(container);
    wx.Controller.handleMutations([childListMutation({ added: [container] })]);

    host.removeChild(container);
    wx.Controller.handleMutations([childListMutation({ removed: [container] })]);

    assert.equal(instance.destroyed, 0, "the element the control still holds is not destroyed");
    assert.equal(wx.Controller.instanceMap.has(element), true, "and its instance stays reachable");
});

test("a plain descendant of a removed container is still destroyed", () => {
    const { wx, document, createElement } = loadWebUi();
    registerProbe(wx, "wx-probe");

    const container = createElement("div");
    const element = createElement("div");
    element.classList.add("wx-probe");
    container.appendChild(element);
    document.body.appendChild(container);
    wx.Controller.createInstances(container);
    const instance = wx.Controller.instanceMap.get(element);

    document.body.removeChild(container);
    wx.Controller.handleMutations([childListMutation({ removed: [container] })]);

    assert.equal(instance.destroyed, 1, "an ordinary descendant still gets its teardown");
    assert.equal(wx.Controller.instanceMap.has(element), false);
});

test("element cleanups registered by binds run on removal", () => {
    const { wx, createElement } = loadWebUi();

    const element = createElement("span");
    let cleaned = 0;
    element._wxCleanup = [() => { cleaned += 1; }];

    wx.Controller.handleMutations([childListMutation({ removed: [element] })]);

    assert.equal(cleaned, 1, "the cleanup ran");
    assert.equal(element._wxCleanup, undefined, "the cleanup list is dropped");
});

test("a failing destroy does not interrupt the teardown of siblings", () => {
    const { wx, createElement } = loadWebUi();

    class Faulty extends wx.Ctrl {
        destroy() { throw new Error("boom"); }
    }
    wx.Controller.registerClass("wx-faulty", Faulty);
    registerProbe(wx, "wx-probe");

    const host = createElement("div");
    const faulty = createElement("span");
    faulty.classList.add("wx-faulty");
    const probe = createElement("span");
    probe.classList.add("wx-probe");
    host.appendChild(faulty);
    host.appendChild(probe);
    wx.Controller.createInstances(host);
    const probeInstance = wx.Controller.instanceMap.get(probe);

    wx.Controller.handleMutations([childListMutation({ removed: [host] })]);

    assert.equal(probeInstance.destroyed, 1, "the sibling teardown still ran");
    assert.equal(wx.Controller.instanceMap.has(faulty), false);
    assert.equal(wx.Controller.instanceMap.has(probe), false);
});

test("the actions and binds registries follow the register, get and unregister shape", () => {
    const { wx } = loadWebUi();

    const action = { execute() { } };
    wx.Actions.register("probe-action", action);
    assert.equal(wx.Actions.get("probe-action"), action);
    wx.Actions.unregister("probe-action");
    assert.equal(wx.Actions.get("probe-action"), null);

    const bind = { bind() { } };
    wx.Binds.register("probe-bind", bind);
    assert.equal(wx.Binds.get("probe-bind"), bind);
    wx.Binds.unregister("probe-bind");
    assert.equal(wx.Binds.get("probe-bind"), null);
});
