/**
 * Headless contract test for the InputAvatarCtrl control (wx-webui-input-avatar).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * The behavior tests below pin the zoom slider to a fixed integer domain. A
 * slider that carried the scale itself put a fractional min on a range input,
 * and the browser rounds the sanitized value to fewer digits than that min has
 * - landing just below it, reporting a range underflow and blocking the submit
 * of the whole surrounding form. The DOM stub has no constraint validation, so
 * the tests assert the shape the browser never gets to complain about instead.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.avatar.js",
    selector: "wx-webui-input-avatar",
    ctrl: "InputAvatarCtrl"
});

/**
 * Builds an avatar input and hands it an image of the given intrinsic size,
 * bypassing the file/decode path the stub cannot run.
 * @param {object} rt - The loaded runtime.
 * @param {object} options - { naturalWidth, naturalHeight, viewport }.
 * @returns {object} The controller and its zoom slider.
 */
function makeAvatar(rt, { naturalWidth, naturalHeight, viewport = 320 } = {}) {
    const el = rt.createElement("div");
    el.classList.add("wx-webui-input-avatar");
    el.setAttribute("data-viewport", String(viewport));
    rt.document.body.appendChild(el);

    const ctrl = new rt.wx.InputAvatarCtrl(el);
    ctrl._image = { naturalWidth, naturalHeight };
    ctrl._initTransform();

    return { ctrl, zoom: ctrl._zoom };
}

// 2800x2800 at a 320 viewport is the size that produced the reported underflow:
// the scale is 4/35, whose shortest representation has more digits than the
// browser keeps when it sanitizes the slider value.
test("the zoom slider keeps an integer domain no matter how the scale rounds", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.avatar.js"] });
    const { zoom } = makeAvatar(rt, { naturalWidth: 2800, naturalHeight: 2800 });

    assert.equal(zoom.min, "0", "a fractional min is what the browser rounds below");
    assert.equal(zoom.max, String(rt.wx.InputAvatarCtrl.ZOOM_RESOLUTION));
    assert.equal(zoom.step, "1");
    assert.match(zoom.value, /^\d+$/, "the slider carries a position, never the scale");
});

test("the fitted scale sits at the bottom of the slider and stays reachable", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.avatar.js"] });
    const { ctrl, zoom } = makeAvatar(rt, { naturalWidth: 2800, naturalHeight: 2800 });

    assert.equal(zoom.value, "0");
    assert.equal(ctrl._sliderToScale(0), ctrl._minScale);
    assert.equal(ctrl._sliderToScale(rt.wx.InputAvatarCtrl.ZOOM_RESOLUTION), ctrl._maxScale);
});

test("dragging the slider to the top zooms to the maximum scale", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.avatar.js"] });
    const { ctrl, zoom } = makeAvatar(rt, { naturalWidth: 1920, naturalHeight: 1080 });

    zoom.value = String(rt.wx.InputAvatarCtrl.ZOOM_RESOLUTION);
    zoom.dispatchEvent({ type: "input" });

    assert.equal(ctrl._scale, ctrl._maxScale);
});

test("a scale set by wheel zoom comes back as the same scale through the slider", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.avatar.js"] });
    const { ctrl } = makeAvatar(rt, { naturalWidth: 2100, naturalHeight: 2800 });

    const target = ctrl._minScale + (ctrl._maxScale - ctrl._minScale) * 0.25;
    const roundTrip = ctrl._sliderToScale(ctrl._scaleToSlider(target));

    assert.ok(Math.abs(roundTrip - target) < (ctrl._maxScale - ctrl._minScale) / 1000);
});

// pass-through formats pin min and max to the same scale; the mapping must not
// divide by that empty span
test("a pass-through image without a zoom range still reports a valid position", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.avatar.js"] });
    const { ctrl, zoom } = makeAvatar(rt, { naturalWidth: 2800, naturalHeight: 2800 });

    ctrl._initTransformContain();

    assert.equal(ctrl._minScale, ctrl._maxScale);
    assert.equal(zoom.value, "0");
});
