/**
 * Allows a test to inspect the UI while a service response is still outstanding.
 */
export function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
    return { promise, resolve, reject };
}

export async function settle() {
    await new Promise(resolve => setImmediate(resolve));
}
