/**
 * Headless contract test for the InputAvatarCtrl control (wx-webui-input-avatar).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.avatar.js",
    selector: "wx-webui-input-avatar",
    ctrl: "InputAvatarCtrl"
});
