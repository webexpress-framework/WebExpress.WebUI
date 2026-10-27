/**
 * Headless tests for webexpress.webui.Session, which renews a sign-in from the readable hint
 * cookie the server leaves next to the http-only credentials.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";

const HINT = "wx-auth-renew";

/**
 * Loads the runtime with a fetch stub that plays the refresh endpoint.
 * @param {Function} answer - Receives the runtime and the call; returns the http status.
 * @returns {object} The runtime and the recorded calls and reloads.
 */
function setup(answer) {
    const calls = [];
    const state = { reloads: 0 };
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.session.js"],
        fetch: async (url, init) => {
            const call = { url: String(url), method: init.method, headers: init.headers };
            calls.push(call);
            const status = answer(rt, call);
            return {
                ok: status >= 200 && status < 300,
                status,
                headers: { get: () => "application/json" },
                json: async () => ({ authenticated: status === 200 }),
                text: async () => "{}"
            };
        }
    });
    rt.sandbox.window.location.reload = () => { state.reloads++; };
    return { rt, calls, state };
}

/**
 * Writes the hint the way the server leaves it.
 * @param {object} rt - The runtime.
 * @param {number} offset - Milliseconds from now until the access credential runs out.
 */
function hint(rt, offset) {
    rt.document.cookie = `theme=x; ${HINT}=webexpress.tutorial.webui.application:${Math.floor((Date.now() + offset) / 1000)}`;
}

/**
 * Starts a session watcher as a freshly loaded page does.
 * @param {object} rt - The runtime.
 * @returns {Promise<object>} The watcher, after a renewal started on load settled.
 */
async function start(rt) {
    const session = new rt.wx.Session.constructor();
    await (session._renewing || Promise.resolve());
    return session;
}

/**
 * Stops the planned renewal, so a test leaves no timer behind.
 * @param {object} session - The watcher.
 */
function stop(session) {
    clearTimeout(session._timer);
}

test("without a grant nothing is asked for and nothing is planned", async () => {
    const { rt, calls } = setup(() => 200);
    const session = await start(rt);
    assert.equal(calls.length, 0);
    assert.equal(session._timer, null);
});

test("a page rendered after the deadline renews the grant and reloads once to show the sign-in", async () => {
    const { rt, calls, state } = setup((runtime) => { hint(runtime, 5 * 60000); return 200; });
    hint(rt, -1000);

    const session = await start(rt);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].url, "/api/auth/refresh?application=webexpress.tutorial.webui.application");
    assert.equal(calls[0].headers["X-WebExpress-Auth"], "1", "the endpoint refuses requests without the marker");
    assert.equal(state.reloads, 1);
    assert.notEqual(session._timer, null, "the renewed credential is renewed again before it runs out");
    stop(session);

    // a server that keeps rendering the page anonymous must not make it reload forever
    hint(rt, -1000);
    stop(await start(rt));
    assert.equal(state.reloads, 1);
});

test("a valid credential is renewed ahead of its deadline, never at once", async () => {
    const { rt, calls } = setup(() => 200);
    for (const remaining of [10 * 60000, 20000]) {
        hint(rt, remaining);
        const session = await start(rt);
        assert.equal(calls.length, 0, "a short-lived credential is renewed halfway, not in a loop");
        assert.notEqual(session._timer, null, "the renewal is planned");
        stop(session);
    }
});

test("tabs renew one after the other, and a tab that waited uses the renewal of the one before", async () => {
    const { rt, calls } = setup((runtime) => { hint(runtime, 5 * 60000); return 200; });
    let queue = Promise.resolve();
    rt.sandbox.navigator.locks = { request: (name, fn) => (queue = queue.then(fn)) };
    hint(rt, 20000);
    const first = await start(rt);
    const second = await start(rt);

    await Promise.all([first._renew(false), second._renew(false)]);
    stop(first);
    stop(second);

    assert.equal(calls.length, 1, "a second use of the refresh credential would end the grant");
});

test("a refused grant ends the attempts, an unreachable server is retried later", async () => {
    const refused = setup((runtime) => { runtime.document.cookie = ""; return 401; });
    hint(refused.rt, 20000);
    const ended = await start(refused.rt);
    stop(ended);
    await ended._renew(false);
    assert.equal(refused.calls.length, 1);
    assert.equal(ended._timer, null, "the server took the hint with the grant");

    const down = setup(() => 503);
    hint(down.rt, 20000);
    const session = await start(down.rt);
    stop(session);
    await session._renew(false);
    assert.notEqual(session._timer, null, "the hint is still there, so the attempt is repeated");
    stop(session);
    assert.equal(down.state.reloads, 0);
});
