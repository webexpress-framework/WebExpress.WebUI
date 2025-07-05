![WebExpress](https://raw.githubusercontent.com/ReneSchwarzer/WebExpress.Doc/main/assets/banner.png)

# Introduction
`WebExpress` is a powerful framework for creating modern web applications. This documentation provides a comprehensive overview of the JavaScript UI controls, explains their significance, highlights the differences from server-side controls, and demonstrates how these components can be used not only within `WebExpress` but also in other environments.

# JavaScript UI API
The user interface (UI) is a central component of any web application. Traditionally, server-side controls managed rendering and business logic on the server. With the increasing demand for real-time interactions and dynamic user experiences, the use of JavaScript-based UI elements has grown. `WebExpress` provides the foundation for effectively integrating with JavaScript-based UI elements, enabling developers to create smoother, more responsive applications.

JavaScript UI elements have become indispensable in modern web development as they significantly enhance the user experience. By directly processing updates and interactions in the browser, these elements offer:

- **Smooth, interactive experiences:** Users benefit from faster, more dynamic interactions, similar to desktop applications.
- **Reduced server load:** With client-side logic, the need for constant server communication is reduced.

A major advantage of these JavaScript UI elements is that they are not limited to `WebExpress`. They can be integrated into standalone web applications or used in combination with other frameworks such as `Angular`, `React`, or `Vue.js`. This versatility opens up a wide range of possibilities, allowing the enhancement of any project's user interface with modern, responsive UI elements.

The goal of `WebExpress` is to create a robust, scalable, and efficient system for dynamically linking and interacting with UI elements. Emphasis is placed on modularity, performance, accessibility, and extensibility. The JavaScript classes should be decoupled from the HTML code as much as possible. This creates a clean, maintainable, and modular architecture. The separation helps manage logic entirely in JavaScript while using HTML solely for structure and semantic presentation of content.

- **Separation of logic and presentation**: The HTML code should remain purely semantic and contain no references to the specific implementation in JavaScript.
- **Modularity and scalability**: JavaScript classes should be extendable and maintainable independently of the HTML.
- **Central control**: Introduction of a central controller that handles the initialization and management of containers and instances.
- **Flexibility**: Support for dynamic changes to the DOM, such as adding containers at runtime without modifying the HTML code.
- **Clarity**: Use of an abstracted data structure to configure containers via JavaScript.

# Architecture Overview

The development of modern web applications requires effective and efficient handling of user interfaces and their interactions. `WebExpress` enables the creation of dynamic and responsive web applications. The following is a closer look at the architecture of the JavaScript UI in `WebExpress`, with a focus on the modularity of the components:

```
╔WebExpress.WebUi══════════════════════════════════════════════════════════════════════╗
║                             ┌──────────────────────┐                                 ║
║                             │      Controller      │                                 ║
║                             ├──────────────────────┤                                 ║
║                             │  - Manages Containers│                                 ║
║                             │  - Monitors DOM      │                                 ║
║                             └──────────┬───────────┘                                 ║
║                                        │                                             ║
║                        ┌───────────────┴──────────────┐                              ║
║                        │                              │                              ║
║                        v                              v                              ║
║             ┌──────────────────────┐       ┌──────────────────────┐                  ║
║             │      Container 1     │       │      Container 2     │                  ║
║             ├──────────────────────┤       ├──────────────────────┤                  ║
║             │  - HTML Element      │       │  - HTML Element      │                  ║
║             │  - Semantic Tags     │       │  - Semantic Tags     │                  ║
║             │  - Data Attributes   │       │  - Data Attributes   │                  ║
║             └──────────┬───────────┘       └──────────┬───────────┘                  ║
║                        │                              │                              ║
║                        v                              v                              ║
║             ┌──────────────────────┐       ┌──────────────────────┐                  ║
║             │      Instance 1      │       │      Instance 2      │                  ║
║             ├──────────────────────┤       ├──────────────────────┤                  ║
║             │  - JavaScript Class  │       │  - JavaScript Class  │                  ║
║             │  - Handles Logic     │       │  - Handles Logic     │                  ║
║             │  - Interacts with DOM│       │  - Interacts with DOM│                  ║
║             └──────────┬───────────┘       └──────────┬───────────┘                  ║
║                        │                              │                              ║
║                        v                              v                              ║
║             ┌─────────────────────────────────────────────────────┐                  ║
║             │               jquery event system                   │                  ║
║             └─────────────────────────────────────────────────────┘                  ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

The controller module is a central component for managing all containers and their associated instances. It registers containers during initialization and detects dynamic changes, for example through the use of the `MutationObserver`.

Containers are defined in the HTML DOM structure and implemented with semantic HTML such as `section` or `article` instead of `div`. This structure is provided by the server-side controls in `WebExpress`. Data attributes like data-* can be used to store specific configurations, and accessibility is ensured through aria-* attributes.

Each JavaScript UI instance represents the logic and behavior of a container and includes methods for interactions. The instances are separated from the presentation, enabling a clear separation of logic and DOM.

The jQuery event system functions in the context of WebExpress as a lightweight pub/sub model that efficiently enables message passing between different containers and instances. By utilizing jQuery events, communication is optimized, direct dependencies are minimized, and debugging is simplified. A concrete example from WebExpress: when a form is submitted in Container 1, a custom event can be triggered using jQuery to signal Container 2 to update its display accordingly. This decoupling of components promotes a loosely coupled architecture, where modules can operate independently.

# Example Code
The following example demonstrates how the separation of logic and presentation, the modularity of JavaScript classes, and the central control by the controller are implemented in `WebExpress`. First, the HTML structure is defined:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebExpress Example</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="app.js" defer></script>
</head>
<body>
    <section class="webexpress-container container1">
        <h2>Container 1</h2>
        <button id="button1">Click me</button>
    </section>
    <section class="webexpress-container container2">
        <h2>Container 2</h2>
        <p id="message"></p>
    </section>
</body>
</html>
```

Next follows the JavaScript logic for managing and interacting with the containers:

```javascript
$(document).ready(function() {
    const controller = new Controller();

    // Container 1 Logic
    class Container1 {
        constructor(element) {
            this.element = $(element);
            this.button = this.element.find('#button1');
            this.init();
        }

        init() {
            this.button.on('click', () => {
                $(document).trigger('buttonClicked', ['Button in Container 1 was clicked']);
            });
        }
    }

    // Container 2 Logic
    class Container2 {
        constructor(element) {
            this.element = $(element);
            this.message = this.element.find('#message');
            this.init();
        }

        init() {
            $(document).on('buttonClicked', function(event, data) {
                this.message.text(data);
            }););
        }
    }

    // Controller to manage containers
    class Controller {
        constructor() {
            this.containers = [];
            this.init();
            this.observeMutations();
        }

        init() {
            this.registerContainers();
        }

        // Registers containers based on CSS classes
        registerContainers() {
            $('.webexpress-container').each((index, section) => {
                if ($(section).hasClass('container1')) {
                    this.containers.push(new Container1(section));
                } else if ($(section).hasClass('container2')) {
                    this.containers.push(new Container2(section));
                } else {
                    console.warn(`Unknown container class: ${section.className}`);
                }
            });
        }

        // Observes DOM mutations to dynamically register new containers
        observeMutations() {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        this.registerContainers();
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    // Initialize the Controller
    controller.init();
});
```

In this simple example, the architecture of `WebExpress` is demonstrated by creating two containers (Container1 and Container2), each with its own logic, and communicating via the jquery event system. The `Controller` manages the initialization and registration of the containers.

`Container1` contains a button that triggers an event (`buttonClicked`) on the jquery event system when clicked.
`Container2` listens for the `buttonClicked` event and updates the text content of a paragraph to display the message.

This example shows how the separation of logic and presentation, the modularity of JavaScript classes, and the central control by the controller are implemented in `WebExpress`.