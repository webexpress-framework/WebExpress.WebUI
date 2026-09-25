import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadWebUi, webuiAsset, keyEvent } from "./harness.mjs";

function runtime(...files) {
    const rt = loadWebUi({ browser: true, extraFiles: files });
    const host = rt.createElement("div");
    rt.document.body.appendChild(host);
    return { ...rt, host };
}

test("read-only chips keep the authored color and action after rendering", () => {
    const rt = runtime("webexpress.webui.selection.js");
    rt.host.dataset.value = "a";
    const option = rt.createElement("div");
    option.id = "a";
    option.className = "wx-selection-item";
    option.dataset.color = "wx-selection-success rounded-pill";
    option.dataset.wxPrimaryAction = "modal";
    option.dataset.wxPrimaryTarget = "#editor";
    option.textContent = "Alpha";
    rt.host.appendChild(option);
    const ctrl = new rt.wx.SelectionCtrl(rt.host);
    const chip = rt.host.querySelector("li");
    assert.ok(chip.classList.contains("wx-chip"));
    assert.ok(chip.classList.contains("wx-selection-success"));
    assert.ok(chip.classList.contains("rounded-pill"));
    assert.equal(chip.dataset.wxPrimaryAction, "modal");
    assert.equal(chip.dataset.wxPrimaryTarget, "#editor");
    ctrl.value = [];
    assert.equal(rt.host.querySelectorAll("li").length, 0);
});

test("date text opens the calendar by click and keyboard without submitting", () => {
    const rt = runtime("webexpress.webui.input.date.js");
    const ctrl = new rt.wx.InputDateCtrl(rt.host);
    ctrl._input.dispatchEvent({ type: "click" });
    assert.equal(ctrl._dropdownmenu.matches(":popover-open"), true);
    ctrl._dropdownmenu.hidePopover();
    const key = keyEvent("ArrowDown");
    ctrl._input.dispatchEvent(key);
    assert.equal(key.defaultPrevented, true);
    assert.equal(ctrl._dropdownmenu.matches(":popover-open"), true);
    ctrl._dropdownmenu.hidePopover();
    ctrl._input.readOnly = true;
    ctrl._input.dispatchEvent({ type: "click" });
    assert.equal(ctrl._dropdownmenu.matches(":popover-open"), false);
});

test("selection keyboard leaves the search field for enabled options and tolerates no matches", () => {
    const rt = runtime("webexpress.webui.input.selection.js");
    const ctrl = new rt.wx.InputSelectionCtrl(rt.host);
    ctrl.options = [{ id: "a", label: "Alpha", content: "Alpha" }, { id: "b", label: "Beta", disabled: true }];
    let focused = false;
    ctrl._dropdownoptions.querySelector("button").focus = options => { focused = options.preventScroll; };
    ctrl._filterInput.dispatchEvent(keyEvent("ArrowDown"));
    assert.equal(focused, true);
    ctrl.options = [];
    assert.doesNotThrow(() => ctrl._filterInput.dispatchEvent(keyEvent("ArrowDown")));
});

test("toolbar more menu resolves its icon to a shipped drawing", () => {
    const rt = runtime("webexpress.webui.dropdown.js", "webexpress.webui.overflow.js", "webexpress.webui.toolbar.js");
    const more = rt.createElement("div");
    more.className = "wx-toolbar-more";
    const item = rt.createElement("div");
    item.className = "wx-dropdown-item";
    item.textContent = "Action";
    more.appendChild(item);
    rt.host.appendChild(more);
    const ctrl = new rt.wx.ToolbarCtrl(rt.host);
    const icon = ctrl._more.querySelector("button i");
    assert.ok(icon.classList.contains("wx-icon-light"));
    assert.match(icon.className, /wx-icon-light-more/);
    ctrl.destroy();
});

test("editor palettes bind the outer menu and close the chosen editor's menu", () => {
    const rt = runtime("editor/formatting.js");
    const plugin = rt.wx.EditorPlugins.getAll().find(p => p._createTextColorDropdown);
    const commands = [];
    const editor = { execCommand: (...args) => commands.push(args) };
    const first = plugin._createTextColorDropdown(editor);
    const second = plugin._createTextColorDropdown(editor);
    rt.host.append(first, second);
    const menu = first.querySelector(".dropdown-menu");
    assert.equal(menu.getAttribute("popover"), "auto");
    assert.equal(first.querySelector("[popovertarget]").getAttribute("popovertarget"), menu.id);
    assert.equal(menu.querySelector("ul").getAttribute("popover"), null);
    assert.notEqual(menu.id, second.querySelector(".dropdown-menu").id);
    menu.showPopover();
    const choice = menu.querySelector("button");
    assert.ok(choice.title);
    choice.dispatchEvent({ type: "click" });
    assert.equal(commands[0][0], "foreColor");
    assert.equal(menu.matches(":popover-open"), false);
});

