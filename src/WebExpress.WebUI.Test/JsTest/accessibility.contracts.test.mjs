/**
 * Headless contract tests for the accessibility of the shared controls: the names,
 * roles and states a reader is given, and the keys a widget answers to without a
 * pointer. The stub neither bubbles events nor moves the focus, so a key event is
 * dispatched on the element that listens for it, with the target set by hand, and a
 * focus move is checked through the roving tabindex rather than activeElement.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";

/**
 * Dispatches a key event on the listening element as if it came from a target inside it.
 */
function key(listener, target, key, extra = {}) {
    const event = { type: "keydown", key, target, altKey: false, ...extra };
    listener.dispatchEvent(event);
    return event;
}

test("a native menu tells its invoker what it opens and whether it is open", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.dropdown.js"] });
    const host = rt.createElement("div");
    host.dataset.label = "Actions";
    rt.document.body.appendChild(host);
    new rt.wx.DropdownCtrl(host);

    const button = host.querySelector("button");
    const menu = host.querySelector("ul");
    assert.equal(host.getAttribute("role"), null, "the host is a plain container, not a second button");
    assert.equal(menu.getAttribute("role"), "menu");
    assert.equal(button.getAttribute("aria-haspopup"), "menu");
    assert.equal(button.getAttribute("aria-expanded"), "false");
    assert.equal(button.getAttribute("aria-controls"), menu.id);

    rt.wx.NativeMenu.show(menu);
    assert.equal(button.getAttribute("aria-expanded"), "true", "opening the menu is announced on the button");
    rt.wx.NativeMenu.hide(menu);
    assert.equal(button.getAttribute("aria-expanded"), "false");
});

test("tabbing out of an open menu closes it, a click on a bare spot inside does not", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.dropdown.js"] });
    const host = rt.createElement("div");
    rt.document.body.appendChild(host);
    new rt.wx.DropdownCtrl(host);
    const menu = host.querySelector("ul");
    const outside = rt.createElement("button");
    rt.document.body.appendChild(outside);

    rt.wx.NativeMenu.show(menu);
    menu.dispatchEvent({ type: "focusout", relatedTarget: null });
    assert.equal(menu.matches(":popover-open"), true, "a null relatedTarget is a click inside, not a departure");
    menu.dispatchEvent({ type: "focusout", relatedTarget: outside });
    assert.equal(menu.matches(":popover-open"), false, "the focus left the menu, so the menu is gone");
});

test("an icon-only dropdown is named by its hover text and its entries are menu items", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.dropdown.js"] });
    const host = rt.createElement("div");
    host.setAttribute("title", "Settings");
    host.dataset.icon = "wx-icon-light wx-icon-light-cog";
    const item = rt.createElement("div");
    item.classList.add("wx-dropdown-item");
    item.dataset.uri = "/settings";
    item.textContent = "General";
    host.appendChild(item);
    rt.document.body.appendChild(host);
    new rt.wx.DropdownCtrl(host);

    const button = host.querySelector("button");
    assert.equal(button.getAttribute("aria-label"), "Settings");
    assert.equal(button.title, "Settings");
    const entry = host.querySelector("a.dropdown-item");
    assert.equal(entry.getAttribute("role"), "menuitem");
    assert.equal(entry.parentNode.getAttribute("role"), "none", "the list item is markup only");
});

test("the tab list is one tab stop and the arrow keys walk and select the tabs", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tab.js"] });
    const host = rt.createElement("div");
    for (const id of ["one", "two", "three"]) {
        const view = rt.createElement("div");
        view.id = id;
        view.classList.add("wx-tab-view");
        view.dataset.label = id;
        host.appendChild(view);
    }
    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.TabCtrl(host);

    const tabs = host.querySelectorAll("[role=\"tab\"]");
    assert.deepEqual(tabs.map(t => t.getAttribute("tabindex")), ["0", "-1", "-1"], "only the selected tab is in the tab order");
    assert.equal(host.querySelector("#two").getAttribute("aria-labelledby"), "two-tab", "a panel is named by its tab");
    assert.equal(host.querySelector("#two").getAttribute("tabindex"), "0", "a panel can be reached even without focusable content");

    key(ctrl._navElement, tabs[0], "ArrowRight");
    assert.equal(tabs[1].getAttribute("aria-selected"), "true", "the arrow key selects the next tab");
    assert.deepEqual(tabs.map(t => t.getAttribute("tabindex")), ["-1", "0", "-1"]);
    key(ctrl._navElement, tabs[1], "End");
    assert.equal(tabs[2].getAttribute("aria-selected"), "true");
    key(ctrl._navElement, tabs[2], "ArrowRight");
    assert.equal(tabs[0].getAttribute("aria-selected"), "true", "the walk wraps around");
});

