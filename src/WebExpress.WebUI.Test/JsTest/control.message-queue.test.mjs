/**
 * Headless contract test for the MessageQueueCtrl control (wx-webui-message-queue).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.message.queue.js",
    selector: "wx-webui-message-queue",
    ctrl: "MessageQueueCtrl"
});
