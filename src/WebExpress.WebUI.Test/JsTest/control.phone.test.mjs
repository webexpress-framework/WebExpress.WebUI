/**
 * Headless contract tests for the phone display (wx-webui-phone) and the phone field
 * (wx-webui-input-phone). The shared contract (controls.contract.mjs) verifies that both
 * register and survive a construct / teardown lifecycle.
 *
 * On top of it the numbering plans are pinned: the client keeps the table of PhoneCatalog.cs,
 * and a drift between the two would let the client accept what the server refuses.
 */
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contract } from "./controls.contract.mjs";
import { loadWebUi } from "./harness.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const catalogCs = path.resolve(here, "..", "..", "WebExpress.WebUI", "WebControl", "PhoneCatalog.cs");

contract({
    file: "webexpress.webui.phone.js",
    selector: "wx-webui-phone",
    ctrl: "PhoneCtrl"
});

contract({
    file: "webexpress.webui.input.phone.js",
    selector: "wx-webui-input-phone",
    ctrl: "InputPhoneCtrl",
    deps: ["webexpress.webui.phone.js"]
});

function load() {
    return loadWebUi({ browser: true, extraFiles: ["webexpress.webui.phone.js", "webexpress.webui.input.phone.js"] });
}

function host(rt, attributes, children = []) {
    const element = rt.createElement("div");
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    for (const [country, label] of children) {
        const child = rt.createElement("div");
        child.setAttribute("id", country);
        child.setAttribute("data-label", label);
        child.classList.add("wx-selection-item");
        element.appendChild(child);
    }
    rt.document.body.appendChild(element);
    return element;
}

test("the client keeps the numbering plans of the server", () => {
    const rt = load();
    const source = fs.readFileSync(catalogCs, "utf8");
    const server = [...source.matchAll(/new\("([A-Z]{2})", "(\d+)", "(\d*)", \[([\d, ]*)\], (null|@"((?:[^"]|"")*)")\)/g)]
        .map((m) => [m[1], m[2], m[3], m[4].split(",").map((x) => Number(x.trim())).filter((x) => x), m[5] === "null" ? null : m[6].replace(/""/g, "\"")]);

    assert.equal(server.length, 242, "every plan of PhoneCatalog.cs was read");
    assert.deepEqual(JSON.parse(JSON.stringify(rt.wx.PhoneCatalog.PLANS)), server);
});

test("numbers are brought into E.164 form and told apart within a shared calling code", () => {
    const P = load().wx.PhoneCatalog;

    // the cases of UnitTestPhoneCatalog
    assert.equal(P.normalize("0049 (30) 123-456"), "+4930123456");
    assert.equal(P.normalize("030 123456", "DE"), "+4930123456");
    assert.equal(P.normalize("06 12345678", "IT"), "+390612345678", "an italian number keeps its leading zero");
    assert.equal(P.normalize("+49 12"), null);
    assert.equal(P.country("+14165551234"), "CA");
    assert.equal(P.country("+12425551234"), "BS");
    assert.equal(P.country("+441481256789"), "GG");
    assert.equal(P.format("+4930123456"), "+49 30123456");
});

test("the display shows the flag and a link that dials the number", () => {
    const rt = load();
    const ctrl = new rt.wx.PhoneCtrl(host(rt, { "data-value": "+14165551234" }));

    assert.equal(ctrl.value, "+14165551234");
    assert.equal(ctrl._flag.className, "wx-flag wx-flag-ca");
    assert.equal(ctrl._link.getAttribute("href"), "tel:+14165551234");
    assert.equal(ctrl._link.textContent, "+1 4165551234");

    ctrl.value = "no number";
    assert.equal(ctrl._box.hidden, true);
});

test("the field reads a number into its country and the national part", () => {
    const rt = load();
    const element = host(rt, { id: "tel", name: "tel", "data-value": "+4930123456", "data-country": "AT" }, [["AT", "Österreich"], ["DE", "Deutschland"]]);
    const ctrl = new rt.wx.InputPhoneCtrl(element);

    assert.equal(ctrl.country, "DE", "the number names its own country");
    assert.equal(ctrl._number.value, "30123456");
    assert.equal(ctrl._triggerCode.textContent, "+49");
    assert.equal(ctrl._hidden.value, "+4930123456");
    assert.equal(ctrl._hidden.name, "tel");
});

test("a national number typed with its prefix posts in E.164 form, once", () => {
    const rt = load();
    const element = host(rt, { "data-country": "DE" }, [["DE", "Deutschland"]]);
    const ctrl = new rt.wx.InputPhoneCtrl(element);
    const announced = [];
    element.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, (e) => announced.push(e.detail.value));

    ctrl._number.value = "030 123456";
    ctrl._number.dispatchEvent({ type: "input" });
    ctrl.value = "+4930123456";

    assert.deepEqual(announced, ["+4930123456"], "writing back the value announces nothing");
    assert.deepEqual(ctrl.validate(), []);
});

