/**
 * Headless contract test for the AvatarCtrl control (wx-webui-avatar).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.avatar.js",
    selector: "wx-webui-avatar",
    ctrl: "AvatarCtrl"
});
