/**
 * Headless contract and behaviour tests for the FileListCtrl control
 * (wx-webui-file-list). The shared contract (controls.contract.mjs) verifies
 * that the control registers correctly and survives a construct / teardown
 * lifecycle; the tests below cover the data surface a data bound host drives it
 * through - replacing the files and owning the description cell.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.filelist.js",
    selector: "wx-webui-file-list",
    ctrl: "FileListCtrl"
});

/**
 * Loads a runtime with the file list control.
 * @returns {object} The loaded runtime.
 */
function load() {
    return loadWebUi({ browser: true, extraFiles: ["webexpress.webui.filelist.js"] });
}

/**
 * Builds a file list host carrying the entries a server render would produce.
 * @param {object} rt - The loaded runtime.
 * @param {Array<object>} entries - The entries: { name, dataset }.
 * @returns {object} The host element.
 */
function host(rt, entries) {
    const element = rt.createElement("div");

    for (const entry of entries) {
        const file = rt.createElement("div");
        file.classList.add("wx-webui-file");
        file.textContent = entry.name;
        Object.assign(file.dataset, entry.dataset || {});
        element.appendChild(file);
    }

    rt.document.body.appendChild(element);

    return element;
}

test("the entries the server rendered become the files the control holds", () => {
    const rt = load();
    const element = host(rt, [
        { name: "Proposal.pdf", dataset: { fileId: "1", fileUri: "/d/1", fileSize: "2,1 kB", description: "draft" } },
        { name: "Budget.xlsx", dataset: { fileId: "2" } }
    ]);

    const ctrl = new rt.wx.FileListCtrl(element);

    assert.equal(ctrl.files.length, 2);
    assert.deepEqual(
        ctrl.files.map((file) => [file.id, file.name, file.uri, file.size, file.description]),
        [
            ["1", "Proposal.pdf", "/d/1", "2,1 kB", "draft"],
            ["2", "Budget.xlsx", "#", null, null]
        ],
        "the id travels along, so a host can name the file it persists a change for"
    );
});

test("a file that brings its own icon keeps it instead of being typed by its extension", () => {
    const rt = load();
    const element = host(rt, [{ name: "notes.txt", dataset: { fileIcon: "wx-icon-light wx-icon-light-lock" } }]);

    const ctrl = new rt.wx.FileListCtrl(element);

    assert.equal(ctrl.files[0].icon, "wx-icon-light wx-icon-light-lock",
        "a server chosen glyph outranks the one derived from the file name");
});

test("a file that brings a preview image gets no glyph of its own", () => {
    const rt = load();
    const element = host(rt, [{ name: "team.png", dataset: { fileImage: "/img/team.png" } }]);

    const ctrl = new rt.wx.FileListCtrl(element);

    assert.equal(ctrl.files[0].image, "/img/team.png");
    assert.equal(ctrl.files[0].icon, null, "the image is the preview, so no icon is drawn beside it");
});

test("replacing the files redraws the list instead of drawing a second one", () => {
    const rt = load();
    const element = host(rt, [{ name: "Proposal.pdf" }]);

    const ctrl = new rt.wx.FileListCtrl(element);
    ctrl.files = [{ name: "Budget.xlsx" }, { name: "Photo.jpg" }];

    assert.equal(element.querySelectorAll("table").length, 1, "the previous table is gone");
    assert.equal(element.querySelectorAll("tr").length, 2, "the rows are the new files");
    assert.deepEqual(
        element.querySelectorAll("a").map((link) => link.textContent),
        ["Budget.xlsx", "Photo.jpg"]
    );
});

test("the description hook owns the description cell", () => {
    const rt = load();
    const element = host(rt, [{ name: "Proposal.pdf", dataset: { description: "draft" } }]);

    const ctrl = new rt.wx.FileListCtrl(element);
    const seen = [];
    ctrl.descriptionRenderer = (file) => {
        seen.push(file.name);
        const editor = rt.document.createElement("span");
        editor.classList.add("editor");
        return editor;
    };
    ctrl.files = ctrl.files;

    assert.deepEqual(seen, ["Proposal.pdf"]);
    assert.equal(element.querySelectorAll(".editor").length, 1, "the authored cell replaced the plain text");
});

