```markdown
![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# WQLPromptCtrl

The `WQLPromptCtrl` component provides an advanced, WYSIWYG input field specifically designed for formulating WebExpress Query Language (WQL) expressions. Inspired by the workflow of a Linux terminal, it offers an intuitive and highly responsive user experience. As the user types, the component continuously analyzes the context at the current cursor position and provides live, context-aware auto-completion suggestions for attributes, operators, values, and logical connectors. 

To ensure optimal performance and minimize network load, all REST API requests for syntax validation and suggestion retrieval are debounced. This means requests are only sent when the user briefly pauses typing. The most probable completion is presented as a primary hint, which can be instantly accepted by pressing the `Tab` key. Additional suggestions can be navigated using the `Arrow Up` and `Arrow Down` keys. 

```text
   ┌────────────────────────────────────────────────────────┐
   │ > type in ("Project", "Event") and status =            │
   └────────────────────────────────────────────────────────┘
     Attribute: Tab to insert "active", or use arrows for "archived", "draft"
```

## Configuration

The component is initialized declaratively by assigning the appropriate class to a container element. The REST API that handles the parsing, validation, and history management of the WQL queries is declared through a child `wx-service` island named `data`; without it the prompt is a highlighting editor only.

| Source                       | Description                                                                                                                                  | Example
|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|-----------------
| `<wx-service name="data">`   | The WQL service. Its `base-uri` receives `/analyze` for suggestions and validation and `/history` for past queries; its headers apply to every request. | `<wx-service hidden name="data" kind="rest" base-uri="/api/wql" method="GET"></wx-service>`
| `name`                       | Makes the prompt a form field: a hidden input of that name carries the query.                                                               | `name="query"`
| `data-wx-resource`, `data-wx-model`, `data-wx-viewstate` | Binds the prompt to a ViewState path; a submit writes the query there and re-queries the resource.                  | `data-wx-model="query.wql"`

The architecture (text model, view, undo) and the full compatibility contract are documented in `WebExpress.WebApp/docs/js/wql.prompt.md`.

## Functionality

The `WQLPromptCtrl` is built to handle complex query formulations with several quality-of-life features tailored for power users.

- **Omnidirectional Editing**: Unlike simple command lines, users can move the cursor to any point within the expression to edit, replace, or insert attributes, operators, or values. The context engine dynamically adjusts its suggestions based on the exact cursor position.
- **Smart Auto-Completion**: Contextual hints are displayed beneath the input field. The primary suggestion can be applied using `Tab`. If multiple valid continuations exist, up to 10 alternatives are shown, which can be cycled through using the arrow keys. The component intelligently handles formatting, such as auto-inserting quotes or parentheses where required.
- **Multi-line Support**: For complex or deeply nested queries, users can press `Ctrl + Enter` to insert a line break without submitting the query. This greatly improves the readability of long expressions. Pressing `Enter` alone submits the expression for final server-side validation.
- **Shell-like History**: Previously submitted expressions are saved and can be navigated using the `Page Up` (previous) and `Page Down` (next) keys. If a user starts typing a new query, navigates back through history, and then returns to the present, their unsubmitted draft is automatically restored.
- **Live Syntax Highlighting**: The input field behaves like a code editor, applying real-time syntax highlighting to distinguish between attributes, operators, and string values. Syntax errors returned by the server are immediately displayed in red in the hint area.
- **Undo and Redo**: `Ctrl + Z` takes the last edit back, `Ctrl + Y` or `Ctrl + Shift + Z` restores it (`Cmd` on macOS); text and selection return together. Typed words, completions, pastes and queries loaded from the history are separate steps. Setting the value from code, from a ViewState or through a form reset starts a fresh editing session.
- **Incomplete Input**: An open string, a missing operand or a dangling `and` is kept exactly as typed; highlighting and suggestions never change the text.

## WQL Syntax Specification

The underlying WebExpress Query Language (WQL) follows a structured syntax consisting of attributes, operators, and parameters. Expressions can be combined using logical operators (`and`, `or`) and grouped using parentheses to define the exact order of evaluation.

```text
<WQL>                      ::= <Filter> <Order> <Partitioning> | ε
<Filter>                   ::= "(" <Filter> ")" | <Filter> <LogicalOperator> <Filter> | <Condition> | ε
<Condition>                ::= <Attribute> <BinaryOperator> <Parameter> <ParameterOptions> | <Attribute> <SetOperator> "(" <Parameter> <ParameterNext> ")"
<LogicalOperator>          ::= "and" | "or" | "&" | "||"
<Attribute>                ::= <Name> | <Name> "." <Name>
<Parameter>                ::= <Function> | <DoubleValue> | """ <StringValue> """ | "'" <StringValue> "'"  | <StringValue>
<ParameterOptions>         ::= <ParameterFuzzyOptions> | <ParameterDistanceOptions> | <ParameterFuzzyOptions> <ParameterDistanceOptions> | <ParameterDistanceOptions> <ParameterFuzzyOptions> | ε
<ParameterFuzzyOptions>    ::= "~" <Number>
<ParameterDistanceOptions> ::= ":" <Number>
<Function>                 ::= <Name> "(" <Parameter> <ParameterNext> ")" | Name "(" ")"
<ParameterNext>            ::= "," <Parameter> <ParameterNext> | ε
<BinaryOperator>           ::= "=" | ">" | "<" | ">=" | "<=" | "!=" | "~" | "is" | "is not"
<SetOperator>              ::= "in" | "not in"
<Order>                    ::= "order" "by" <Attribute> <DescendingOrder> <OrderNext> | ε
<OrderNext>                ::= "," <Attribute> <DescendingOrder> <OrderNext> | ε
<DescendingOrder>          ::= "asc" | "desc" | ε
<Partitioning>             ::= <Partitioning> <Partitioning> | <PartitioningOperator> <Number> | ε
<PartitioningOperator>     ::= "take" | "skip"
<Name>                     ::= [A-Za-z_][A-Za-z0-9_]+
<StringValue>              ::= [A-Za-z0-9_@<>=~$%/!+.,;:\-]+
<DoubleValue>              ::= [+-]?[0-9]*[.]?[0-9]+
<Number>                   ::= [0-9]+
```

### Examples

```wql
name = "Alpha"
name ~ "Alpha"~2
size = "mittel":3
name = "ProjektA"~1:5
type in ("Projekt","Dokument","Event")
(name = "Alpha" and status = "active") or (owner = "ReneSchwarzer")
score > avg(10,20,30)
status = "active" order by created desc
type = "Projekt" order by created desc take 10
((name ~ "Alpha"~2 and status != "archived") or type in ("Projekt","Event")) and owner = "ReneSchwarzer" order by created desc, name asc take 20 skip 5
```

## Programmatic Control

While designed primarily for direct user interaction, the component can be integrated and controlled programmatically.

### Accessing an Automatically Created Instance

```javascript
// find the host element in the DOM
const element = document.getElementById('my-wql-prompt');

