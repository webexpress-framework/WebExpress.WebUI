/**
 * Headless contract test for the InputDomainCtrl control (wx-webui-input-domain).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * On top of it the composition is pinned: the domain picked and the user name
 * typed make one account in the notation the server expects (DomainLogon.cs).
 */
import { test } from "node:test";
import assert from "node:assert";
import { contract } from "./controls.contract.mjs";
import { loadWebUi } from "./harness.mjs";

contract({
    file: "webexpress.webui.input.domain.js",
    selector: "wx-webui-input-domain",
    ctrl: "InputDomainCtrl"
});

function load() {
    return loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.domain.js"] });
}

function host(rt, attributes, domains = []) {
    const element = rt.createElement("div");
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    for (const domain of domains) {
        const child = rt.createElement("div");
        child.setAttribute("id", domain);
        child.setAttribute("data-label", domain);
        child.classList.add("wx-selection-item");
        element.appendChild(child);
    }
    rt.document.body.appendChild(element);
    return element;
}

function type(ctrl, text) {
    ctrl._user.value = text;
    ctrl._user.dispatchEvent({ type: "input" });
}

test("the domain picked and the user typed make one account, once", () => {
    const rt = load();
    const element = host(rt, { id: "acc", name: "acc", "data-domain": "FABRIKAM" }, ["CONTOSO", "FABRIKAM"]);
    const ctrl = new rt.wx.InputDomainCtrl(element);
    const announced = [];
    element.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, (e) => announced.push(e.detail.value));

    type(ctrl, "jdoe");
    ctrl.value = "FABRIKAM\\jdoe";

    assert.equal(ctrl.domain, "FABRIKAM");
    assert.equal(ctrl._hidden.value, "FABRIKAM\\jdoe");
    assert.equal(ctrl._hidden.name, "acc");
    assert.deepEqual(announced, ["FABRIKAM\\jdoe"], "writing back the value announces nothing");
});

test("a domain with a dot makes a principal name unless the notation is fixed", () => {
    const rt = load();

    const free = new rt.wx.InputDomainCtrl(host(rt, {}, ["contoso.com"]));
    type(free, "jdoe");
    assert.equal(free.value, "jdoe@contoso.com");

    const fixed = new rt.wx.InputDomainCtrl(host(rt, { "data-format": "downlevel" }, ["contoso.com"]));
    type(fixed, "jdoe");
    assert.equal(fixed.value, "contoso.com\\jdoe");
});

test("an account typed in full selects its domain where it is offered", () => {
    const rt = load();
    const ctrl = new rt.wx.InputDomainCtrl(host(rt, {}, ["CONTOSO", "FABRIKAM"]));

    type(ctrl, "fabrikam\\jdoe");

    assert.equal(ctrl.domain, "FABRIKAM", "the domain is taken in the spelling of the offer");
    assert.equal(ctrl._user.value, "jdoe");
    assert.equal(ctrl.value, "FABRIKAM\\jdoe");
});

test("an account of a domain not offered keeps its domain and is refused", () => {
    const rt = load();
    const ctrl = new rt.wx.InputDomainCtrl(host(rt, {}, ["CONTOSO"]));

    type(ctrl, "OTHER\\jdoe");

    assert.equal(ctrl.value, "OTHER\\jdoe", "it is not moved into the chosen domain");
    assert.equal(ctrl.validate().length, 1);
});

test("an account given in full keeps its notation", () => {
    const rt = load();

    const downLevel = new rt.wx.InputDomainCtrl(host(rt, { "data-value": "example.com\\alice" }, ["example.com"]));
    assert.equal(downLevel.value, "example.com\\alice", "a dotted domain does not turn it into a principal name");

    const principal = new rt.wx.InputDomainCtrl(host(rt, { "data-value": "abcdefghijklmnopqrstu@CONTOSO" }, ["CONTOSO"]));
    assert.equal(principal.value, "abcdefghijklmnopqrstu@CONTOSO", "a name too long for a logon name stays a principal name");
    assert.deepEqual(principal.validate(), []);

    type(principal, "bob");
    assert.equal(principal.value, "bob@CONTOSO", "editing the user keeps the notation");

    const typed = new rt.wx.InputDomainCtrl(host(rt, {}, ["example.com"]));
    type(typed, "example.com\\alice");
    assert.equal(typed.value, "example.com\\alice", "an account typed in full keeps its notation too");
});

test("a domain picked anew is written the way that domain asks for", () => {
    const rt = load();
    const ctrl = new rt.wx.InputDomainCtrl(host(rt, { "data-value": "example.com\\alice" }, ["example.com", "CONTOSO"]));

    ctrl.domain = "CONTOSO";
    assert.equal(ctrl.value, "CONTOSO\\alice");

    ctrl.domain = "example.com";
    assert.equal(ctrl.value, "alice@example.com");
});

test("choosing another domain keeps the user name", () => {
    const rt = load();
    const ctrl = new rt.wx.InputDomainCtrl(host(rt, { "data-value": "CONTOSO\\jdoe" }, ["CONTOSO", "FABRIKAM"]));

    ctrl.domain = "fabrikam";

    assert.equal(ctrl.value, "FABRIKAM\\jdoe");
    assert.equal(ctrl._triggerLabel.textContent, "FABRIKAM");
});

test("without domains the field takes the whole account as text", () => {
    const rt = load();
    const ctrl = new rt.wx.InputDomainCtrl(host(rt, {}));

    assert.equal(ctrl._trigger, undefined, "there is nothing to pick");
    type(ctrl, " CONTOSO\\jdoe ");
    assert.equal(ctrl.value, "CONTOSO\\jdoe");
    assert.deepEqual(ctrl.validate(), []);

    type(ctrl, "CONTOSO\\j[doe]");
    assert.equal(ctrl.validate().length, 1, "a reserved character is reported");
});

test("the client rules match the server rules", () => {
    const parse = load().wx.InputDomainCtrl.parse;

    // the cases of UnitTestDomainLogon.TryParse
    assert.equal(parse("CONTOSO\\jdoe").format, "downlevel");
    assert.equal(parse("contoso.com\\jdoe").domain, "contoso.com");
    assert.equal(parse("j.doe@corp.contoso.local").format, "principal");
    assert.equal(parse("ABCDEFGHIJKLMNOP\\jdoe"), null);
    assert.equal(parse("CONTOSO\\abcdefghijklmnopqrstu"), null);
    assert.equal(parse("CONTOSO\\jdoe."), null);
    assert.equal(parse("\\jdoe"), null);
    assert.equal(parse("jdoe@contoso_com"), null);
    assert.equal(parse("jdoe"), null);
});
