/**
 * Behavioural tests for the tile picker answering a required single choice by itself
 * when the bound filter leaves exactly one tile to choose from, and taking that answer
 * back when the choice reopens.
 *
 * The DOM stub dispatches events directly rather than propagating them, so the change
 * event a bound write raises on its target is re-dispatched on the form where a real
 * browser would have bubbled it.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the runtime with the picker under test.
 * @returns {object} The runtime.
 */
function load() {
    return loadWebUi({
        extraFiles: ["webexpress.webui.input.tile.js"]
    });
}

/**
 * Builds a form holding a class picker and a template picker narrowed by it. The
 * template picker offers a "no template" card that is always visible, one template
 * for the first class and none for the second.
 * @param {object} rt - The runtime.
 * @param {object} options - `required` marks the template picker as required.
 * @returns {object} The parts of the form the tests assert against.
 */
function buildForm(rt, options = {}) {
    const form = rt.createElement("form");
    rt.document.body.appendChild(form);

    const classes = rt.createElement("div");
    classes.classList.add("wx-webui-input-tile");
    classes.setAttribute("name", "ClassId");
    form.appendChild(classes);

    for (const [id, label] of [["cls-incident", "Incident"], ["cls-request", "Request"]]) {
        const card = rt.createElement("div");
        card.classList.add("wx-tile-card");
        card.id = id;
        card.dataset.label = label;
        classes.appendChild(card);
    }

    const templates = rt.createElement("div");
    templates.classList.add("wx-webui-input-tile");
    templates.setAttribute("name", "TemplateId");
    templates.dataset.filterSource = "ClassId";
    if (options.required !== false) {
        templates.dataset.required = "true";
    }
    form.appendChild(templates);

    const none = rt.createElement("div");
    none.classList.add("wx-tile-card");
    none.id = "none";
    none.dataset.label = "No template";
    none.dataset.alwaysVisible = "true";
    templates.appendChild(none);

    const outage = rt.createElement("div");
    outage.classList.add("wx-tile-card");
    outage.id = "tpl-outage";
    outage.dataset.label = "Report outage";
    outage.dataset.filterValue = "cls-incident";
    templates.appendChild(outage);

    rt.wx.Controller.createInstances(form);

    return {
        form,
        classes: rt.wx.Controller.getInstanceByElement(classes),
        templates: rt.wx.Controller.getInstanceByElement(templates)
    };
}

/**
 * Re-dispatches a change event on the form, standing in for the bubbling the DOM stub
 * does not perform.
 * @param {object} form - The form element.
 */
function settle(form) {
    form.dispatchEvent({ type: "change" });
}

test("a required picker left with one tile selects it", () => {
    const rt = load();
    const parts = buildForm(rt);

    assert.equal(parts.templates.value, "", "nothing is chosen while both templates are offered");

    parts.classes.value = "cls-request";
    settle(parts.form);

    assert.equal(parts.templates.value, "none", "the only tile left is the answer");
    assert.equal(parts.templates._hidden.value, "none", "and it is what the form submits");
});

test("the automatic answer is taken back when the choice reopens", () => {
    const rt = load();
    const parts = buildForm(rt);

    parts.classes.value = "cls-request";
    settle(parts.form);
    assert.equal(parts.templates.value, "none");

    parts.classes.value = "cls-incident";
    settle(parts.form);

    assert.equal(parts.templates.value, "", "two tiles are a question again, and the picker does not answer it");
});

test("a choice the user made stays when the filter changes around it", () => {
    const rt = load();
    const parts = buildForm(rt);

    parts.templates.value = "none";

    parts.classes.value = "cls-request";
    settle(parts.form);
    parts.classes.value = "cls-incident";
    settle(parts.form);

    assert.equal(parts.templates.value, "none", "the user's own choice survives the reopened list");
});

test("a picker that is not required leaves the sole tile unselected", () => {
    const rt = load();
    const parts = buildForm(rt, { required: false });

    parts.classes.value = "cls-request";
    settle(parts.form);

    assert.equal(parts.templates.value, "", "nothing is a legitimate answer where nothing is demanded");
});

test("a search that narrows the list to one tile does not select it", () => {
    const rt = load();
    const parts = buildForm(rt);

    parts.templates._searchTerm = "outage";
    parts.templates.render();

    assert.equal(parts.templates.value, "", "looking is not deciding");
});