// retrieve the controller instance associated with the element
const wqlCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (wqlCtrl) {
    // forcefully clear the input and reset state
    wqlCtrl._onClearInput();
}
```

### Manual Instantiation

```javascript
// find the container element
const container = document.getElementById('dynamic-wql-container');

// declare the service the same way the server does
container.appendChild(webexpress.webapp.ServiceRegistry.islandElement({
    name: 'data', kind: 'rest', baseUri: '/api/wql', method: 'GET'
}));

// create a new instance of WqlPromptCtrl manually
const dynamicWqlCtrl = new webexpress.webapp.WqlPromptCtrl(container);

// read and write the query; a programmatic value dispatches no event
dynamicWqlCtrl.value = "status = 'active'";
```

## Events

The component integrates with the global filter system by dispatching events upon successful query submission.

- **`webexpress.webui.Event.CHANGE_FILTER_EVENT`**: Dispatched when the user presses `Enter` to submit a query. The `detail.value` property contains the complete WQL expression string, trimmed; an empty value resets the filter. Other components (like data lists or charts) can listen to this event to trigger data refetching.

## Use Case Example

The following HTML snippet demonstrates the minimal setup required to instantiate the `WQLPromptCtrl`. The backend endpoints (`/api/wql/analyze` and `/api/wql/history`) must be implemented on the server to provide the contextual data.

```html
<!--
    The host element for the WQL Prompt.
    The wx-service island specifies the base URL for the context and history APIs.
-->
<div id="main-wql-prompt" class="wx-webapp-wql-prompt">
    <wx-service hidden name="data" kind="rest" base-uri="/api/wql" method="GET"></wx-service>
</div>
```
```