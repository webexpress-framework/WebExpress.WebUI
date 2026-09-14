import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadWebUi, webuiAsset } from "./harness.mjs";

function setup() {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.selection.js", "webexpress.webui.dropdown.js"] });
    const dialog = rt.createElement("dialog");
    rt.document.body.appendChild(dialog);
    const host = rt.createElement("div");
    dialog.appendChild(host);
    const ctrl = new rt.wx.InputSelectionCtrl(host);
    return { ...rt, dialog, host, ctrl, menu: ctrl._dropdownmenu };
}

test("a selection in a dialog enters the top layer without reading geometry", () => {
    const { wx, host, ctrl, menu } = setup();
    Object.defineProperty(host, "offsetWidth", { get() { throw new Error("menu placement must be CSS"); } });
    assert.equal(menu.getAttribute("popover"), "auto");
    assert.equal(menu.matches(":popover-open"), false);
    wx.NativeMenu.show(menu);
    assert.equal(menu.matches(":popover-open"), true);
    assert.equal(menu.style.width, undefined);
    assert.equal(menu.style.transform, undefined);
    const trigger = host.querySelector("button");
    assert.equal(trigger.getAttribute("popovertarget"), menu.id);
    assert.equal(menu.style.getPropertyValue("position-anchor"), host.children[1].style.getPropertyValue("anchor-name"));
    wx.NativeMenu.hide(menu);
    assert.equal(menu.matches(":popover-open"), false);
});

test("separate menus cannot share an anchor and native dismissal emits the component event once", () => {
    const { wx, document, createElement, host, menu } = setup();
    const other = createElement("div");
    document.body.appendChild(other);
    const second = new wx.InputSelectionCtrl(other);
    assert.notEqual(menu.style.getPropertyValue("position-anchor"), second._dropdownmenu.style.getPropertyValue("position-anchor"));
    let hidden = 0;
    host.addEventListener(wx.Event.DROPDOWN_HIDDEN_EVENT, () => hidden++);
    wx.NativeMenu.show(menu);
    menu.hidePopover();
    wx.NativeMenu.hide(menu);
    assert.equal(hidden, 1);
});

test("native styles defer top-layer removal, flip menus, and snap slides", () => {
    const css = fs.readFileSync(webuiAsset("../css/webexpress.webui.native.css"), "utf8");
    for (const declaration of [/position-area:\s*block-end/, /position-try-fallbacks:\s*flip-block/, /overlay 180ms allow-discrete/, /dialog\.modal::backdrop/, /@starting-style/, /scroll-snap-type:\s*x mandatory/, /scroll-snap-align:\s*start/]) {
        assert.match(css, declaration);
    }
});

test("a tooltip and dropdown on the same button retain independent anchors and targets", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tooltip.js"] });
    const button = rt.createElement("button");
    button.setAttribute("title", "Hint");
    const menu = rt.createElement("div");
    rt.document.body.append(button, menu);
    rt.wx.NativeMenu.bind(button, menu);
    const menuAnchor = menu.style.getPropertyValue("position-anchor");
    const tooltip = new rt.wx.TooltipCtrl(button);
    assert.equal(button.getAttribute("popovertarget"), menu.id);
    assert.ok(button.style.getPropertyValue("anchor-name").split(", ").includes(menuAnchor));
    assert.equal(tooltip._menu.getAttribute("popover"), "hint");
    tooltip.destroy();
});

test("selection options do not submit the containing form", () => {
    const { ctrl, menu } = setup();
    ctrl.options = [{ id: "a", label: "Alpha", content: "Alpha" }];
    const option = ctrl._dropdownmenu.querySelector("li.dropdown-item button");
    assert.ok(option);
    assert.equal(option.type, "button");
});
