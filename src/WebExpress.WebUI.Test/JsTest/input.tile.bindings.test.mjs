/**
 * Behavioural tests for the tile picker: the values a selected tile projects into
 * the surrounding form, and the narrowing of a second control to the choice made
 * in a first one.
 *
 * The DOM stub dispatches events directly rather than propagating them, so the
 * change event a bound write raises on its target is re-dispatched on the form
 * where a real browser would have bubbled it.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the runtime with both controls under test.
 * @returns {object} The runtime.
 */
function load() {
    return loadWebUi({
        extraFiles: ["webexpress.webui.input.tile.js", "webexpress.webui.input.choice.js"]
    });
}

/**
 * Builds a form holding a workspace picker, a template picker bound to it, a
 * hidden class input, a note, and a priority choice narrowed by the class.
 * @param {object} rt - The runtime.
 * @returns {object} The parts of the form the tests assert against.
 */
function buildForm(rt) {
    const form = rt.createElement("form");
    rt.document.body.appendChild(form);

    const workspaces = rt.createElement("div");
    workspaces.classList.add("wx-webui-input-tile");
    workspaces.setAttribute("name", "WorkspaceId");
    form.appendChild(workspaces);

    for (const [id, label] of [["ws-1", "Service Desk"], ["ws-2", "Development"]]) {
        const card = rt.createElement("div");
        card.classList.add("wx-tile-card");
        card.id = id;
        card.dataset.label = label;
        workspaces.appendChild(card);
    }

    const templates = rt.createElement("div");
    templates.classList.add("wx-webui-input-tile");
    templates.setAttribute("name", "Blueprint");
    templates.dataset.filterSource = "WorkspaceId";
    form.appendChild(templates);

    // the escape hatch: no workspace of its own and never searched for, yet it has
    // to stay offered in every state of the list
    const none = rt.createElement("div");
    none.classList.add("wx-tile-card");
    none.id = "none";
    none.dataset.label = "No template";
    none.dataset.alwaysVisible = "true";
    none.dataset.wxBindClassid = "";
    none.dataset.wxBindPriority = "";
    none.dataset.wxBindNote = "";
    templates.appendChild(none);

    const cards = [
        { id: "tpl-1", label: "Report outage", ws: "ws-1", cls: "cls-incident", prio: "P1", note: "Two more fields." },
        { id: "tpl-2", label: "Request hardware", ws: "ws-1", cls: "cls-request", prio: "", note: "" },
        { id: "tpl-3", label: "Report a bug", ws: "ws-2", cls: "cls-bug", prio: "Major", note: "One more field." }
    ];

    for (const c of cards) {
        const card = rt.createElement("div");
        card.classList.add("wx-tile-card");
        card.id = c.id;
        card.dataset.label = c.label;
        card.dataset.filterValue = c.ws;
        card.dataset.wxBindClassid = c.cls;
        card.dataset.wxBindPriority = c.prio;
        card.dataset.wxBindNote = c.note;
        templates.appendChild(card);
    }

    const classId = rt.createElement("input");
    classId.setAttribute("name", "ClassId");
    classId.type = "hidden";
    form.appendChild(classId);

    const note = rt.createElement("div");
    note.setAttribute("data-wx-bind-visible", "note");
    note.style.display = "none";
    form.appendChild(note);

    const noteText = rt.createElement("span");
    noteText.setAttribute("data-wx-bind-text", "note");
    note.appendChild(noteText);

    const priority = rt.createElement("div");
    priority.classList.add("wx-webui-input-choice");
    priority.setAttribute("name", "Priority");
    priority.dataset.filterSource = "ClassId";
    form.appendChild(priority);

    for (const [value, cls] of [["P1", "cls-incident"], ["P2", "cls-incident"], ["Major", "cls-bug"], ["Minor", "cls-bug"]]) {
        const option = rt.createElement("div");
        option.classList.add("wx-choice-option");
        option.dataset.value = value;
        option.dataset.filterValue = cls;
        option.appendChild(rt.document.createTextNode(value));
        priority.appendChild(option);
    }

    rt.wx.Controller.createInstances(form);

    return {
        form,
        workspaces: rt.wx.Controller.getInstanceByElement(workspaces),
        templates: rt.wx.Controller.getInstanceByElement(templates),
        priority: rt.wx.Controller.getInstanceByElement(priority),
        classId,
        note,
        noteText
    };
}

/**
 * Re-dispatches a change event on the form, standing in for the bubbling the
 * DOM stub does not perform.
 * @param {object} form - The form element.
 */
function settle(form) {
    form.dispatchEvent({ type: "change" });
}

test("a selected tile writes its bound values into the form", () => {
    const rt = load();
    const parts = buildForm(rt);

    parts.templates.value = "tpl-1";

    assert.equal(parts.classId.value, "cls-incident", "the bound class reaches the hidden input");
    assert.equal(parts.noteText.textContent, "Two more fields.", "the bound note reaches the text target");
    assert.notEqual(parts.note.style.display, "none", "the note is shown while it carries a value");
});

