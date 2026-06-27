/**
 * Headless unit tests for the webexpress.webui.Icon factory.
 *
 * They cover the single decision the factory makes - css class versus image
 * source - and the element it produces for each, plus the empty-spec and
 * extra-class handling that callers rely on.
 *
 * Run with Node 18 or newer from the jstest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

test("a css class spec yields an <i> carrying the class", () => {
    const { wx } = loadWebUi();
    const icon = wx.Icon.create("fas fa-plus");
    assert.equal(icon.tagName, "I");
    assert.ok(icon.classList.contains("fas"));
    assert.ok(icon.classList.contains("fa-plus"));
});

test("an image spec yields an <img> with the source and the image class", () => {
    const { wx } = loadWebUi();

    for (const src of ["/assets/img/logo.svg", "./logo.png", "../a/b.jpeg", "https://x.test/y.webp", "data:image/png;base64,AAAA", "team.gif"]) {
        const icon = wx.Icon.create(src);
        assert.equal(icon.tagName, "IMG", "expected an image for " + src);
        assert.equal(icon.src, src);
        assert.ok(icon.classList.contains("wx-icon-img"), "expected wx-icon-img for " + src);
    }
});

test("the extra class is added to both icon kinds", () => {
    const { wx } = loadWebUi();

    const i = wx.Icon.create("fas fa-trash", "me-2");
    assert.ok(i.classList.contains("fas") && i.classList.contains("fa-trash") && i.classList.contains("me-2"));

    const img = wx.Icon.create("/x.svg", "me-2");
    assert.ok(img.classList.contains("wx-icon-img") && img.classList.contains("me-2"));
});

test("an empty spec yields null so callers can omit the icon", () => {
    const { wx } = loadWebUi();
    assert.equal(wx.Icon.create(""), null);
    assert.equal(wx.Icon.create(null), null);
    assert.equal(wx.Icon.create(undefined), null);
    assert.equal(wx.Icon.create("   "), null);
});

test("a multi-class font spec is not mistaken for an image", () => {
    const { wx } = loadWebUi();
    const icon = wx.Icon.create("far fa-calendar-alt");
    assert.equal(icon.tagName, "I");
});
