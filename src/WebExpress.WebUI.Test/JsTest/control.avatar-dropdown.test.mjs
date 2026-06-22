/**
 * Headless contract test for the AvatarDropdownCtrl control (wx-webui-avatar-dropdown).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.avatar.dropdown.js",
    selector: "wx-webui-avatar-dropdown",
    ctrl: "AvatarDropdownCtrl"
});