test("a toolbar in the tab header stands beside the tab list, not inside it", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.overflow.js", "webexpress.webui.dropdown.js", "webexpress.webui.toolbar.js", "webexpress.webui.tab.js"] });
    const host = rt.createElement("div");
    const view = rt.createElement("div");
    view.classList.add("wx-tab-view");
    view.dataset.label = "one";
    host.appendChild(view);
    const toolbar = rt.createElement("div");
    toolbar.classList.add("wx-tab-toolbar");
    host.appendChild(toolbar);
    rt.document.body.appendChild(host);
    new rt.wx.TabCtrl(host);

    const list = host.querySelector("[role=\"tablist\"]");
    assert.equal(list.querySelectorAll("li").length, 1, "the list holds the tabs and nothing else");
    assert.ok(host.querySelector(".wx-tab-tools .wx-tab-toolbar"), "the toolbar sits in the tools zone next to the list");
});

test("the pagination is a named group of buttons with the current page marked", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.pagination.js"] });
    const host = rt.createElement("div");
    host.dataset.page = "2";
    host.dataset.total = "5";
    rt.document.body.appendChild(host);
    new rt.wx.PaginationCtrl(host);

    assert.equal(host.getAttribute("role"), "group", "without a name of its own the switcher is no landmark");
    assert.ok(host.getAttribute("aria-label"), "the group is named");
    assert.ok(host.querySelector("ul.pagination"), "the items sit in a list");
    const buttons = host.querySelectorAll("button.page-link");
    assert.equal(buttons.length, 7, "two ends and five pages, all of them buttons");
    assert.ok(buttons[0].getAttribute("aria-label"), "the icon-only end is named");
    assert.equal(host.querySelector("[aria-current=\"page\"]").textContent, "3");
    assert.equal(host.querySelectorAll("a").length, 0, "no link swallows the activation");
});

test("the tree item is the link itself and the arrow keys walk, open and close it", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tree.js"] });
    const host = rt.createElement("div");
    const parent = rt.createElement("div");
    parent.classList.add("wx-tree-node");
    parent.id = "root";
    parent.dataset.label = "Root";
    const child = rt.createElement("div");
    child.classList.add("wx-tree-node");
    child.id = "leaf";
    child.dataset.label = "Leaf";
    parent.appendChild(child);
    host.appendChild(parent);
    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.TreeCtrl(host);

    const item = host.querySelector("[role=\"treeitem\"]");
    assert.equal(item.tagName, "BUTTON", "the focusable element carries the item role");
    assert.equal(item.parentNode.parentNode.getAttribute("role"), "none", "the list item is markup only");
    assert.equal(item.getAttribute("aria-expanded"), "false");
    assert.equal(item.getAttribute("tabindex"), "0", "the first item is the tab stop");
    assert.equal(host.querySelectorAll("[role=\"treeitem\"]").length, 1, "the closed group keeps its children out of the tree");

    key(ctrl._container, item, "ArrowRight");
    assert.equal(item.getAttribute("aria-expanded"), "true", "the right arrow opens the group");
    const items = host.querySelectorAll("[role=\"treeitem\"]");
    assert.equal(items.length, 2);
    assert.equal(items[1].getAttribute("aria-owns"), null);
    assert.equal(item.getAttribute("aria-owns"), item.closest("li").querySelector("[role=\"group\"]").id, "the item claims the group beside it");

    key(ctrl._container, item, "ArrowDown");
    assert.deepEqual(items.map(i => i.getAttribute("tabindex")), ["-1", "0"], "the tab stop follows the focus");
    key(ctrl._container, items[1], "ArrowLeft");
    assert.equal(items[0].getAttribute("tabindex"), "0", "the left arrow on a leaf returns to its parent");
    key(ctrl._container, items[0], "ArrowLeft");
    assert.equal(items[0].getAttribute("aria-expanded"), "false", "the left arrow on an open group closes it");
});