test("the description hook is asked even for a file that has no description yet", () => {
    const rt = load();
    const element = host(rt, [{ name: "Proposal.pdf" }]);

    const ctrl = new rt.wx.FileListCtrl(element);
    ctrl.descriptionRenderer = () => {
        const editor = rt.document.createElement("span");
        editor.classList.add("editor");
        return editor;
    };
    ctrl.files = ctrl.files;

    // without this an inline editor would be unreachable on exactly the files
    // that need one most - the ones nobody has described yet
    assert.equal(element.querySelectorAll(".editor").length, 1);
});

test("a file that has earlier versions is one row with them folded behind it", () => {
    const rt = load();
    const element = host(rt, []);

    const ctrl = new rt.wx.FileListCtrl(element);
    ctrl.files = [{
        name: "TreasureMap.pdf",
        version: 3,
        versions: [{ name: "TreasureMap.pdf", version: 2 }, { name: "TreasureMap.pdf", version: 1 }]
    }];

    // a repeated name has to read as one file, not as three
    assert.equal(element.querySelectorAll("tr").length, 3, "the versions are rows of the same table");

    const folded = element.querySelectorAll("tr.wx-file-version");
    assert.equal(folded.length, 2);
    assert.deepEqual(folded.map((row) => row.style.display), ["none", "none"], "they start folded");
    assert.deepEqual(
        element.querySelectorAll(".wx-file-version-label").map((label) => label.textContent),
        ["v2", "v1"],
        "each folded row says which version it is");
});

test("the version toggle counts the file itself among its versions", () => {
    const rt = load();
    const element = host(rt, []);

    const ctrl = new rt.wx.FileListCtrl(element);
    ctrl.files = [{ name: "TreasureMap.pdf", version: 2, versions: [{ name: "TreasureMap.pdf", version: 1 }] }];

    assert.equal(element.querySelector(".wx-file-version-count").textContent, "2",
        "two versions exist, one of which is the row the toggle sits on");
});

test("pressing the toggle unfolds the earlier versions and folds them again", () => {
    const rt = load();
    const element = host(rt, []);

    const ctrl = new rt.wx.FileListCtrl(element);
    ctrl.files = [{ name: "TreasureMap.pdf", version: 2, versions: [{ name: "TreasureMap.pdf", version: 1 }] }];

    const toggle = element.querySelector(".wx-file-version-toggle");
    const folded = element.querySelector("tr.wx-file-version");

    toggle.click();
    assert.equal(folded.style.display, "", "the earlier version is shown");
    assert.equal(toggle.getAttribute("aria-expanded"), "true");

    toggle.click();
    assert.equal(folded.style.display, "none", "and folded away again");
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
});

test("an earlier version is read rather than edited", () => {
    const rt = load();
    const element = host(rt, []);

    const ctrl = new rt.wx.FileListCtrl(element);
    ctrl.descriptionRenderer = () => {
        const editor = rt.document.createElement("span");
        editor.classList.add("editor");
        return editor;
    };
    ctrl.files = [{
        name: "TreasureMap.pdf",
        version: 2,
        description: "current",
        versions: [{ name: "TreasureMap.pdf", version: 1, description: "what it said before" }]
    }];

    // a past version is a record of what was, so offering an editor on it would
    // promise a change that cannot be made
    assert.equal(element.querySelectorAll(".editor").length, 1, "only the current version gets the editor");
    assert.ok(element.textContent.includes("what it said before"), "the older text is still readable");
});

test("a file without versions is rendered exactly as before", () => {
    const rt = load();
    const element = host(rt, []);

    const ctrl = new rt.wx.FileListCtrl(element);
    ctrl.files = [{ name: "Budget.xlsx" }];

    assert.equal(element.querySelectorAll("tr").length, 1);
    assert.equal(element.querySelectorAll(".wx-file-version-toggle").length, 0,
        "nothing to unfold means no toggle");
});
