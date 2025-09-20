![WebExpress-Framework](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# CodeCtrl

The `CodeCtrl` module provides a component that can display code with optional line numbers, a copy function, and language-dependent syntax highlighting. It is ideal for presenting code snippets in a user interface. Initialization is declarative via HTML, where configuration is controlled through `data-` attributes.

The component consists of a header, which displays the name of the language and a button for copying, as well as the underlying code area.

```
   ┌──────────────────────────────────┐
   │ [Language]          [Copy Button]│  // Header with language display and copy button
   ├──────────────────────────────────┤
   │ 1 │                              │
   │ 2 │  [Code Content with Syntax]  │  // Code area with optional line numbers
   │ 3 │                              │
   └──────────────────────────────────┘
```

### Configuration

The component's configuration is managed via `data-` attributes directly on the host element.

| Attribute           | Description
|---------------------|------------------------------------------------------------------------------
| `data-language`     | The language for syntax highlighting. Also serves as the label in the header.
| `data-line-numbers` | Controls whether line numbers are displayed (`true` or `false`).

The code to be displayed is written directly as the text content of the host element.

### Features

- **Syntax Highlighting**: The code can be highlighted depending on the specified language. The syntax highlighting is modular and can be extended by adding more external JavaScript files for new languages. These modules register the specific rules for a language, which are then automatically applied by the `CodeCtrl`.
- **Copy Functionality**: The code can be copied to the clipboard with a click of the button.
- **Line Numbers**: Optional line numbers can be displayed for better clarity.
- **Header**: An optional header displays the programming language used.

### Programmatic Control

In addition to declarative initialization, the component can also be manipulated programmatically via its JavaScript instance after the page has loaded.

#### Accessing an Automatically Created Instance

For components defined declaratively in HTML, the associated instance is retrieved via the `getInstanceByElement(element)` method of the central `webexpress.webui.Controller`.

```javascript
// Find the host element in the DOM
const element = document.getElementById('code-section');

// Retrieve the controller instance associated with the element
const codeCtrl = webexpress.webui.Controller.getInstanceByElement(element);

if (codeCtrl) {
    // Example: Programmatically update the code content
    codeCtrl.code = 'console.log("New code!");';
}
```

#### Manual Instantiation

A `CodeCtrl` can also be created entirely programmatically, which is useful for dynamic UI scenarios.

```javascript
// Find the container element for the code area
const container = document.getElementById('dynamic-code-container');
container.className = 'wx-webui-code'; // Assign the class for registration
container.dataset.language = 'javascript';
container.dataset.lineNumbers = 'true';
container.textContent = 'console.log("Hello, World!");';


// Create a new instance of CodeCtrl manually by initializing the controller on the container
const dynamicCodeCtrl = new webexpress.webui.CodeCtrl(container);
```

### Use Case Example

The following example demonstrates the configuration of a code area with syntax highlighting for C# and enabled line numbers.

```html
<!--
    The main container for the CodeCtrl component.
    The code to be displayed is placed directly inside the element.
    Configuration is done via data-attributes for language and line numbers.
-->
<div id="code-section"
     class="wx-webui-code"
     data-language="csharp"
     data-line-numbers="true">public class HelloWorld 
{ 
    public static void Main() 
    { 
        Console.WriteLine("Hello, World!"); 
    } 
}</div>
```