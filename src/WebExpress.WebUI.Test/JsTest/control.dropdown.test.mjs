/**
 * Headless contract test for the DropdownCtrl control (wx-webui-dropdown).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.dropdown.js",
    selector: "wx-webui-dropdown",
    ctrl: "DropdownCtrl"
});