test("a custom input takes over the label the form rendered for its host id", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.selection.js"] });
    const fieldset = rt.createElement("fieldset");
    const label = rt.createElement("label");
    label.setAttribute("for", "country");
    label.textContent = "Country";
    const host = rt.createElement("div");
    host.id = "country";
    host.setAttribute("aria-describedby", "country_help");
    fieldset.appendChild(label);
    fieldset.appendChild(host);
    rt.document.body.appendChild(fieldset);
    new rt.wx.InputSelectionCtrl(host);

    const trigger = host.querySelector("button.wx-selection-trigger");
    assert.ok(label.id, "the label got an id to be referenced by");
    assert.ok(trigger.getAttribute("aria-labelledby").startsWith(label.id + " "), "the trigger is named by the label first");
    assert.equal(trigger.getAttribute("aria-describedby"), "country_help", "the help text reaches the trigger");
    assert.equal(host.querySelector("ul[role=\"list\"] > li.wx-selection-placeholder") !== null, true, "the placeholder is an entry of the list");
});

test("a tooltip stays readable after the title left the element", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tooltip.js"] });
    const button = rt.createElement("button");
    button.setAttribute("title", "Save the draft");
    rt.document.body.appendChild(button);
    new rt.wx.TooltipCtrl(button);

    const tip = rt.document.body.querySelector(".wx-tooltip");
    assert.equal(button.getAttribute("title"), null, "the native title would double the hint");
    assert.equal(tip.getAttribute("role"), "tooltip");
    assert.equal(button.getAttribute("aria-describedby"), tip.id);
});

test("a choice is a radio group whose arrow keys move the check", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.choice.js"] });
    const host = rt.createElement("div");
    host.id = "size";
    for (const value of ["s", "m", "l"]) {
        const option = rt.createElement("div");
        option.classList.add("wx-choice-option");
        option.dataset.value = value;
        option.textContent = value;
        host.appendChild(option);
    }
    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.InputChoiceCtrl(host);

    const radios = () => host.querySelectorAll("[role=\"radio\"]");
    assert.deepEqual(radios().map(r => r.getAttribute("tabindex")), ["0", "-1", "-1"], "the first option is the tab stop while nothing is checked");
    key(ctrl._list, radios()[0], "ArrowRight");
    assert.equal(ctrl.value, "m", "the arrow key checks the next option");
    assert.deepEqual(radios().map(r => r.getAttribute("tabindex")), ["-1", "0", "-1"], "the checked option is the tab stop");
});

test("a table header sorts from the keyboard and says how it is sorted", async () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.table.js"] });
    const host = rt.createElement("div");
    const columns = rt.createElement("div");
    columns.classList.add("wx-table-columns");
    const column = rt.createElement("div");
    column.dataset.label = "Name";
    columns.appendChild(column);
    host.appendChild(columns);
    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.TableCtrl(host);
    // the table renders in a microtask
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(ctrl._table.getAttribute("role"), "table", "a plain table is read as one");
    const header = host.querySelector(".wx-col-header");
    assert.equal(header.getAttribute("tabindex"), "0");
    assert.equal(header.getAttribute("aria-sort"), "none");
    key(ctrl._head, header, "Enter");
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(host.querySelector(".wx-col-header").getAttribute("aria-sort"), "ascending", "enter sorts like a click");
});

test("a column without a label is still named, by hidden text a header is read from", async () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.table.js"] });
    const host = rt.createElement("div");
    const columns = rt.createElement("div");
    columns.classList.add("wx-table-columns");
    const named = rt.createElement("div");
    named.dataset.label = "Name";
    const bare = rt.createElement("div");
    bare.dataset.icon = "wx-icon-light wx-icon-light-star";
    columns.appendChild(named);
    columns.appendChild(bare);
    host.appendChild(columns);
    rt.document.body.appendChild(host);
    // the dictionary of the page supplies the pattern the position is written into
    rt.wx.I18N.register("en", "webexpress.webui", { "table.column": "Column {n}" });
    new rt.wx.TableCtrl(host);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const headers = host.querySelectorAll(".wx-col-header");
    assert.equal(headers[0].querySelector(".visually-hidden"), null, "a labelled column needs no help");
    const hidden = headers[1].querySelector(".visually-hidden");
    assert.ok(hidden, "the bare column carries a name a reader hears");
    assert.match(hidden.textContent, /2/, "and the name says which column it is");
});

test("a selectable table is a grid of grid cells", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.table.js"] });
    const host = rt.createElement("div");
    host.dataset.selectable = "true";
    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.TableCtrl(host);
    assert.equal(ctrl._table.getAttribute("role"), "grid");
    assert.equal(ctrl._cellRole, "gridcell");
});