test("native foundation distinguishes open accordions, growing spinners and the last visible split button", () => {
    const css = fs.readFileSync(webuiAsset("../css/webexpress.webui.css"), "utf8");
    assert.match(css, /\.accordion-item\[open\] > \.accordion-button > \.wx-accordion-caret\s*\{\s*transform: none/);
    assert.match(css, /\.btn-group > \.btn:has\(~ \.btn\)/);
    assert.doesNotMatch(css, /\.btn-group > \.btn:not\(:last-child\)/);
    assert.match(css, /@keyframes wx-spinner-grow[^@]*scale\(0\)[^@]*scale\(1\)/);
    assert.match(css, /\.nav-tabs \.nav-link.active[^}]*background: var\(--wx-body-bg\)[^}]*border-color:/);
});

test("dashboard title and dismiss buttons use readable compact surfaces", () => {
    const dashboard = fs.readFileSync(webuiAsset("../css/webexpress.webui.dashboard.css"), "utf8");
    const button = fs.readFileSync(webuiAsset("../css/webexpress.webui.button.css"), "utf8");
    assert.doesNotMatch(dashboard, /background-color: var\(--wx-body-color\)/);
    assert.match(button, /\.wx-button-close\s*\{[^}]*border: 0; background: transparent/);
    assert.match(button, /\.wx-button-close:hover[^}]*color: var\(--wx-danger\)/);
});


test("manual dates commit on change, reject rollover and notify when cleared", () => {
    const rt = runtime("webexpress.webui.input.date.js");
    rt.host.setAttribute("data-format", "dd.MM.yyyy");
    const ctrl = new rt.wx.InputDateCtrl(rt.host);
    const events = [];
    rt.host.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, event => events.push(event.detail.value));
    ctrl._input.value = "29.2.2024";
    ctrl._input.dispatchEvent({ type: "change" });
    assert.equal(ctrl._input.value, "29.02.2024");
    ctrl._input.value = "29.02.2025";
    ctrl._input.dispatchEvent({ type: "change" });
    assert.equal(ctrl.value.getFullYear(), 2024);
    assert.ok(ctrl._input.classList.contains("is-invalid"));
    ctrl._input.value = "";
    ctrl._input.dispatchEvent({ type: "change" });
    assert.equal(ctrl.value, null);
    assert.deepEqual(events, ["29.02.2024", ""]);
    assert.equal(ctrl._input.validationMessage, "");
    ctrl._input.value = "31.02.2026";
    ctrl._input.dispatchEvent({ type: "input" });
    assert.ok(ctrl._dropdown.classList.contains("is-invalid"));
    ctrl.value = "15.09.2026";
    assert.equal(ctrl._input.validationMessage, "");
    assert.equal(ctrl._dropdown.classList.contains("is-invalid"), false);
});

test("manual ranges preserve incomplete text and normalize reversed complete boundaries", () => {
    const rt = runtime("webexpress.webui.input.date.js");
    rt.host.setAttribute("data-format", "yyyy-MM-dd");
    rt.host.setAttribute("data-range", "true");
    const ctrl = new rt.wx.InputDateCtrl(rt.host);
    ctrl._input.value = "2026-09-20 - 2026-09-14";
    ctrl._input.dispatchEvent({ type: "change" });
    assert.equal(ctrl._input.value, "2026-09-14 - 2026-09-20");
    ctrl._input.value = "2026-09-14 - ";
    ctrl._input.dispatchEvent({ type: "input" });
    assert.ok(ctrl._input.classList.contains("is-invalid"));
    assert.equal(ctrl._input.value, "2026-09-14 - ");
    assert.equal(ctrl.value.end.getDate(), 20);
    ctrl._input.value = "";
    ctrl._input.dispatchEvent({ type: "change" });
    assert.equal(ctrl.value.start, null);
    assert.equal(ctrl.value.end, null);
});

test("suggestions associate their native source with the text input", () => {
    const rt = runtime("webexpress.webui.search.js");
    const suggestion = rt.createElement("div");
    suggestion.className = "wx-search-suggestion";
    suggestion.textContent = "Alpha";
    rt.host.appendChild(suggestion);
    const ctrl = new rt.wx.SearchCtrl(rt.host);
    let source;
    const nativeShow = ctrl._suggestionMenu.showPopover.bind(ctrl._suggestionMenu);
    ctrl._suggestionMenu.showPopover = options => { source = options?.source; nativeShow(); };
    ctrl._searchInput.dispatchEvent({ type: "focus" });
    assert.equal(source === ctrl._searchInput, true);
    assert.equal(ctrl._suggestionMenu.matches(":popover-open"), true);
    assert.equal(ctrl._searchClear.type, "button");
    ctrl._suggestionMenu.hidePopover();
    ctrl._searchInput.dispatchEvent({ type: "pointerdown" });
    ctrl._searchInput.dispatchEvent({ type: "focus" });
    assert.equal(ctrl._suggestionMenu.matches(":popover-open"), false);
    ctrl._searchInput.dispatchEvent({ type: "click" });
    assert.equal(ctrl._suggestionMenu.matches(":popover-open"), true);
});

