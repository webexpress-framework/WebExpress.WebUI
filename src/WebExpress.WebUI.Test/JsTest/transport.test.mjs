/**
 * Headless tests for webexpress.webui.Transport, the one door of the WebUI controls to the
 * network: the result contract of the built-in adapter, the adapter an application installs
 * in its place, and the upload with its progress.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * A fake XMLHttpRequest that lets a test drive the upload's progress and outcome.
 */
class FakeXhr {
    static last = null;

    constructor() {
        this.upload = {};
        this.headers = {};
        this.status = 0;
        this.responseText = "";
        this.aborted = false;
        FakeXhr.last = this;
    }
    open(method, url) { this.method = method; this.url = url; }
    setRequestHeader(name, value) { this.headers[name] = value; }
    getResponseHeader(name) { return name === "content-type" ? this.contentType || "" : null; }
    send(body) { this.body = body; }
    abort() { this.aborted = true; if (this.onabort) this.onabort(); }
    answer(status, contentType, text) {
        this.status = status; this.contentType = contentType; this.responseText = text;
        this.onload();
    }
}

test("the built-in adapter answers a json response with the parsed body", async () => {
    const rt = loadWebUi({
        browser: true,
        fetch: async (url, init) => ({ ok: true, status: 200, headers: { get: () => "application/json" }, json: async () => ({ url, method: init.method || "GET" }) })
    });

    const result = await rt.wx.Transport.request("/api/thing", { method: "POST" });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.deepEqual(result.data, { url: "/api/thing", method: "POST" });
    assert.equal(result.error, null);
});

test("the built-in adapter hands a text body back as { text } whatever the status, and reports a failure", async () => {
    const rt = loadWebUi({
        browser: true,
        fetch: async () => ({ ok: false, status: 422, statusText: "Unprocessable", headers: { get: () => "text/html" }, text: async () => "<form>again</form>" })
    });
    const reported = [];
    rt.document.addEventListener("webexpress.webui.transport.error", (e) => reported.push(e.detail));

    const result = await rt.wx.Transport.request("/form", { method: "POST" });

    assert.equal(result.ok, false);
    assert.equal(result.error.kind, "http");
    assert.equal(result.status, 422);
    assert.equal(result.data.text, "<form>again</form>", "a refused submission still carries the page the server answered with");
    assert.equal(reported.length, 1, "the failure is announced on the document");
    assert.equal(reported[0].operation, "POST");
});

test("the built-in adapter never rejects: a network failure and an abort are results", async () => {
    const rt = loadWebUi({
        browser: true,
        fetch: async (url, init) => {
            if (init.signal && init.signal.aborted) { const e = new Error("aborted"); e.name = "AbortError"; throw e; }
            throw new Error("unreachable");
        }
    });
    const reported = [];
    rt.document.addEventListener("webexpress.webui.transport.error", (e) => reported.push(e.detail));

    const network = await rt.wx.Transport.request("/api/thing");
    assert.equal(network.ok, false);
    assert.equal(network.error.kind, "network");
    assert.equal(network.error.retriable, true);

    const controller = new rt.sandbox.AbortController();
    controller.abort();
    const abort = await rt.wx.Transport.request("/api/thing", { signal: controller.signal });
    assert.equal(abort.error.kind, "abort");

    assert.equal(reported.length, 1, "a failure is announced, an abort is not");
});

test("an installed adapter takes over the requests and can leave the upload to the built-in one", async () => {
    const rt = loadWebUi({ browser: true, fetch: async () => { throw new Error("fetch must not be reached"); } });
    const seen = [];

    rt.wx.Transport.use({ request: async (url, init) => { seen.push({ url, init }); return { ok: true, status: 200, data: { adapter: true }, error: null, response: null, contentType: "" }; } });

    const result = await rt.wx.Transport.request("/api/thing", { method: "GET" });
    assert.deepEqual(result.data, { adapter: true });
    assert.equal(seen.length, 1);

    rt.wx.Transport.use(null);
    assert.equal(rt.wx.Transport.builtIn instanceof rt.wx.FetchTransport, true, "null restores the built-in adapter");
});

test("the built-in upload reports its progress and answers with the same result shape", async () => {
    const rt = loadWebUi({ browser: true, globals: { XMLHttpRequest: FakeXhr } });
    const progress = [];

    const pending = rt.wx.Transport.upload("/api/upload", "body", { onProgress: (percent) => progress.push(percent) });
    const xhr = FakeXhr.last;

    assert.equal(xhr.method, "POST");
    assert.equal(xhr.url, "/api/upload");
    xhr.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
    xhr.answer(201, "application/json", JSON.stringify({ id: 7 }));

    const result = await pending;
    assert.deepEqual(progress, [50]);
    assert.equal(result.ok, true);
    assert.equal(result.status, 201);
    assert.deepEqual(result.data, { id: 7 });

    const failing = rt.wx.Transport.upload("/api/upload", "body");
    FakeXhr.last.answer(413, "text/plain", "too large");
    const failed = await failing;
    assert.equal(failed.ok, false);
    assert.equal(failed.error.kind, "http");
    assert.equal(failed.status, 413);
});
