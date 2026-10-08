import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";

function runtime(files = [], storage) {
    return loadWebUi({
        browser: true,
        extraFiles: files,
        globals: { requestAnimationFrame: callback => callback(), ...(storage ? { localStorage: storage } : {}) }
    });
}

function host(rt, id, children = [], childClass) {
    const element = rt.createElement("div");
    element.id = id;
    for (const id of children) {
        const child = rt.createElement("div");
        child.id = id;
        child.className = childClass;
        child.textContent = id;
        element.appendChild(child);
    }
    rt.document.body.appendChild(element);
    return element;
}

test("dark mode survives a fresh runtime without writing cookies", () => {
    const first = runtime();
    first.document.cookie = "session=keep";
    first.wx.DarkMode.current = "dark";
    assert.equal(first.sandbox.localStorage.getItem("wx_darkmode"), "dark");
    assert.equal(first.document.cookie, "session=keep");
    const next = runtime([], first.sandbox.localStorage);
    assert.equal(next.wx.DarkMode.current, "dark");
    assert.equal(next.document.documentElement.getAttribute("data-wx-theme"), "dark");
});

test("unavailable and full storage leave UI interactions usable", () => {
    const unavailable = { getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("QuotaExceededError"); } };
    const rt = runtime([], unavailable);
    assert.doesNotThrow(() => { rt.wx.DarkMode.current = "dark"; });
    assert.equal(rt.document.documentElement.getAttribute("data-wx-theme"), "dark");
    assert.equal(rt.wx.LocalStorage.getJson("broken"), null);
    Object.defineProperty(rt.sandbox, "localStorage", { get() { throw new Error("SecurityError"); } });
    assert.equal(rt.wx.LocalStorage.getItem("denied"), null);
    assert.doesNotThrow(() => rt.wx.LocalStorage.setJson("denied", { expanded: true }));
    assert.equal(rt.document.cookie, "");
});

test("malformed preferences fall back and anonymous controls do not create a shared key", () => {
    const rt = runtime();
    rt.sandbox.localStorage.setItem("broken", "{");
    rt.sandbox.localStorage.setItem("wx_darkmode", "invalid");
    assert.equal(rt.wx.LocalStorage.getJson("broken"), null);
    assert.equal(runtime([], rt.sandbox.localStorage).wx.DarkMode.current, "light");
    rt.wx.LocalStorage.setItem(null, "value");
    assert.equal(rt.sandbox.localStorage.getItem("null"), null);
});

test("quickfilters persist JSON identifiers and validate them against registered filters", async () => {
    const rt = runtime();
    const filters = [{ id: "mine,100%" }, { id: "closed" }, { id: "reset", reset: true }];
    rt.wx.FilterRegistry.registerFilters(filters);
    rt.wx.FilterRegistry.activate("mine,100%");
    await new Promise(resolve => setTimeout(resolve, 330));
    assert.deepEqual(JSON.parse(rt.sandbox.localStorage.getItem("wx_quickfilters")), ["mine,100%"]);
    const next = runtime([], rt.sandbox.localStorage);
    next.wx.FilterRegistry.registerFilters(filters);
    next.wx.FilterRegistry.init();
    assert.deepEqual(Array.from(next.wx.FilterRegistry.getActiveFilters()), ["mine,100%"]);
    assert.equal(next.document.cookie, "");
    const invalid = runtime();
    invalid.wx.LocalStorage.setJson("wx_quickfilters", ["missing", "closed", "reset", null, 5]);
    invalid.wx.FilterRegistry.registerFilters(filters);
    invalid.wx.FilterRegistry.init();
    assert.deepEqual(Array.from(invalid.wx.FilterRegistry.getActiveFilters()), ["closed"]);
});

test("views restore a valid index and ignore removed or malformed views", () => {
    const files = ["webexpress.webui.view.switcher.js", "webexpress.webui.view.js"];
    const create = rt => {
        const element = host(rt, "work", ["one", "two"], "wx-view");
        element.dataset.layout = "togglegroup";
        return new rt.wx.ViewCtrl(element);
    };
    const first = runtime(files);
    create(first).switchView(1);
    assert.equal(first.sandbox.localStorage.getItem("wx_view_state_work"), "1");
    const next = runtime(files, first.sandbox.localStorage);
    const view = create(next);
    assert.equal(view._activeViewIndex, 1);
    assert.equal(view._viewsConfig[1].container.classList.contains("d-none"), false);
    assert.equal(next.document.cookie, "");
    for (const value of ["7", "1broken", "-1", "1.5"]) {
        next.sandbox.localStorage.setItem("wx_view_state_work", value);
        assert.equal(create(next)._activeViewIndex, 0);
    }
});