test("overflow reflow keeps an open menu attached and offers a native nested target", () => {
    const rt = runtime("webexpress.webui.overflow.js");
    const dropdown = rt.createElement("div");
    dropdown.className = "dropdown";
    dropdown.dataset.overflow = "force";
    const trigger = rt.createElement("button");
    trigger.textContent = "Nested";
    const items = rt.createElement("div");
    items.className = "dropdown-menu";
    const action = rt.createElement("button");
    action.className = "dropdown-item";
    action.textContent = "Action";
    items.appendChild(action);
    dropdown.append(trigger, items);
    rt.host.appendChild(dropdown);
    const ctrl = new rt.wx.OverflowCtrl(rt.host);
    ctrl._menu.showPopover();
    const append = rt.host.appendChild.bind(rt.host);
    rt.host.appendChild = node => { if (node === ctrl._menu) { node.hidePopover(); } return append(node); };
    ctrl.reflow();
    assert.equal(ctrl._menu.matches(":popover-open"), true);
    const submenuTrigger = ctrl._menu.querySelector(".wx-overflow-submenu-trigger");
    const submenu = ctrl._menu.querySelector(".wx-overflow-subpanel");
    assert.equal(submenuTrigger.getAttribute("popovertarget"), submenu.id);
    assert.match(ctrl._moreButton.querySelector("i").className, /wx-icon-light-angle-down/);
    assert.match(submenuTrigger.querySelector("i").className, /wx-icon-light-angle-down/);
    ctrl.destroy();
});

test("color hover is stable and slider, canvas and smart-edit surfaces follow theme tokens", () => {
    const sheet = name => fs.readFileSync(webuiAsset("../css/webexpress.webui." + name + ".css"), "utf8");
    assert.doesNotMatch(sheet("color"), /scale\(1\.15\)/);
    assert.match(sheet("slider"), /--wx-slider-track-bg: var\(--wx-secondary-bg\)/);
    assert.match(sheet("slider"), /--wx-slider-label-color: var\(--wx-body-color\)/);
    assert.match(fs.readFileSync(webuiAsset("../css/webexpress.webui.css"), "utf8"), /\.wx-canvas[^}]*var\(--wx-tertiary-bg\)/);
    assert.match(sheet("smartedit"), /wx-smart-edit-save[^}]*var\(--wx-success-text-emphasis\)/);
    assert.match(sheet("smartedit"), /wx-smart-edit-cancel[^}]*var\(--wx-danger-text-emphasis\)/);
    assert.match(sheet("overflow"), /wx-toolbar-button-label[^}]*display: inline !important/);
});

test("manual dates follow the authored culture format and reject trailing text", () => {
    for (const [format, text, normalized] of [["M/d/yyyy", "9/5/2026", "9/5/2026"], ["yyyy-MM-dd", "2026-9-5", "2026-09-05"], ["d.M.yyyy", "5.9.2026", "5.9.2026"]]) {
        const rt = runtime("webexpress.webui.input.date.js");
        rt.host.setAttribute("data-format", format);
        const ctrl = new rt.wx.InputDateCtrl(rt.host);
        ctrl._input.value = text;
        ctrl._input.dispatchEvent({ type: "change" });
        assert.equal(ctrl._input.value, normalized);
        assert.equal(ctrl.value.getMonth(), 8);
        assert.equal(ctrl.value.getDate(), 5);
        ctrl._input.value = text + " extra";
        ctrl._input.dispatchEvent({ type: "change" });
        assert.ok(ctrl._input.validationMessage);
        assert.equal(ctrl.value.getDate(), 5);
    }
});

test("toolbar button descriptors become native non-submitting buttons in overflow", () => {
    const rt = runtime("webexpress.webui.dropdown.js", "webexpress.webui.overflow.js", "webexpress.webui.toolbar.js");
    for (const disabled of [false, true]) {
        const item = rt.createElement("div");
        item.className = "wx-toolbar-button";
        item.dataset.label = disabled ? "Disabled" : "Action";
        item.setAttribute("data-overflow", "force");
        if (disabled) { item.setAttribute("disabled", "disabled"); }
        rt.host.appendChild(item);
    }
    const ctrl = new rt.wx.ToolbarCtrl(rt.host);
    const buttons = ctrl._items.map(item => item.element);
    assert.equal(buttons.every(button => button.tagName === "BUTTON" && button.type === "button"), true);
    assert.equal(buttons[0].querySelector(".wx-toolbar-button-label").textContent, "Action");
    assert.equal(buttons[1].disabled, true);
    ctrl.destroy();
});