test("a character other than a separator is kept and reported, not dropped", () => {
    const rt = load();
    const ctrl = new rt.wx.InputPhoneCtrl(host(rt, { "data-country": "DE" }, [["DE", "Deutschland"]]));

    ctrl._number.value = "030 12a456";
    ctrl._number.dispatchEvent({ type: "input" });

    assert.equal(ctrl.value, "030 12a456", "the typo is not silently turned into a valid number");
    assert.equal(ctrl._hidden.value, "030 12a456", "the server sees what was typed and refuses it");
    assert.equal(ctrl.validate().length, 1);

    ctrl._number.value = "(030) 123-456";
    ctrl._number.dispatchEvent({ type: "input" });
    assert.equal(ctrl.value, "+4930123456", "separators still go");
});

test("an international number of a country not offered keeps its calling code and is refused", () => {
    const rt = load();
    const ctrl = new rt.wx.InputPhoneCtrl(host(rt, { "data-country": "DE" }, [["DE", "Deutschland"]]));

    for (const typed of ["0044 20 7946 0000", "+44 20 7946 0000"]) {
        ctrl._number.value = typed;
        ctrl._number.dispatchEvent({ type: "input" });

        assert.equal(ctrl.value, "+442079460000", `${typed} is not read as a german number`);
        assert.equal(ctrl.country, "DE", "the chosen country stays, as the number's is not offered");
        assert.equal(ctrl.validate().length, 1, "the country of the number is refused");
    }
});

test("a number of the offered country is taken although a neighbour's pattern overlaps it", () => {
    const rt = load();
    const P = rt.wx.PhoneCatalog;

    assert.equal(P.country("+61412345678"), "AU", "the main country is asked first");
    assert.equal(P.fits("+61412345678", "CC"), true, "the cocos islands dial australian mobile numbers");

    const au = new rt.wx.InputPhoneCtrl(host(rt, { "data-country": "AU" }, [["AU", "Australien"]]));
    au._number.value = "0412345678";
    au._number.dispatchEvent({ type: "input" });
    assert.equal(au.value, "+61412345678");
    assert.deepEqual(au.validate(), []);

    const cc = new rt.wx.InputPhoneCtrl(host(rt, { "data-value": "+61412345678" }, [["CC", "Kokosinseln"]]));
    assert.equal(cc.country, "CC", "the number stays in the offered country it fits");
    assert.deepEqual(cc.validate(), []);
});

test("choosing another country keeps the number and reads it there", () => {
    const rt = load();
    const element = host(rt, { "data-country": "DE", "data-value": "+4930123456" }, [["AT", "Österreich"], ["DE", "Deutschland"]]);
    const ctrl = new rt.wx.InputPhoneCtrl(element);

    ctrl.country = "at";

    assert.equal(ctrl.value, "+4330123456");
    assert.equal(ctrl._triggerFlag.className, "wx-flag wx-flag-at");
});

test("an incomplete number is kept as typed and reported by validate", () => {
    const rt = load();
    const ctrl = new rt.wx.InputPhoneCtrl(host(rt, { "data-country": "DE" }, [["DE", "Deutschland"]]));

    ctrl.value = "12";

    assert.equal(ctrl.value, "+4912");
    assert.equal(ctrl.validate().length, 1);
});

test("the menu lists the offered countries with their calling code and filters by name and code", () => {
    const rt = load();
    const ctrl = new rt.wx.InputPhoneCtrl(host(rt, { "data-country": "DE" }, [["DE", "Deutschland"], ["AT", "Österreich"], ["AQ", "Antarktis"]]));

    assert.deepEqual(ctrl._options.map((o) => o.country), ["DE", "AT"], "a country without telephone service is dropped");

    ctrl._filter.value = "+43";
    ctrl._applyFilter();
    assert.deepEqual(ctrl._options.filter((o) => !o.item.hidden).map((o) => o.country), ["AT"]);

    ctrl._filter.value = "deut";
    ctrl._applyFilter();
    assert.deepEqual(ctrl._options.filter((o) => !o.item.hidden).map((o) => o.country), ["DE"]);
});

for (const showFlag of [undefined, "true", "false"]) {
    test(`phone flag visibility respects ${showFlag ?? "the default"} across value changes`, () => {
        const rt = load();
        const attributes = { "data-value": "+4930123456" };
        if (showFlag !== undefined) {
            attributes["data-show-flag"] = showFlag;
        }
        const element = host(rt, attributes);
        const ctrl = new rt.wx.PhoneCtrl(element);

        assert.equal(ctrl._box.contains(ctrl._flag), showFlag !== "false");
        assert.equal(ctrl._link.getAttribute("href"), "tel:+4930123456");
        assert.equal(element.hasAttribute("data-show-flag"), false);

        ctrl.value = null;
        ctrl.value = "+14165551234";

        assert.equal(ctrl._box.contains(ctrl._flag), showFlag !== "false");
        assert.equal(ctrl._link.textContent, "+1 4165551234");
        assert.equal(ctrl._link.getAttribute("href"), "tel:+14165551234");
        assert.equal(ctrl._box.hidden, false);
    });
}