test("tabs remember selection by identity and fall back when that tab disappears", () => {
    const files = ["webexpress.webui.tab.js"];
    const first = runtime(files);
    new first.wx.TabCtrl(host(first, "tabs", ["one", "two"], "wx-tab-view")).selectTab("two");
    assert.equal(first.sandbox.localStorage.getItem("wx-tab:tabs"), "two");
    const next = runtime(files, first.sandbox.localStorage);
    const ctrl = new next.wx.TabCtrl(host(next, "tabs", ["two", "one"], "wx-tab-view"));
    assert.equal(ctrl._activeTabId, "two");
    assert.equal(ctrl._tabs[0].paneElement.classList.contains("active"), true);
    ctrl.selectTab("missing");
    assert.equal(ctrl._activeTabId, "two");
    assert.equal(new next.wx.TabCtrl(host(next, "tabs", ["one"], "wx-tab-view"))._activeTabId, "one");
});

test("calendar views survive reload and respect the configured list of available views", () => {
    const files = ["webexpress.webui.schedule.js"];
    const first = runtime(files);
    const ctrl = new first.wx.ScheduleCtrl(host(first, "calendar"));
    ctrl.view = "week";
    const next = runtime(files, first.sandbox.localStorage);
    assert.equal(new next.wx.ScheduleCtrl(host(next, "calendar")).view, "week");
    const limited = host(next, "calendar");
    limited.dataset.views = "month,agenda";
    limited.dataset.view = "agenda";
    assert.equal(new next.wx.ScheduleCtrl(limited).view, "agenda");
    assert.equal(next.document.cookie, "");
});

test("list order restores literal identifiers and appends newly introduced items", () => {
    const files = ["webexpress.webui.list.js"];
    const first = runtime(files);
    const list = new first.wx.ListCtrl(host(first, "list", ["100%", "two"], "wx-list-item"));
    list.setItems([{ id: "two", content: "Two" }, { id: "100%", content: "Percent" }]);
    list._persistState();
    const next = runtime(files, first.sandbox.localStorage);
    const restored = new next.wx.ListCtrl(host(next, "list", ["100%", "new", "two"], "wx-list-item"));
    assert.deepEqual(Array.from(restored._items, item => item.id), ["two", "100%", "new"]);
    assert.equal(next.document.cookie, "");
});

test("tile order and visibility survive reload without URI encoding", () => {
    const files = ["webexpress.webui.tile.js"];
    const first = runtime(files);
    const element = host(first, "tiles", ["100%", "two"], "wx-tile-card");
    element.dataset.allowRemove = "true";
    const tiles = new first.wx.TileCtrl(element);
    tiles.hideTile("100%");
    tiles._tiles.reverse();
    tiles._persist();
    const next = runtime(files, first.sandbox.localStorage);
    const restored = new next.wx.TileCtrl(host(next, "tiles", ["100%", "two", "new"], "wx-tile-card"));
    assert.deepEqual(Array.from(restored._tiles, tile => tile.id), ["two", "100%", "new"]);
    assert.deepEqual(Array.from(restored.getVisibleTiles(), tile => tile.id), ["two", "new"]);
    assert.equal(next.document.cookie, "");
});

test("table preferences restore columns with their cells and survive another visit", () => {
    const files = ["webexpress.webui.table.js", "webexpress.webui.table.reorderable.js"];
    const build = rt => {
        const element = host(rt, "table");
        const columns = host(rt, "columns", ["a", "b"], "");
        columns.className = "wx-table-columns";
        element.appendChild(columns);
        const row = host(rt, "row", ["value-a", "value-b"], "");
        row.className = "wx-table-row";
        element.appendChild(row);
        const footer = host(rt, "footer", ["total-a", "total-b"], "");
        footer.className = "wx-table-footer";
        element.appendChild(footer);
        return new rt.wx.TableReorderableCtrl(element);
    };
    const first = runtime(files);
    first.wx.LocalStorage.setJson("table", {
        v: 1, order: ["b", "b", "removed", "a"],
        cols: [{ id: "b", width: "250", visible: true }, { id: "a", visible: false }],
        sort: { id: "b", dir: "desc" }, tree: { collapsed: [] }
    });
    const table = build(first);
    assert.deepEqual(Array.from(table._columns, col => col.id), ["b", "a"]);
    assert.deepEqual(Array.from(table._rows[0].cells, cell => cell.content), ["value-b", "value-a"]);
    assert.deepEqual(Array.from(table._footer), ["total-b", "total-a"]);
    assert.equal(table._columns[0].width, 250);
    assert.equal(table._columns[1].visible, false);
    assert.equal(table._columns[0].sort, "desc");
    table._persistState();
    const next = runtime(files, first.sandbox.localStorage);
    assert.deepEqual(Array.from(build(next)._columns, col => col.id), ["b", "a"]);
    assert.equal(next.document.cookie, "");
});