test("a kanban card is selected and moved from the keyboard", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.dropdown.js", "webexpress.webui.kanban.js"] });
    const host = rt.createElement("div");
    host.dataset.columns = "todo,done";
    for (const id of ["a", "b"]) {
        const card = rt.createElement("div");
        card.className = "wx-kanban-card";
        Object.assign(card.dataset, { cardId: id, columnId: "todo", label: id.toUpperCase() });
        host.appendChild(card);
    }
    rt.document.body.appendChild(host);
    new rt.wx.KanbanCtrl(host);

    const cardOf = (id) => host.querySelectorAll(".wx-kanban-card").find((el) => el.dataset.cardId === id);
    const card = cardOf("a");
    assert.equal(card.getAttribute("tabindex"), "0");
    assert.equal(card.getAttribute("role"), "button");
    card.dispatchEvent({ type: "keydown", key: " ", target: card, altKey: false });
    assert.equal(cardOf("a").getAttribute("aria-pressed"), "true", "space selects the card");

    const moved = [];
    host.addEventListener(rt.wx.Event.MOVE_EVENT, (e) => moved.push(e.detail));
    const fresh = cardOf("a");
    fresh.dispatchEvent({ type: "keydown", key: "ArrowRight", target: fresh, altKey: true });
    assert.equal(moved.length, 1);
    assert.equal(moved[0].columnId, "done", "alt with the right arrow moves the card to the next column");
});

test("the split separator is a separator that moves with the arrow keys", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.split.js"] });
    const host = rt.createElement("div");
    host.dataset.orientation = "horizontal";
    host.dataset.sideInitial = "200";
    const side = rt.createElement("div");
    side.classList.add("wx-side-pane");
    const main = rt.createElement("div");
    main.classList.add("wx-main-pane");
    host.appendChild(side);
    host.appendChild(main);
    rt.document.body.appendChild(host);
    Object.defineProperty(host, "clientWidth", { get: () => 1000 });
    const ctrl = new rt.wx.SplitCtrl(host);

    const splitter = ctrl._splitter;
    assert.equal(splitter.getAttribute("role"), "separator");
    assert.equal(splitter.getAttribute("tabindex"), "0");
    assert.ok(splitter.getAttribute("title"), "named through the title, which keeps it out of the landmark-coverage count");
    const before = ctrl._sideSize;
    const valueBefore = Number(splitter.getAttribute("aria-valuenow"));
    assert.equal(splitter.getAttribute("aria-valuemax"), "100", "a focusable separator reports its position as a percentage");
    splitter.dispatchEvent({ type: "keydown", key: "ArrowRight", target: splitter });
    assert.ok(ctrl._sideSize > before, "the right arrow widens the side pane");
    assert.ok(Number(splitter.getAttribute("aria-valuenow")) > valueBefore, "the reported position follows the move");
});

test("a value display is a picture with a spelled out label, not a read-only input", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.rating.js"] });
    const host = rt.createElement("div");
    host.dataset.value = "3";
    rt.document.body.appendChild(host);
    new rt.wx.RatingCtrl(host);
    assert.equal(host.getAttribute("role"), "img");
    assert.equal(host.getAttribute("aria-readonly"), null, "read-only belongs to inputs only");
    assert.ok(host.getAttribute("aria-label").includes("3"));
});

test("a tag is removed by a button, not by a link to nowhere", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.tag.js"] });
    const host = rt.createElement("div");
    host.setAttribute("data-value", "alpha;beta");
    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.InputTagCtrl(host);

    const remove = ctrl._list.querySelector(".wx-tag-remove");
    assert.equal(remove.tagName, "BUTTON", "an action is a button");
    assert.equal(remove.type, "button", "and never submits the form around it");
    assert.equal(remove.getAttribute("href"), null);
    assert.ok(remove.getAttribute("aria-label").includes("alpha"), "the name says which tag goes");
});

test("an author-chosen fill gets the text color that reads on it, unless the author chose one", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tag.js"] });
    const C = rt.wx.ContrastColor;
    assert.equal(C.on("#ffd700"), "#000", "gold takes black");
    assert.equal(C.on("#1a237e"), "#fff", "navy takes white");
    assert.equal(C.on("rgb(25, 135, 84)"), "#000");
    assert.equal(C.on("no-such-color"), null, "a color nobody can read is left alone");

    const el = rt.createElement("span");
    C.paint(el, "background: #ffd700;");
    assert.equal(el.style.color, "#000", "the fill is answered with the text that reads on it");
    const own = rt.createElement("span");
    C.paint(own, "background: #ffd700; color: red;");
    // the stub does not unpack cssText into properties, so the check is that paint stayed out
    assert.notEqual(own.style.color, "#000", "an author who chose the text color keeps it");
});
