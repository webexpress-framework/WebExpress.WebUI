// register default add-ons immediately
// CONTAINER BLOCK: Allows text and other addons inside
webexpress.webui.EditorAddOns.register("info-box", {
    label: "Info Container",
    icon: "fas fa-info-circle",
    type: "block",
    category: "Widgets",
    isContainer: true,
    content: '<div class="alert alert-info mb-0"><strong>Note:</strong> Type here...</div>',
    description: "A nestable container for information."
});

webexpress.webui.EditorAddOns.register("warning-box", {
    label: "Warning Widget",
    icon: "fas fa-exclamation-triangle",
    type: "block",
    category: "Widgets",
    isContainer: false,
    content: '<div class="alert alert-warning mb-0"><strong>Warning:</strong> Static alert.</div>',
    description: "Inserts a static warning box."
});

    // --- Layout ---
webexpress.webui.EditorAddOns.register("card-container", {
    label: "Card Container",
    icon: "far fa-square",
    type: "block",
    category: "Layout",
    isContainer: true,
    content: '<p>Card content goes here...</p>',
    description: "A standard card frame."
});

webexpress.webui.EditorAddOns.register("hr-styled", {
    label: "Styled Line",
    icon: "fas fa-minus",
    type: "block",
    category: "Layout",
    content: '<hr style="border: 0; height: 1px; background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0)); margin:0;">',
    description: "Inserts a gradient horizontal rule."
});

    // --- Inline Elements ---
webexpress.webui.EditorAddOns.register("badge-primary", {
    label: "Badge (Blue)",
    icon: "fas fa-tag",
    type: "inline",
    category: "Inline",
    properties: [{ name: "text", label: "Text", default: "New" }],
    renderer: (data) => `<span class="badge bg-primary">${data.text || 'New'}</span>`,
    description: "Inline badge."
});