test("the selected tile is marked and the marking moves with the selection", () => {
    const rt = load();
    const parts = buildForm(rt);

    const cardOf = (id) => parts.templates._element
        .querySelectorAll(".wx-tile-card")
        .find((card) => card.dataset.tileId === id);

    parts.templates.value = "tpl-1";

    let chosen = cardOf("tpl-1");
    assert.ok(chosen.classList.contains("wx-tile-card-selected"), "the chosen card carries the selected class");
    assert.equal(chosen.getAttribute("aria-selected"), "true", "and reports the state to assistive technology");
    assert.ok(chosen.querySelector(".wx-tile-card-check"), "and shows the check badge");

    parts.templates.value = "tpl-2";

    assert.ok(!cardOf("tpl-1").classList.contains("wx-tile-card-selected"), "the previous card is no longer marked");
    assert.equal(cardOf("tpl-1").querySelector(".wx-tile-card-check"), null, "and loses its check badge");
    assert.ok(cardOf("tpl-2").querySelector(".wx-tile-card-check"), "while the new one gains it");
});

test("selecting a tile without a note clears the values of the previous one", () => {
    const rt = load();
    const parts = buildForm(rt);

    parts.templates.value = "tpl-1";
    parts.templates.value = "tpl-2";

    assert.equal(parts.classId.value, "cls-request", "the class follows the new selection");
    assert.equal(parts.noteText.textContent, "", "the note of the previous tile is gone");
    assert.equal(parts.note.style.display, "none", "the note is hidden again");
});

/**
 * Returns the ids of the tiles the picker currently shows.
 * @param {object} picker - The picker controller.
 * @returns {string[]} The visible tile ids.
 */
function visibleTiles(picker) {
    return picker._element.querySelectorAll(".wx-tile-card").map((card) => card.dataset.tileId);
}

test("the second picker shows only the tiles of the workspace chosen in the first", () => {
    const rt = load();
    const parts = buildForm(rt);

    parts.workspaces.value = "ws-1";
    settle(parts.form);

    assert.deepEqual(
        visibleTiles(parts.templates),
        ["none", "tpl-1", "tpl-2"],
        "only the templates of the workspace remain, next to the always visible entry"
    );
});

test("the always visible tile survives the filter and the search", () => {
    const rt = load();
    const parts = buildForm(rt);

    assert.ok(visibleTiles(parts.templates).includes("none"), "it is there unfiltered");

    parts.workspaces.value = "ws-2";
    settle(parts.form);
    assert.ok(visibleTiles(parts.templates).includes("none"), "it survives the bound filter");

    parts.templates._searchTerm = "nothing matches this";
    parts.templates.render();

    assert.deepEqual(
        visibleTiles(parts.templates),
        ["none"],
        "and it is what is left when the search matches nothing else"
    );
});

test("the always visible tile can be chosen and clears what a template had projected", () => {
    const rt = load();
    const parts = buildForm(rt);

    parts.workspaces.value = "ws-1";
    settle(parts.form);

    parts.templates.value = "tpl-1";
    settle(parts.form);
    assert.equal(parts.classId.value, "cls-incident");
    assert.equal(parts.priority.value, "P1");

    parts.templates.value = "none";
    settle(parts.form);

    assert.equal(parts.templates.value, "none", "the entry is selectable");
    assert.equal(parts.classId.value, "", "and clears the values of the template before it");
    assert.equal(parts.noteText.textContent, "", "including its note");
});

test("a template selection that no longer fits the workspace is dropped", () => {
    const rt = load();
    const parts = buildForm(rt);

    parts.templates.value = "tpl-3";
    assert.equal(parts.templates.value, "tpl-3");

    parts.workspaces.value = "ws-1";
    settle(parts.form);

    assert.equal(parts.templates.value, "", "the selection outside the filter is cleared");
    assert.equal(parts.classId.value, "", "and so are the values it had projected");
});

test("the priority narrows to the class of the template and takes its preset", () => {
    const rt = load();
    const parts = buildForm(rt);

    parts.templates.value = "tpl-1";
    settle(parts.form);

    const offered = parts.priority._element
        .querySelectorAll(".wx-choice-option")
        .map((option) => option.dataset.value);

    assert.deepEqual(offered, ["P1", "P2"], "only the priorities of the class are offered");
    assert.equal(parts.priority.value, "P1", "the preset of the template is selected");
});

test("a priority that the new class does not offer is not carried over", () => {
    const rt = load();
    const parts = buildForm(rt);

    parts.templates.value = "tpl-1";
    settle(parts.form);
    assert.equal(parts.priority.value, "P1");

    parts.templates.value = "tpl-3";
    settle(parts.form);

    assert.equal(parts.priority.value, "Major", "the preset of the new template wins");

    const offered = parts.priority._element
        .querySelectorAll(".wx-choice-option")
        .map((option) => option.dataset.value);

    assert.deepEqual(offered, ["Major", "Minor"], "and the options follow the new class");
});
