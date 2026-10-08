/**
 * Shared contract for the per-control headless tests. Every control that
 * registers itself with the controller (webexpress.webui.Controller.registerClass)
 * has its own <control>.test.mjs file that calls contract(...) with the source
 * file, selector and exported class. The contract verifies two things against
 * the real, shipped source:
 *
 *   1. registration  - the selector maps to the expected, exported class and
 *                       that class derives from the Ctrl base.
 *   2. lifecycle      - the controller can construct an instance for a
 *                       representative host element (the marker class is
 *                       consumed and the instance is tracked) and can tear it
 *                       down again without the controller swallowing a
 *                       constructor, destroy or cleanup error.
 *
 * The controller deliberately catches and logs construction and teardown
 * failures (see webexpress.webui.js) so that one broken control cannot abort a
 * page. That makes a console.error the only externally visible symptom of such
 * a failure, so the lifecycle test treats those controller-emitted messages as
 * assertion failures.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, childListMutation } from "./harness.mjs";

/**
 * The controller log fragments that signal a swallowed lifecycle failure.
 */
const FAILURE_MARKERS = [
    "Failed to create instance",
    "Failed to instantiate class",
    "Error destroying instance",
    "Error running element cleanup"
];

/**
 * Builds the default representative host: a connected div that carries the
 * control's marker class.
 * @param {object} rt - The loaded runtime.
 * @param {string} selector - The marker class of the control.
 * @returns {object} The host element.
 */
export function defaultHost(rt, selector) {
    const element = rt.createElement("div");
    element.classList.add(selector);
    rt.document.body.appendChild(element);
    return element;
}

/**
 * Loads a runtime with the control and its dependencies, in dependency order.
 * The browser globals are enabled because most controls touch window, the
 * animation frame, observers or the Popper layout helper at construction time.
 * @param {object} control - The control descriptor.
 * @returns {object} The loaded runtime.
 */
function loadControl(control) {
    return loadWebUi({ browser: true, extraFiles: [...(control.deps || []), control.file] });
}

/**
 * Registers the registration and lifecycle tests for a single control.
 * @param {object} control - The descriptor: { file, selector, ctrl, deps?, host? }.
 *   file     - the shipped source file that registers the control.
 *   selector - the marker class the control registers under.
 *   ctrl     - the exported class name on webexpress.webui.
 *   deps     - base control files that must load first (a control it extends).
 *   host     - optional builder for a control that reads a specific structure.
 */
export function contract(control) {
    test(`${control.selector} registers ${control.ctrl} as a Ctrl subclass`, () => {
        const rt = loadControl(control);

        const registered = rt.wx.Controller.classRegistry.get(control.selector);
        assert.ok(registered, `selector "${control.selector}" is registered`);
        assert.equal(registered, rt.wx[control.ctrl], `selector maps to webexpress.webui.${control.ctrl}`);
        assert.ok(registered.prototype instanceof rt.wx.Ctrl, `${control.ctrl} derives from Ctrl`);
    });

    test(`${control.selector} constructs and tears down without a swallowed error`, () => {
        const rt = loadControl(control);

        const messages = [];
        const realError = console.error;
        console.error = (...args) => {
            messages.push(args.map((a) => (a && a.message) || String(a)).join(" "));
        };

        try {
            const host = control.host ? control.host(rt, control.selector) : defaultHost(rt, control.selector);

            rt.wx.Controller.createInstances(host);

            assert.ok(rt.wx.Controller.instanceMap.has(host), "the controller tracks the new instance");
            assert.equal(host.classList.contains(control.selector), false, "the marker class is consumed");

            // a final removal drives the deterministic teardown; a control that
            // intentionally detaches its host keeps its instance, which is a
            // documented outcome rather than a leak
            rt.document.body.removeChild(host);
            rt.wx.Controller.handleMutations([childListMutation({ removed: [host] })]);
            assert.ok(
                !rt.wx.Controller.instanceMap.has(host) || host._wxDetached,
                "the instance is destroyed or intentionally retained while detached"
            );

            const swallowed = messages.filter((m) => FAILURE_MARKERS.some((marker) => m.includes(marker)));
            assert.deepEqual(swallowed, [], `the controller logged no lifecycle failure:\n${swallowed.join("\n")}`);
        } finally {
            console.error = realError;
        }
    });
}
