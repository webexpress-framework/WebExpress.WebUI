/**
 * Tests for webexpress.webui.treeGuides, the shared rule the table and the list
 * both draw their indentation from.
 *
 * A tree is rendered as a flat sequence of rows, so a row can only draw the
 * lines connecting it to its parent if it knows, for every level above it,
 * whether that branch still has a row to come. Getting one level wrong shows up
 * as a line that runs into nothing, or as a gap in the middle of a branch.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Builds a tree of nodes carrying the parent and children links the helper walks.
 * @param {object} shape - A nested { name: shape } description.
 * @param {object|null} parent - The parent node.
 * @returns {Array<object>} The nodes of this level.
 */
function build(shape, parent = null) {
    return Object.entries(shape).map(([name, nested]) => {
        const node = { name: name, parent: parent, children: [] };
        node.children = build(nested, node);
        return node;
    });
}

/**
 * Finds a node by name anywhere in the tree.
 * @param {Array<object>} nodes - The roots.
 * @param {string} name - The name to find.
 * @returns {object|null} The node.
 */
function find(nodes, name) {
    for (const node of nodes) {
        if (node.name === name) {
            return node;
        }
        const nested = find(node.children, name);
        if (nested) {
            return nested;
        }
    }
    return null;
}

test("a root has no guide columns", () => {
    const rt = loadWebUi({ browser: true });
    const roots = build({ a: {}, b: {} });

    assert.deepEqual(rt.wx.treeGuides(find(roots, "a")), []);
});

test("a child reports whether it has a sibling below it", () => {
    const rt = loadWebUi({ browser: true });
    const roots = build({ epic: { first: {}, last: {} } });

    assert.deepEqual(rt.wx.treeGuides(find(roots, "first")), [true], "the branch goes on");
    assert.deepEqual(rt.wx.treeGuides(find(roots, "last")), [false], "the branch ends here");
});

test("every level above a row contributes a flag, outermost first", () => {
    const rt = loadWebUi({ browser: true });
    const roots = build({
        epic: {
            first: { deep: {} },
            last: { alsoDeep: {} }
        }
    });

    // "deep" sits under "first", which still has "last" to come, so the outer
    // column carries a line past it; "deep" itself is an only child and ends
    assert.deepEqual(rt.wx.treeGuides(find(roots, "deep")), [true, false]);

    // under "last" the outer branch has ended, so that column stays blank
    assert.deepEqual(rt.wx.treeGuides(find(roots, "alsoDeep")), [false, false]);
});

test("the flags reach as deep as the tree does", () => {
    const rt = loadWebUi({ browser: true });
    const roots = build({ a: { b: { c: { d: {} } } } });

    assert.equal(rt.wx.treeGuides(find(roots, "d")).length, 3, "one column per level above the row");
});

test("a parent chain that loops back on itself terminates", () => {
    const rt = loadWebUi({ browser: true });

    // a malformed payload can produce this; without the hop limit the walk
    // would never return and the whole render would hang
    const a = { name: "a", children: [] };
    const b = { name: "b", parent: a, children: [] };
    a.parent = b;
    a.children = [b];
    b.children = [a];

    assert.ok(rt.wx.treeGuides(a).length > 0, "it gives up rather than hanging");
});
