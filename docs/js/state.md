![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# StateCtrl and Renderer

`webexpress.webui.StateCtrl` is the base of a control whose markup is a function of its state. The control describes its DOM in `render(state)` as a tree of virtual nodes, and the keyed reconciler `webexpress.webui.Renderer` patches that tree into the host with the minimal set of mutations. Handlers only change the state; every change renders again on the next microtask, several changes in one synchronous turn render once.

```
   handler ──setState(patch)──▶ state ──microtask──▶ render(state) ──▶ Renderer.patch(host, tree)
                                                                              │
                                              onUpdate(state) ◀───────────────┘
```

Both live in WebUI and load right after `webexpress.webui.js` (`webexpress.webui.renderer.js`, `webexpress.webui.state.js`). The `Data` base of WebExpress.WebApp extends `StateCtrl`, so a WebUI control and a WebApp control share one render loop; see `WebExpress/docs/view-state-service.md` for the data side.

## StateCtrl

```javascript
webexpress.webui.CounterCtrl = class extends webexpress.webui.StateCtrl {
    constructor(element) {
        super(element, { state: { count: 0 } });
        this.mount();
    }

    render(state) {
        const h = webexpress.webui.h;
        return h("button", { key: "inc", type: "button", on: { click: () => this.setState({ count: state.count + 1 }) } },
            String(state.count));
    }
};
```

### Constructor Options

| Option       | Description
|--------------|----------------------------------------------------------------------------------------------
| `state`      | The initial state of the `LocalState` the control creates.
| `store`      | A state container to use instead, such as the `ViewState` a WebApp control owns.
| `renderRoot` | The node the tree is patched into; the host element by default.

### Members

| Member              | Description
|---------------------|--------------------------------------------------------------------------------------
| `state`             | The current state, to be treated as immutable.
| `store`             | The state container.
| `setState(patch)`   | Merges a patch (an object, or a function of the state returning one) shallowly into the state.
| `mount()`           | Subscribes to the state, renders the first time and runs `onMount`. A subclass calls it at the end of its constructor.
| `update()`          | Renders the current state again; a host that shows a hidden control calls it.
| `render(state)`     | Returns a virtual node tree, a DOM node (which replaces the content of the render root) or nothing (the control updates its DOM itself).
| `onMount(state)`    | Runs once after the first render.
| `onUpdate(state)`   | Runs after every later render: focus, measuring and other work the tree cannot express.
| `onUnmount()`       | Runs on `destroy()`, after the control stopped rendering.

A subclass that joins another container after construction (a WebApp control moving into the `ViewState` of its region) calls `_useStore(store)`; the control renders the new state at once and follows it from then on.

## LocalState

The container a `StateCtrl` creates when it is given none. It has the state contract of the WebApp `ViewState`, which is what lets a WebApp control hand in its `ViewState` instead.

| Member               | Description
|----------------------|-------------------------------------------------------------------------------------
| `getState()`, `state`| The current state.
| `setState(patch)`    | Shallow merge; subscribers hear of it once on the next microtask, and only when a value changed.
| `subscribe(listener)`| Registers a listener and returns the function that removes it.
| `flush()`            | Delivers a pending notification synchronously, for tests and deterministic teardown.
| `destroy()`          | Drops every subscriber.

## FrameState

A `LocalState` whose notifications wait for the next animation frame instead of the next microtask. A control whose state changes at pointer or simulation rate - a node dragged across a canvas, a layout that settles - renders once per paint however many changes the frame saw, instead of once per event. `flush()` still renders at once, for a discrete action that wants its result shown before it returns, and `destroy()` gives a pending frame back. The graph viewer and the graph editor render on a `FrameState`.

## Renderer

`webexpress.webui.h(tag, props, ...children)` creates a virtual node; children may be nodes, strings, numbers, arrays, or `null`, `false` and `true`, which are skipped. `webexpress.webui.Renderer.patch(container, tree)` reconciles the children of a container with a node or a list of nodes.

| Prop              | Effect
|-------------------|------------------------------------------------------------------------------------
| `key`             | Matches a node across renders, so it is moved instead of recreated and keeps focus and nested controls.
| `class`           | A string, or an array whose falsy entries are dropped.
| `style`           | A string, or an object of style properties.
| `dataset`         | An object of `data-*` values.
| `on`              | A map of event name to handler; an unchanged handler stays attached.
| `value`, `checked`| Written on every render, because the user changes them in the DOM; the value of a select is applied after its options.
| `html`            | Inner markup; the node then owns the children the markup produces.
| `ref`             | Called with the DOM node after every render.
| `keep`            | The reconciler leaves the children alone, for a node a nested control lives on.
| any other         | Written as an attribute; `false`, `null` and `undefined` remove it.

A prop that did not change between two renders is not written again, so a nested control may decorate the node it lives on; the same holds for each declaration of a style object, so an unchanged declaration neither invalidates the style of the element nor overwrites what another hand set. Children that kept their number, order, types and keys are patched where they stand, without the bookkeeping a reorder needs. `Renderer.release(node)` removes the listeners the renderer attached to a node and everything below it, for the teardown of a control whose host may still hold the nodes. An `svg` node and everything below it is created in the SVG namespace, the content of a `foreignObject` is HTML again. `Renderer.adopt(node, props)` places an existing node (a server rendered part, the element of a nested control) into the tree: it keeps its identity and its children, and only the stated props are reconciled. `Renderer.adopt(node, props, children)` describes its children as well - a control that adds to a server rendered container, such as a dialog footer, states the container's own children through adopt among its own nodes.
