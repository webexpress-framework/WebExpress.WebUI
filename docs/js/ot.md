![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# Operational Transformation

`webexpress.webui.Ot` (`webexpress.webui.ot.js`) is the transformation core of shared editing.
It is pure and DOM-free: the same code runs in the controls, in the tests and as the reference
the server's apply and validation mirror. The server never transforms; see the WebApp
documentation, *Real-time collaboration*, for the protocol and the sequencer.

## Linearized documents

A document is a flat sequence of tokens. Every character, the opening and the closing of a
structured node and every atomic leaf occupy exactly one position, so positions are plain
integers and the structure travels with the content.

| Token | Meaning |
|-------|---------|
| `{ t: "c", v: "a", m: { ... } }` | one UTF-16 code unit with its marks (in memory) |
| `{ t: "s", v: "text", m: { ... } }` | a packed run of characters (on the wire) |
| `{ t: "o", n: "p", id: "n1", a: { ... } }` | the opening of a node with its attributes |
| `{ t: "e", n: "p", id: "n1" }` | the closing of a node |
| `{ t: "l", n: "image", id: "n2", a: { ... } }` | an atomic leaf |

`Ot.expand(slice)` unpacks the wire form and rejects malformed tokens; `Ot.compact(tokens)`
packs it. Tokens are immutable by convention: a change replaces a token, so documents can share
token instances.

## Primitives

| Step | Effect | Recorded for inversion |
|------|--------|------------------------|
| `{ type: "replace", from, to, slice }` | replaces a range with a structured slice | `removed` |
| `{ type: "addMark", from, to, name, value }` | sets a mark on the characters of a range; exclusive marks (subscript, superscript) remove each other | `previous` runs |
| `{ type: "removeMark", from, to, name }` | removes a mark | `previous` runs |
| `{ type: "setAttr", pos, id, key, value }` | sets (or with `null` removes) an attribute of the node at `pos`, which must have the given id | `previous` |

## API

| Function | Purpose |
|----------|---------|
| `Ot.apply(tokens, steps)` | applies steps to a copy; returns `{ tokens, steps }` with the inverses recorded; throws on out-of-range or malformed steps instead of clamping |
| `Ot.invert(applied)` | the steps that undo applied steps |
| `Ot.transform(a, b, aFirst)` | rebases two concurrent step sequences onto each other; `aFirst` decides ties |
| `Ot.map(pos, steps, assoc)` / `Ot.mapSelection(selection, steps, assoc)` | moves positions through steps; `assoc` decides the side of text inserted exactly at a position |
| `Ot.diff(before, after)` | the steps between two documents; structure is matched by node identity, so moved or wrapped content is not replaced |
| `Ot.equal(a, b)` | compares documents including marks and attributes |

`webexpress.webui.OtHistory` is the selective undo history of shared controls: it keeps the
inverse of each own change and transforms it against every later change, so undoing never takes
back what others wrote. Typing and deleting merge into word-sized steps. A step whose content
was removed by someone else becomes empty and is skipped.

`webexpress.webui.OtSchema` holds the schemas of the document kinds without a model of their own:
`checkText` / `repairText` for plain text (WQL prompt) and `checkGraph` / `repairGraph` for graphs
(graph editor). The rich text schema is `EditorModel.check` with `EditorModel.repairTokens`.

## Transformation rules

A replacement is a deletion followed by an insertion at its start; all rules are defined on
these atoms, marks and attributes:

- insertion vs. insertion: at the same position the side that wins ties goes first;
- insertion vs. deletion: an insertion inside a deleted range survives at its start, and the
  deletion is split around it;
- deletion vs. deletion: the union is removed exactly once;
- mark vs. insertion: a mark range is split around inserted content, which keeps its own marks;
- mark vs. mark: on overlap of the same mark, or of two exclusive marks being added, the winner of
  ties decides; other marks are independent;
- attribute vs. deletion: a change on a deleted node is dropped; two changes of the same
  attribute are decided by the winner of ties.

Every rule keeps both application orders equal (TP1); `ot.test.mjs` checks each rule on its
own, the invertibility of every primitive and thousands of random concurrent sequences.
